# Stock Pilot

A full-stack inventory management and Point of Sale (POS) dashboard for small businesses.

**Live app:** [stockpilot.space](https://www.stockpilot.space)

## Features

- **POS System** — Process sales, apply discounts, and generate invoices
- **Inventory Management** — Track products with stock levels, SKUs, barcodes, and pricing
- **Categories & Suppliers** — Organize products and manage supplier contacts
- **Order History** — Browse and search past transactions with invoice view
- **Sales Reports** — Revenue and profit charts with date range and category filters
- **Google OAuth** — Sign in with Google, no passwords required
- **Multi-store ready** — Each store has its own isolated data and timezone/currency settings

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Recharts |
| Backend | Express 5, TypeScript, Node.js |
| Database | MySQL (stored procedures) |
| Auth | Google OAuth + JWT (access) + HttpOnly refresh cookie |
| Frontend hosting | Vercel |
| Backend hosting | Railway |

## Local Development

### Prerequisites

- Node.js 18+
- MySQL 8+ instance

### Backend

```bash
cd backend
npm install
```

Create a `.env` file (see `.env` for reference):

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=stockpilot

GOOGLE_CLIENT_ID=your_google_client_id

JWT_ACCESS_SECRET=your_access_secret
ACCESS_EXP_MINUTES=15

REFRESH_HMAC_KEY=your_refresh_key
REFRESH_EXP_DAYS=30

CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

```bash
npm run dev   # starts on port 5000
```

### Frontend

```bash
cd stackpilot
npm install
npm run dev   # starts on port 3000
```

> The frontend API base URL points to the Railway production backend by default (`stackpilot/utils/api.ts`). Update it to `http://localhost:5000/api` for local full-stack development.

## Project Structure

```
stock-pilot/
├── backend/          # Express API
│   └── src/
│       ├── config/       # DB connection pool
│       ├── controllers/  # Route handlers
│       ├── db/
│       │   ├── callProc.ts       # MySQL stored procedure runner
│       │   └── procedures/       # Typed wrappers per domain
│       ├── middlewares/  # Auth + error handling
│       ├── routes/       # Express routers
│       └── services/
└── stackpilot/       # React frontend
    ├── components/   # Shared UI components
    ├── context/      # AuthContext (auth state + localStorage)
    ├── pages/        # One component per page/feature
    └── utils/
        ├── api.ts    # All API calls + token refresh logic
        └── hooks.ts
```

## API Overview

All routes are prefixed with `/api`. The `/health` and `/api/auth` routes are public; everything else requires a valid JWT.

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/google-login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| Categories | `GET /POST /api/categories`, `PUT /DELETE /api/categories/:id` |
| Suppliers | `GET /POST /api/suppliers`, `PUT /DELETE /api/suppliers/:id` |
| Products | `GET /POST /api/products`, `PUT /DELETE /api/products/:id`, `GET /api/products/search` |
| Orders | `POST /api/orders/process`, `GET /api/orders/history` |
| Reports | `GET /api/reports/sales` |
