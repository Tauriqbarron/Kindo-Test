# Kindo School Payments

A full-stack school field trip payment platform where parents can manage children, register for trips, make payments, withdraw registrations, and track account credits. Built as a coding challenge for the Kindo Senior Full Stack Developer role.

## Tech Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React 19 + TypeScript (Vite)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Auth**: Token-based authentication (DRF)

## Project Structure

```
Kindo-Test/
├── backend/
│   ├── kindo/                      # Django project config
│   ├── accounts/                   # User accounts & child management
│   └── payments/                   # Core application
│       ├── models.py               # Trip, Registration, Transaction, Withdrawal, AccountCredit
│       ├── serializers.py          # DRF serializers (delegates card validation)
│       ├── views.py                # API endpoints (trips, payments, withdrawals, credits, dashboard)
│       ├── services.py             # PaymentService — orchestration only
│       ├── withdrawal_service.py   # WithdrawalService — refund/credit orchestration
│       ├── payment_gateway.py      # PaymentGateway ABC + ProcessResult/RefundResult dataclasses
│       ├── legacy_adapter.py       # Wraps LegacyPaymentProcessor
│       ├── legacy_payment.py       # Provided legacy API simulator
│       ├── card_details.py         # Card validation value object (Luhn, expiry, CVV)
│       ├── transaction_recorder.py # Transaction persistence
│       ├── registration_updater.py # Registration status updates
│       ├── fixtures/               # Seed data
│       └── tests/                  # Unit tests (models, views, services, serializers, card_details)
└── frontend/
    └── src/
        ├── api/client.ts           # All API fetch calls
        ├── types/index.ts          # TypeScript interfaces
        ├── context/AuthContext.tsx  # Token-based auth context
        ├── pages/                  # LoginPage, SignupPage, DashboardPage, TripWizardPage
        └── components/
            ├── wizard/             # Multi-step payment wizard + reducer
            ├── ChildManager.tsx    # Child CRUD management
            ├── WithdrawModal.tsx   # Withdrawal flow (refund or credit)
            ├── Header.tsx          # Navigation header
            ├── Footer.tsx          # App footer
            ├── StepIndicator.tsx   # Wizard step progress
            └── ProtectedRoute.tsx  # Auth route guard
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

| Method | Endpoint                              | Description                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/api/trips/`                         | List all trips                           |
| GET    | `/api/trips/{id}/`                    | Get trip details                         |
| POST   | `/api/registrations/`                 | Register child for trip                  |
| GET    | `/api/registrations/{id}/`            | Get registration details                 |
| POST   | `/api/registrations/{id}/register-only/` | Register without immediate payment    |
| POST   | `/api/registrations/{id}/withdraw/`   | Withdraw registration (refund or credit) |
| POST   | `/api/registrations/{id}/cancel/`     | Cancel a pending registration            |
| POST   | `/api/payments/`                      | Process payment                          |
| GET    | `/api/dashboard/`                     | Parent dashboard (all registrations)     |
| GET    | `/api/credits/`                       | List account credits                     |
| GET    | `/api/credits/balance/`               | Get current credit balance               |

## Architecture

- **Services layer**: `PaymentService` and `WithdrawalService` orchestrate their respective flows by delegating to focused collaborators (`TransactionRecorder`, `RegistrationUpdater`), each with a single responsibility.
- **Dependency Inversion**: Business logic depends on a `PaymentGateway` abstraction, not the concrete `LegacyPaymentProcessor`. A `LegacyPaymentAdapter` bridges the two. Gateway methods return `ProcessResult`/`RefundResult` dataclasses rather than raw dicts.
- **Information Expert**: Card validation (Luhn, expiry, CVV) lives in a `CardDetails` value object — the entity that owns the data does the work.
- **Race condition protection**: Concurrent registration and withdrawal operations use `select_for_update()` within `transaction.atomic()` blocks to prevent double-spend and double-withdrawal.
- **Frontend state machine**: The payment wizard uses `useReducer` with typed actions (`SELECT_TRIP`, `REGISTER_SUCCESS`, `PAYMENT_SUCCESS`, etc.) rather than loosely coupled `useState` calls. The dashboard computes derived state (`can_withdraw`, `can_cancel`, `can_pay`, `amount_owing`) from registration status.

## Features

- **Authentication**: Sign up, log in, and token-based session management
- **Child management**: Add and manage multiple children per parent account
- **Trip browsing**: View available school trips with remaining capacity
- **Multi-step wizard**: Trip Details → Registration → Payment → Confirmation
- **Register without paying**: Option to register now and pay later
- **Withdrawal system**: Cancel registrations with a choice of refund to card or account credit
- **Account credits**: Accumulate credits from withdrawals and apply to future payments
- **Parent dashboard**: View all registrations with status, payment info, and available actions
- **Legacy payment integration**: Adapter pattern wrapping a legacy payment processor
- **Card validation**: Luhn check, expiry date, and CVV validation
- **Mobile-responsive design**: Tailwind CSS, mobile-first approach
- **Loading states and error handling**: With retry support for transient failures

## Testing

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

- **Backend**: Models, serializers, views, services, and CardDetails all tested across 5 test modules. Service tests use a `FakePaymentGateway` — no dependency on the legacy processor. Each test is isolated via Django `TestCase` transaction rollback.
- **Frontend**: `wizardReducer` tested as a pure function (no DOM, no mocks). Component tests with React Testing Library via Vitest.

## AI Tool Usage

Claude Code was used as a coding assistant throughout development for:

- Writing boilerplate (models, serializers, test scaffolding)
- Generating test cases from existing implementation code
- Tailwind CSS utility class composition
- Reviewing architecture decisions documented in PLANNING.md

All code was reviewed and validated before committing. The planning, architecture decisions, and design patterns were human-directed.
