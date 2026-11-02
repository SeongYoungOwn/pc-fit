const session = require('express-session');
const MemoryStore = require('express-session').MemoryStore;

function createSessionMiddleware() {
  const isProd = process.env.NODE_ENV === 'production';
  return session({
    name: 'pcfit_session',
    secret: process.env.SESSION_SECRET || 'pcfit-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore(), // Explicit MemoryStore for MVP
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    }
  });
}

module.exports = { createSessionMiddleware };