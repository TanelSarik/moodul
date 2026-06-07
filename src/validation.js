const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s-]{0,30}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function clean(value) {
  return String(value ?? '').trim();
}

export function validateLogin(body) {
  const email = clean(body.email).toLowerCase();
  const password = String(body.password ?? '');
  const errors = {};

  if (!emailPattern.test(email)) {
    errors.email = 'Sisesta korrektne e-posti aadress.';
  }

  if (!password) {
    errors.password = 'Parool on kohustuslik.';
  }

  return { values: { email, password }, errors };
}

export function validateContact(body) {
  const values = {
    name: clean(body.name),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    message: clean(body.message),
  };
  const errors = {};

  if (values.name.length < 2 || values.name.length > 100) {
    errors.name = 'Nimi peab olema 2-100 märki.';
  }

  if (!emailPattern.test(values.email) || values.email.length > 160) {
    errors.email = 'Sisesta korrektne e-posti aadress.';
  }

  if (!phonePattern.test(values.phone)) {
    errors.phone = 'Telefon võib sisaldada ainult numbreid, tühikuid ja märke +()- .';
  }

  if (values.message.length < 10 || values.message.length > 2000) {
    errors.message = 'Sõnum peab olema 10-2000 märki.';
  }

  return { values, errors };
}

export function validateDish(body) {
  const price = Number.parseFloat(String(body.price ?? '').replace(',', '.'));
  const spiciness = Number.parseInt(body.spiciness, 10);
  const values = {
    name: clean(body.name),
    slug: clean(body.slug).toLowerCase(),
    description: clean(body.description),
    images: clean(body.images),
    price_cents: Number.isFinite(price) ? Math.round(price * 100) : NaN,
    spiciness,
    ingredients: clean(body.ingredients),
    allergens: clean(body.allergens),
  };
  const errors = {};

  if (values.name.length < 2 || values.name.length > 120) {
    errors.name = 'Nimi peab olema 2-120 märki.';
  }

  if (!slugPattern.test(values.slug) || values.slug.length > 140) {
    errors.slug = 'Slug võib sisaldada väiketähti, numbreid ja sidekriipse.';
  }

  if (values.description.length < 10 || values.description.length > 2000) {
    errors.description = 'Kirjeldus peab olema 10-2000 märki.';
  }

  const imageUrls = values.images
    .split(',')
    .map((image) => image.trim())
    .filter(Boolean);

  if (
    imageUrls.length === 0 ||
    imageUrls.some((image) => !image.startsWith('/') && !image.startsWith('https://'))
  ) {
    errors.images = 'Lisa vähemalt üks pilt. Iga pilt peab olema kohalik tee (/images/...) või HTTPS URL.';
  }

  if (!Number.isInteger(values.price_cents) || values.price_cents < 1 || values.price_cents > 100000) {
    errors.price = 'Hind peab olema vahemikus 0.01-1000.00.';
  }

  if (!Number.isInteger(values.spiciness) || values.spiciness < 0 || values.spiciness > 5) {
    errors.spiciness = 'Vürtsisus peab olema 0-5.';
  }

  if (values.ingredients.length < 2 || values.ingredients.length > 1000) {
    errors.ingredients = 'Koostis peab olema 2-1000 märki.';
  }

  if (values.allergens.length > 1000) {
    errors.allergens = 'Allergeenid võivad olla kuni 1000 märki.';
  }

  return { values, errors };
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function dishToFormValues(dish = {}) {
  return {
    name: dish.name ?? '',
    slug: dish.slug ?? '',
    description: dish.description ?? '',
    images: dish.images ?? '',
    price: Number.isInteger(dish.price_cents) ? (dish.price_cents / 100).toFixed(2) : '',
    spiciness: dish.spiciness ?? 0,
    ingredients: dish.ingredients ?? '',
    allergens: dish.allergens ?? '',
  };
}
