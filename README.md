# Phonebook SPA — Class Practice

A full-stack Single Page Application (SPA) built as a class exercise for **INF 653 Back-end Web Development**. It demonstrates session-based authentication and CSRF protection on an Express backend, consumed by a React frontend.

---

## Project Structure

```
spa-class-practice/
├── backend/          # Express REST API
│   ├── server.js
│   └── package.json
└── frontend/         # React + Vite SPA
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## Features

- **Session-based authentication** via `express-session`
- **CSRF protection** via `csurf` (token delivered through `/api/csrf-token`)
- **In-memory contact store** (name, phone, email)
- React frontend using **Axios** with credentials for cross-origin requests
- Vite dev server proxying API calls to the Express backend

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd spa-class-practice
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Run the backend

```bash
cd backend
npm run dev      # uses nodemon for auto-reload
# or
npm start        # plain node
```

The API server starts on **http://localhost:5000**.

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

The Vite dev server starts on **http://localhost:5173** and proxies `/api` requests to the backend.

---

## API Endpoints

| Method | Path              | Auth Required | Description                        |
|--------|-------------------|---------------|------------------------------------|
| GET    | `/api/csrf-token` | No            | Returns a fresh CSRF token         |
| POST   | `/api/login`      | No            | Logs in and creates a session      |
| POST   | `/api/logout`     | Yes           | Destroys the session               |
| GET    | `/api/contacts`   | Yes           | Lists all contacts                 |
| POST   | `/api/contacts`   | Yes           | Creates a new contact              |

All state-changing requests must include the `X-CSRF-Token` header.

---

## Demo Credentials

| Username | Password    |
|----------|-------------|
| admin    | password123 |

> **Note:** Credentials are hard-coded for class demonstration purposes only. In production, use a database and hashed passwords.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Node.js, Express, express-session, csurf, cors, cookie-parser |
| Frontend | React 19, Vite, Axios               |

---

## Course

**INF 653 — Back-end Web Development**  
American University of Phnom Penh · Spring 2026
