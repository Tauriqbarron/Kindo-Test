# Kindo School Payments

A school field trip payment system where parents can view trip details, register their child, make a payment, and receive confirmation.

## Tech Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React + TypeScript (Vite)
- **Styling**: Tailwind CSS

## Project Structure

```
Kindo-Test/
├── backend/       # Django API server
│   ├── kindo/     # Project configuration
│   └── payments/  # Main application
└── frontend/      # React SPA
    └── src/
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
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

The frontend dev server proxies API requests to `http://localhost:8000`.

## Features

- View available school trips
- Multi-step registration and payment wizard
- Integration with legacy payment processor
- Mobile-responsive design
- Form validation with clear error messaging
