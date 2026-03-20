# Kindo School Payments

A school field trip payment system where parents can view trip details, register their child, make a payment, and receive confirmation. Built as a coding challenge for the Kindo Senior Full Stack Developer role.

## Tech Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React + TypeScript (Vite)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form

## Project Structure

```
Kindo-Test/
├── backend/
│   ├── kindo/                      # Django project config
│   └── payments/                   # Main application
│       ├── models.py               # Trip, Registration, Transaction
│       ├── serializers.py          # DRF serializers (delegates card validation)
│       ├── views.py                # API endpoints
│       ├── services.py             # PaymentService — orchestration only
│       ├── payment_gateway.py      # PaymentGateway ABC (DIP)
│       ├── legacy_adapter.py       # Wraps LegacyPaymentProcessor
│       ├── legacy_payment.py       # Provided legacy API simulator
│       ├── card_details.py         # Card validation value object
│       ├── transaction_recorder.py # Transaction persistence
│       ├── registration_updater.py # Registration status updates
│       ├── fixtures/               # Seed data
│       └── tests/                  # Unit tests
└── frontend/
    └── src/
        ├── api/client.ts           # All API fetch calls
        ├── types/index.ts          # TypeScript interfaces
        └── components/
            └── wizard/             # Multi-step payment wizard + reducer
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Environment Variables

Copy the example env files and adjust as needed:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

See [PLANNING.md](PLANNING.md) for the full list of environment variables.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata sample_trips
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8000` (configured in `vite.config.ts`).

## API Endpoints

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| GET    | `/api/trips/`              | List all trips           |
| GET    | `/api/trips/{id}/`         | Get trip details         |
| POST   | `/api/registrations/`      | Register child for trip  |
| GET    | `/api/registrations/{id}/` | Get registration details |
| POST   | `/api/payments/`           | Process payment          |

## Architecture

- **Services layer**: `PaymentService` orchestrates the payment flow by delegating to focused collaborators (`TransactionRecorder`, `RegistrationUpdater`), each with a single responsibility.
- **Dependency Inversion**: Business logic depends on a `PaymentGateway` abstraction, not the concrete `LegacyPaymentProcessor`. A `LegacyPaymentAdapter` bridges the two.
- **Information Expert**: Card validation (Luhn, expiry, CVV) lives in a `CardDetails` value object — the entity that owns the data does the work.
- **Frontend state machine**: The payment wizard uses `useReducer` with typed actions (`SELECT_TRIP`, `REGISTER_SUCCESS`, `PAYMENT_SUCCESS`, etc.) rather than loosely coupled `useState` calls.

## Features

- View available school trips with remaining capacity
- Multi-step wizard: Trip Details -> Registration -> Payment -> Confirmation
- Integration with legacy payment processor (via adapter pattern)
- Card validation (Luhn check, expiry, CVV)
- Mobile-responsive design (Tailwind, mobile-first)
- Loading states during payment processing
- Error handling with retry support for transient failures

## Testing

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

- **Backend**: Models, serializers, views, services, and CardDetails all tested. Service tests use a `FakePaymentGateway` — no dependency on the legacy processor. Each test is isolated via Django `TestCase` transaction rollback.
- **Frontend**: `wizardReducer` tested as a pure function (no DOM, no mocks). Component tests with React Testing Library.

## AI Tool Usage

Claude Code (Claude Opus 4.6) was used as a coding assistant throughout development for:

- Writing boilerplate (models, serializers, test scaffolding)
- Generating test cases from existing implementation code
- Tailwind CSS utility class composition
- Reviewing architecture decisions documented in PLANNING.md

All code was reviewed and validated before committing. The planning, architecture decisions, and design patterns were human-directed.
