# Technical Test - Orders Management

This repository contains a full-stack solution for managing products and orders. The backend exposes a REST API built with Express, Sequelize, and MySQL, while the frontend is a React SPA created with Vite that consumes the API.

## Project structure

```
.
├── backend/   # Express + Sequelize API
└── frontend/  # React UI built with Vite
```

## Backend

### Environment variables

Copy `backend/.env.example` to `backend/.env` and adjust the values to point to your MySQL instance:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=orders_db
DB_USER=root
DB_PASSWORD=secret
PORT=4000
```

### Install dependencies

```bash
cd backend
npm install
```

### Database setup

Make sure the configured MySQL database exists. The application uses Sequelize to create the required tables on startup. You can optionally run `node src/seed.js` to populate initial data.

### Run the API

```bash
npm run dev
```

The API will be available at `http://localhost:4000`. Useful endpoints include:

- `GET /api/products` – list products
- `POST /api/products` – create a product
- `PUT /api/products/:id` – update a product
- `DELETE /api/products/:id` – remove a product
- `GET /api/orders` – list orders with items
- `POST /api/orders` – create an order with items
- `PUT /api/orders/:id` – edit an order (unless completed)
- `PATCH /api/orders/:id/status` – update status (`Pending`, `InProgress`, `Completed`)
- `DELETE /api/orders/:id` – delete an order (unless completed)

## Frontend

### Install dependencies

```bash
cd frontend
npm install
```

> **Note:** Installing dependencies requires access to the npm registry. If the command fails (for example in restricted environments), install the packages when network access is available.

### Configure environment

The UI expects the API to be available at `http://localhost:4000/api`. If you expose the backend elsewhere, create a `.env` file inside `frontend/` and set:

```
VITE_API_BASE_URL=http://your-host:port/api
```

### Run the UI

```bash
npm run dev
```

The application will start at `http://localhost:5173`.

## Features

- Orders list with totals, status badges, editing, deletion, and status changes.
- Unified form to create or edit orders with automatic calculations, product management, and safeguards for completed orders.
- Product catalog maintenance (CRUD) from the UI.
- Shared modals, formatting helpers, and responsive styling for a clean experience.

## Testing

Automated tests are not included. You can interact with the UI locally and verify API responses using tools such as Postman or curl.
