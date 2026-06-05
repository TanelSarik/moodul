import crypto from 'node:crypto';

export function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  return req.session.csrfToken;
}

export function csrfMiddleware(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.locals.csrfToken = ensureCsrfToken(req);
    return next();
  }

  const token = req.body?._csrf;
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).render('error', {
      title: 'CSRF viga',
      message: 'Vormi turvakontroll ebaõnnestus. Palun proovi uuesti.',
    });
  }

  res.locals.csrfToken = ensureCsrfToken(req);
  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect('/admin/login');
  }

  return next();
}
