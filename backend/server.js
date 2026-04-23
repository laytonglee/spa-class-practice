const express = require('express');
const session = require('express-session');
const csrf = require('csurf');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 5000;

// ---------------------------------------------------------------------------
// In-memory data store
// ---------------------------------------------------------------------------
const contacts = [];

// Predefined demo users (in a real app these come from a database)
const users = [
  { id: 1, username: 'admin', password: 'password123' },
];

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Session — secret should come from an environment variable in production
app.use(session({
  secret: process.env.SESSION_SECRET || 'phonebook-session-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,        // set to true when running behind HTTPS in production
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60, // 1 hour
  },
}));

// CSRF protection — stores its secret in a cookie named _csrf
const csrfProtection = csrf({ cookie: { httpOnly: false, sameSite: 'lax' } });
app.use(csrfProtection);

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }
  next();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/csrf-token  — public, returns a fresh CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  req.session.user = { id: user.id, username: user.username };
  res.json({ message: 'Login successful', username: user.username });
});

// POST /api/logout — protected by session + CSRF
app.post('/api/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out. Please try again.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

// GET /api/contacts — protected by session + CSRF
app.get('/api/contacts', requireAuth, (req, res) => {
  res.json(contacts);
});

// POST /api/contacts — protected by session + CSRF
app.post('/api/contacts', requireAuth, (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  const contact = {
    id: Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
  };

  contacts.push(contact);
  res.status(201).json(contact);
});

// DELETE /api/contacts/:id — protected by session + CSRF
app.delete('/api/contacts/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = contacts.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Contact not found.' });
  }

  contacts.splice(index, 1);
  res.json({ message: 'Contact deleted successfully.' });
});

// ---------------------------------------------------------------------------
// Error handlers
// ---------------------------------------------------------------------------

// Invalid / missing CSRF token
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res
      .status(403)
      .json({ message: 'Invalid or missing CSRF token. Request rejected.' });
  }
  next(err);
});

// Generic server error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`PhoneBook backend running on http://localhost:${PORT}`);
});
