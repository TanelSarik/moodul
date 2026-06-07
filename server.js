import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './src/db.js';
import { csrfMiddleware, ensureCsrfToken, requireAdmin } from './src/security.js';
import {
  dishToFormValues,
  hasErrors,
  validateContact,
  validateDish,
  validateLogin,
} from './src/validation.js';

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  console.error('SESSION_SECRET must be set in .env and be at least 32 characters.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const cookieSecure = process.env.COOKIE_SECURE === 'true';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : 0);

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/assets', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    name: 'midnight_ramen_sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure,
    },
  }),
);
app.use((req, res, next) => {
  res.locals.isAdmin = Boolean(req.session.adminId);
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});
app.use(csrfMiddleware);

const dishListStatement = db.prepare('SELECT * FROM dishes ORDER BY name ASC');
const featuredDishStatement = db.prepare('SELECT * FROM dishes ORDER BY id ASC LIMIT 5');
const firstDishStatement = db.prepare('SELECT * FROM dishes ORDER BY id ASC LIMIT 1');
const dishBySlugStatement = db.prepare('SELECT * FROM dishes WHERE slug = ?');
const dishByIdStatement = db.prepare('SELECT * FROM dishes WHERE id = ?');
const adminByEmailStatement = db.prepare('SELECT * FROM admins WHERE email = ?');
const contactListStatement = db.prepare(
  'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 20',
);

function money(cents) {
  return `${(cents / 100).toFixed(2)} €`;
}

function firstImage(images) {
  return String(images ?? '')
    .split(',')
    .map((image) => image.trim())
    .filter(Boolean)[0] || '/images/ramen-1.webp.png';
}

function renderDishForm(res, options) {
  return res.render('admin/dish-form', {
    ...options,
    values: dishToFormValues(options.values),
  });
}

app.get(['/', '/index.html'], (req, res) => {
  res.render('index', {
    title: 'Midnight Ramen',
    dishes: featuredDishStatement.all(),
    money,
    firstImage,
  });
});

app.get(['/dishes', '/dishes.html'], (req, res) => {
  res.render('dishes', {
    title: 'Dishes | Midnight Ramen',
    dishes: dishListStatement.all(),
    money,
    firstImage,
  });
});

app.get('/dish.html', (req, res) => {
  const dish = firstDishStatement.get();
  if (!dish) {
    return res.status(404).render('error', {
      title: 'Roogi ei leitud',
      message: 'Menüüs ei ole veel roogi.',
    });
  }

  return res.redirect(`/dish/${dish.slug}`);
});

app.get('/dish/:slug', (req, res) => {
  const dish = dishBySlugStatement.get(req.params.slug);
  if (!dish) {
    return res.status(404).render('error', {
      title: 'Rooga ei leitud',
      message: 'Sellise aadressiga rooga menüüs ei ole.',
    });
  }

  return res.render('dish', {
    title: `${dish.name} | Midnight Ramen`,
    dish,
    money,
    firstImage,
  });
});

app.get(['/reservations', '/reservations.html'], (req, res) => {
  res.render('reservations', { title: 'Reservations | Midnight Ramen' });
});

app.get(['/contact', '/contact.html'], (req, res) => {
  res.render('contact', {
    title: 'Contact | Midnight Ramen',
    values: { name: '', email: '', phone: '', message: '' },
    errors: {},
    success: false,
  });
});

app.post('/contact', (req, res) => {
  const { values, errors } = validateContact(req.body);
  if (hasErrors(errors)) {
    return res.status(422).render('contact', {
      title: 'Contact | Midnight Ramen',
      values,
      errors,
      success: false,
    });
  }

  db.prepare(`
    INSERT INTO contact_messages (name, email, phone, message)
    VALUES (?, ?, ?, ?)
  `).run(values.name, values.email, values.phone, values.message);

  return res.render('contact', {
    title: 'Contact | Midnight Ramen',
    values: { name: '', email: '', phone: '', message: '' },
    errors: {},
    success: true,
  });
});

app.get('/admin/login', (req, res) => {
  res.render('admin/login', {
    title: 'Admin login',
    values: { email: '' },
    errors: {},
  });
});

app.post('/admin/login', async (req, res, next) => {
  const { values, errors } = validateLogin(req.body);
  if (hasErrors(errors)) {
    return res.status(422).render('admin/login', {
      title: 'Admin login',
      values,
      errors,
    });
  }

  const admin = adminByEmailStatement.get(values.email);
  const passwordMatches = admin
    ? await bcrypt.compare(values.password, admin.password_hash)
    : false;

  if (!passwordMatches) {
    return res.status(401).render('admin/login', {
      title: 'Admin login',
      values: { email: values.email },
      errors: { form: 'Vale e-post või parool.' },
    });
  }

  return req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }

    req.session.adminId = admin.id;
    req.session.flash = 'Oled sisse logitud.';
    ensureCsrfToken(req);

    return req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }

      return res.redirect('/admin');
    });
  });
});

app.post('/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.get('/admin', requireAdmin, (req, res) => {
  res.render('admin/index', {
    title: 'Admin',
    dishes: dishListStatement.all(),
    messages: contactListStatement.all(),
    money,
  });
});

app.get('/admin/dishes/new', requireAdmin, (req, res) => {
  renderDishForm(res, {
    title: 'Lisa roog',
    action: '/admin/dishes',
    submitLabel: 'Lisa roog',
    values: {},
    errors: {},
  });
});

app.post('/admin/dishes', requireAdmin, (req, res) => {
  const { values, errors } = validateDish(req.body);
  if (hasErrors(errors)) {
    return res.status(422).render('admin/dish-form', {
      title: 'Lisa roog',
      action: '/admin/dishes',
      submitLabel: 'Lisa roog',
      values: { ...req.body, price: req.body.price },
      errors,
    });
  }

  try {
    db.prepare(`
      INSERT INTO dishes (
        name, slug, description, images, price_cents, spiciness, ingredients, allergens
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      values.name,
      values.slug,
      values.description,
      values.images,
      values.price_cents,
      values.spiciness,
      values.ingredients,
      values.allergens,
    );
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(422).render('admin/dish-form', {
        title: 'Lisa roog',
        action: '/admin/dishes',
        submitLabel: 'Lisa roog',
        values: { ...req.body, price: req.body.price },
        errors: { slug: 'Selline slug on juba kasutusel.' },
      });
    }
    throw error;
  }

  req.session.flash = 'Roog lisatud.';
  return res.redirect('/admin');
});

app.get('/admin/dishes/:id/edit', requireAdmin, (req, res) => {
  const dish = dishByIdStatement.get(req.params.id);
  if (!dish) {
    return res.status(404).render('error', {
      title: 'Rooga ei leitud',
      message: 'Muudetavat rooga ei leitud.',
    });
  }

  return renderDishForm(res, {
    title: 'Muuda rooga',
    action: `/admin/dishes/${dish.id}`,
    submitLabel: 'Salvesta',
    values: dish,
    errors: {},
  });
});

app.post('/admin/dishes/:id', requireAdmin, (req, res) => {
  const dish = dishByIdStatement.get(req.params.id);
  if (!dish) {
    return res.status(404).render('error', {
      title: 'Rooga ei leitud',
      message: 'Muudetavat rooga ei leitud.',
    });
  }

  const { values, errors } = validateDish(req.body);
  if (hasErrors(errors)) {
    return res.status(422).render('admin/dish-form', {
      title: 'Muuda rooga',
      action: `/admin/dishes/${dish.id}`,
      submitLabel: 'Salvesta',
      values: { ...req.body, price: req.body.price },
      errors,
    });
  }

  try {
    db.prepare(`
      UPDATE dishes
      SET
        name = ?,
        slug = ?,
        description = ?,
        images = ?,
        price_cents = ?,
        spiciness = ?,
        ingredients = ?,
        allergens = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      values.name,
      values.slug,
      values.description,
      values.images,
      values.price_cents,
      values.spiciness,
      values.ingredients,
      values.allergens,
      dish.id,
    );
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(422).render('admin/dish-form', {
        title: 'Muuda rooga',
        action: `/admin/dishes/${dish.id}`,
        submitLabel: 'Salvesta',
        values: { ...req.body, price: req.body.price },
        errors: { slug: 'Selline slug on juba kasutusel.' },
      });
    }
    throw error;
  }

  req.session.flash = 'Roog salvestatud.';
  return res.redirect('/admin');
});

app.post('/admin/dishes/:id/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM dishes WHERE id = ?').run(req.params.id);
  req.session.flash = 'Roog kustutatud.';
  return res.redirect('/admin');
});

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Lehte ei leitud',
    message: 'Soovitud lehte ei ole olemas.',
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).render('error', {
    title: 'Serveri viga',
    message: 'Midagi läks valesti. Palun proovi hiljem uuesti.',
  });
});

app.listen(port, () => {
  console.log(`Midnight Ramen backend running at http://localhost:${port}`);
});
