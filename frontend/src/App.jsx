import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// Bonus: send cookies (session) on every request across origins
axios.defaults.withCredentials = true;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [loginError, setLoginError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // ------------------------------------------------------------------
  // Fetch CSRF token on mount â€” stored in state for use in request headers
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await axios.get("/api/csrf-token");
        setCsrfToken(res.data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
      }
    };
    fetchCsrfToken();
  }, []);

  // Load contacts whenever the user logs in
  useEffect(() => {
    if (isLoggedIn) {
      fetchContacts();
    }
  }, [isLoggedIn]);

  const fetchContacts = async () => {
    try {
      const res = await axios.get("/api/contacts");
      setContacts(res.data);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    }
  };

  // ------------------------------------------------------------------
  // Auth handlers
  // ------------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setSubmitLoading(true);
    try {
      const res = await axios.post("/api/login", loginForm, {
        headers: { "x-csrf-token": csrfToken },
      });
      setIsLoggedIn(true);
      setUsername(res.data.username);
      setLoginForm({ username: "", password: "" });
    } catch (err) {
      setLoginError(
        err.response?.data?.message || "Login failed. please try again.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "/api/logout",
        {},
        {
          headers: { "x-csrf-token": csrfToken },
        },
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggedIn(false);
      setUsername("");
      setContacts([]);
      setShowAddForm(false);
      // Refresh CSRF token after the session is destroyed
      try {
        const res = await axios.get("/api/csrf-token");
        setCsrfToken(res.data.csrfToken);
      } catch (err) {
        console.error("Failed to refresh CSRF token:", err);
      }
    }
  };

  // ------------------------------------------------------------------
  // Contact handlers
  // ------------------------------------------------------------------
  const handleAddContact = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitLoading(true);
    try {
      const res = await axios.post("/api/contacts", contactForm, {
        headers: { "x-csrf-token": csrfToken },
      });
      setContacts((prev) => [...prev, res.data]);
      setContactForm({ name: "", phone: "", email: "" });
      setFormSuccess("Contact saved successfully.");
      setTimeout(() => {
        setFormSuccess("");
        setShowAddForm(false);
      }, 1500);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Failed to add contact. Please try again.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await axios.delete(`/api/contacts/${id}`, {
        headers: { "x-csrf-token": csrfToken },
      });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  };

  const openAddForm = () => {
    setContactForm({ name: "", phone: "", email: "" });
    setFormError("");
    setFormSuccess("");
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    setContactForm({ name: "", phone: "", email: "" });
    setFormError("");
    setFormSuccess("");
    setShowAddForm(false);
  };

  // ------------------------------------------------------------------
  // Login view
  // ------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-icon">PB</div>
            <h1 className="auth-title">PhoneBook</h1>
            <p className="auth-subtitle">Sign in to manage your contacts</p>
          </div>

          {loginError && (
            <div className="alert alert-error" role="alert">
              {loginError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                placeholder="Enter your username"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitLoading}
            >
              {submitLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-hint">
            <span className="hint-label">Demo credentials</span>
            <span>
              <strong>admin</strong> / <strong>password123</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Authenticated PhoneBook view
  // ------------------------------------------------------------------
  return (
    <div className="app-layout">
      {/* ---- Header ---- */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon-sm">PB</div>
            <span className="brand-name">PhoneBook</span>
          </div>
          <div className="header-right">
            <span className="welcome-msg">
              Welcome, <strong>{username}</strong>
            </span>
            <button className="btn btn-outline-white" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ---- Main ---- */}
      <main className="main-content">
        <div className="content-container">
          {/* Page heading row */}
          <div className="page-header">
            <div className="page-header-left">
              <h2 className="page-title">Contacts</h2>
              <span className="contact-badge">
                {contacts.length}{" "}
                {contacts.length === 1 ? "contact" : "contacts"}
              </span>
            </div>
            <button className="btn btn-primary" onClick={openAddForm}>
              Add Contact
            </button>
          </div>

          {/* ---- Add Contact Form ---- */}
          {showAddForm && (
            <div className="form-card">
              <div className="form-card-header">
                <h3>New Contact</h3>
                <button
                  className="btn-close"
                  onClick={closeAddForm}
                  aria-label="Close form"
                >
                  &times;
                </button>
              </div>

              {formError && (
                <div className="alert alert-error" role="alert">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="alert alert-success" role="status">
                  {formSuccess}
                </div>
              )}

              <form
                className="contact-form"
                onSubmit={handleAddContact}
                noValidate
              >
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="c-name">
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      placeholder="Jane Smith"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="c-phone">
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      id="c-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="c-email">
                    Email Address <span className="optional">(optional)</span>
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    placeholder="jane@example.com"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={closeAddForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitLoading}
                  >
                    {submitLoading ? "Saving..." : "Save Contact"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ---- Contact List ---- */}
          {contacts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>No contacts yet</h3>
              <p>Add your first contact using the button above.</p>
            </div>
          ) : (
            <div className="contacts-grid">
              {contacts.map((contact) => (
                <div key={contact.id} className="contact-card">
                  <div className="contact-avatar">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <p className="contact-name">{contact.name}</p>
                    <p className="contact-phone">{contact.phone}</p>
                    {contact.email && (
                      <p className="contact-email">{contact.email}</p>
                    )}
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => handleDeleteContact(contact.id)}
                    aria-label={`Remove ${contact.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ---- Footer ---- */}
      <footer className="app-footer">
        <p>PhoneBook &mdash; Session Auth and CSRF Protected</p>
      </footer>
    </div>
  );
}

export default App;
