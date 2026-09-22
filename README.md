# Transaction Categorizer & Spending Insights API

A small FastAPI, PostgreSQL, and React project for ingesting bank-style transactions, categorizing merchant descriptions, and returning spending insights for the logged-in user.

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Frontend: React with Vite
- Authentication: JWT bearer tokens

## Features

- Register and log in with JWT authentication.
- `POST /transactions` accepts a batch of transactions.
- Merchant descriptions are categorized as groceries, transport, dining, subscriptions, entertainment, or other.
- `GET /insights/monthly` returns monthly spend totals per category using PostgreSQL aggregation.
- `GET /insights/anomalies` flags transactions above the user's category average plus two standard deviations.
- The React frontend provides login, transaction entry, category summaries, anomaly display, and responsive navigation.

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers and dependencies
│   │   ├── core/         # Settings and security helpers
│   │   ├── db/           # SQLAlchemy engine/session setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Categorization and insight queries
│   │   └── main.py       # FastAPI application entry point
│   └── tests/            # Backend tests
├── frontend/
│   ├── src/
│   │   ├── api/          # HTTP client helpers
│   │   ├── App.jsx       # React application
│   │   ├── main.jsx      # Vite entry point
│   │   └── styles.css    # Application styles
│   └── package.json
└── docker-compose.yml    # Local PostgreSQL service
```

## Local Setup

Copy the example environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Run the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. Tables are created on startup for this exercise.

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_API_BASE_URL` from `frontend/.env`; the example points to `http://localhost:8000`.

## API Overview

Register:

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Log in:

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

Create transactions:

```http
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactions": [
    {
      "amount": 7.50,
      "merchant_description": "STARBUCKS #4521",
      "date": "2026-09-22"
    },
    {
      "amount": 31.40,
      "merchant_description": "UBER TRIP",
      "date": "2026-09-22"
    }
  ]
}
```

Fetch insights:

```http
GET /insights/monthly
Authorization: Bearer <token>

GET /insights/anomalies
Authorization: Bearer <token>
```

## Categorization Approach

The backend uses deterministic regex keyword matching against the merchant description. For example, merchants containing `starbucks` are categorized as dining, `uber` as transport, and `netflix` as subscriptions. If no pattern matches, the transaction falls back to `other`.

This is intentionally simple, explainable, and appropriate for a short take-home exercise. The frontend can optionally send a category, but if it does not, the backend auto-categorizes the transaction.

## Anomaly Threshold

The anomaly endpoint compares transactions against the user's historical transactions in the same category:

```text
amount > category mean + 2 * category standard deviation
```

The query calculates category average, population standard deviation, and count in PostgreSQL. Categories with only one transaction are ignored because there is no meaningful history for comparison.

## Tests

Run backend tests from the `backend` directory:

```bash
source .venv/bin/activate
pytest
```
