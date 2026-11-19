# SPEX Store - Phase 3 Full Stack

Phase 3 connects the React frontend to the Node.js/Express backend and PostgreSQL/Neon database.

## Project structure

```text
spex-phase3-fullstack/
├── frontend/
└── backend/
```

## 1. Database

Use Neon PostgreSQL and run:

```text
backend/database/schema.sql
```

in the Neon SQL Editor.

## 2. Backend

```bash
cd backend
npm install
```

Create `.env` from `.env.example`:

```env
PORT=5000
DATABASE_URL=YOUR_NEON_DATABASE_URL
FRONTEND_URL=http://localhost:5173
```

Start:

```bash
npm run dev
```

Test:

```text
http://localhost:5000/api/health
http://localhost:5000/api/products
```

## 3. Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start:

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## 4. End-to-end flow

```text
React Product List
      ↓
Node /api/products
      ↓
Neon PostgreSQL

React Cart
      ↓
Checkout
      ↓
POST /api/orders
      ↓
Node validates products + prices + stock
      ↓
PostgreSQL transaction
      ↓
Customer + Order + Order Items
      ↓
Stock reduced
      ↓
Invoice page
```

## Important

The frontend does not send trusted prices to the order API. The backend reads current prices from PostgreSQL and calculates subtotal, discount, GST and total.

Authentication/login is intentionally not included in Phase 3.
