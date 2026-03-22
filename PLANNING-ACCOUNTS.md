# Kindo — Parent Accounts, Child Management & Dashboard

## Context

The app currently has no authentication — parents manually type their details and their child's name every time they register for a trip. There's no way to see past registrations or confirm payment status. This plan adds:
1. Parent accounts (signup/login)
2. Child management (save children to your account)
3. Child selection during trip registration (pick from saved children)
4. A dashboard showing all registrations with payment status

All changes respect the SOLID and software principles defined in `solid-principles.html` and `software-principles.html`.

---

## Decisions Log

### Decision 1: Auth Strategy

- **Status**: PROPOSED
- **Choice**: DRF Token Authentication (built-in `rest_framework.authtoken`)
- **Reason**: KISS/YAGNI — no OAuth, no JWT refresh tokens. Token auth is stateless for the SPA, built into DRF, and sufficient for this use case. Token stored in `localStorage` on the frontend.

### Decision 2: Separate `accounts` App

- **Status**: PROPOSED
- **Choice**: New Django app `accounts` for auth + child management, separate from `payments`
- **Reason**: SRP — authentication and child/parent concerns are distinct from payment/trip/registration concerns. Each app has one reason to change.

### Decision 3: User Model

- **Status**: PROPOSED
- **Choice**: Use Django's built-in `auth.User` (no custom user model)
- **Reason**: YAGNI — `User` already provides `first_name`, `last_name`, `email`, `password`, and Django's password validators. No custom fields needed.

### Decision 4: Registration Backward Compatibility

- **Status**: PROPOSED
- **Choice**: Add nullable `parent` and `child` FKs to `Registration`, keep existing text fields
- **Reason**: OCP — existing anonymous registrations remain valid. The text fields (`student_name`, `parent_name`, etc.) serve as the denormalized record-of-truth (if a parent later changes their name, the registration reflects what it was at registration time). New auth flow populates both FKs and text fields.

### Decision 5: Frontend Routing

- **Status**: PROPOSED
- **Choice**: Add `react-router-dom` for page-level routing
- **Reason**: The app now has multiple pages (login, signup, dashboard, trips). The existing wizard `useReducer` stays for step-level navigation within the trip flow.

### Decision 6: Dual-Mode Registration

- **Status**: PROPOSED
- **Choice**: `RegistrationStep` renders a child dropdown for authenticated users, manual form for anonymous users
- **Reason**: OCP — the anonymous flow is untouched. Auth flow extends it. Both paths converge on the same `POST /api/registrations/` endpoint.

---

## New Folder Structure (additions only)

```text
backend/
├── accounts/                      # NEW Django app (SRP: auth concerns separate from payments)
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py                  # Child model
│   ├── serializers.py             # Signup, Login, User, Child serializers
│   ├── views.py                   # Auth views + Child CRUD
│   ├── urls.py                    # /api/auth/*, /api/children/*
│   ├── permissions.py             # IsChildOwner
│   ├── admin.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_views.py
│   │   └── test_serializers.py
│   └── migrations/

frontend/src/
├── context/
│   └── AuthContext.tsx             # Auth state (user, token, login/signup/logout)
├── components/
│   ├── ProtectedRoute.tsx         # Redirects to /login if not authenticated
│   └── ChildManager.tsx           # Add/edit/remove children UI
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── DashboardPage.tsx          # Shows children + registrations + payment status
│   └── TripWizardPage.tsx         # Wrapper for existing PaymentWizard
```

---

## New Database Models

### Child Model (in `accounts`)

| Field      | Type                     | Notes                                    |
| ---------- | ------------------------ | ---------------------------------------- |
| id         | UUIDField (PK)           | auto-generated                           |
| parent     | ForeignKey(User)         | CASCADE, related_name='children'         |
| name       | CharField(200)           |                                          |
| grade      | CharField(50)            | optional, blank                          |
| created_at | DateTimeField            | auto_now_add                             |

### Registration Model (modifications)

| Field  | Type                     | Notes                                         |
| ------ | ------------------------ | --------------------------------------------- |
| parent | ForeignKey(User)         | **NEW** — nullable, SET_NULL                  |
| child  | ForeignKey(Child)        | **NEW** — nullable, SET_NULL                  |

Existing fields (`student_name`, `parent_name`, `parent_email`, `parent_phone`) remain unchanged.

---

## New API Endpoints

| Method | Endpoint                   | Auth Required | Description                    |
| ------ | -------------------------- | ------------- | ------------------------------ |
| POST   | `/api/auth/signup/`        | No            | Create account, return token   |
| POST   | `/api/auth/login/`         | No            | Authenticate, return token     |
| POST   | `/api/auth/logout/`        | Yes           | Delete token                   |
| GET    | `/api/auth/me/`            | Yes           | Current user profile           |
| GET    | `/api/children/`           | Yes           | List parent's children         |
| POST   | `/api/children/`           | Yes           | Add a child                    |
| GET    | `/api/children/{id}/`      | Yes           | Get child details              |
| PUT    | `/api/children/{id}/`      | Yes           | Update child                   |
| DELETE | `/api/children/{id}/`      | Yes           | Remove child                   |
| GET    | `/api/dashboard/`          | Yes           | Registrations + payment status |

### Modified Endpoint

| Method | Endpoint                | Change                                                    |
| ------ | ----------------------- | --------------------------------------------------------- |
| POST   | `/api/registrations/`   | Accepts optional `child_id` for authenticated users       |

---

## Frontend Routes

| Path         | Component        | Auth Required | Notes                                     |
| ------------ | ---------------- | ------------- | ----------------------------------------- |
| `/`          | Redirect         | —             | → `/dashboard` if logged in, else `/trips`|
| `/login`     | LoginPage        | No            |                                           |
| `/signup`    | SignupPage       | No            |                                           |
| `/dashboard` | DashboardPage    | Yes           | Children + registrations + payment status |
| `/trips`     | TripWizardPage   | No            | Existing wizard (works auth & anon)       |

---

## Implementation Order & Commits

### Phase 1: Backend Accounts App

- [ ] Create `accounts` Django app with `Child` model
- [ ] Add `SignupSerializer`, `LoginSerializer`, `UserSerializer`, `ChildSerializer`
- [ ] Add `SignupView`, `LoginView`, `LogoutView`, `MeView`
- [ ] Add `ChildListCreateView`, `ChildDetailView` with `IsChildOwner` permission
- [ ] Add `accounts/urls.py` with all routes
- [ ] Update `kindo/settings.py`: add `rest_framework.authtoken` + `accounts` to `INSTALLED_APPS`, add `DEFAULT_AUTHENTICATION_CLASSES`
- [ ] Update `kindo/urls.py`: include `accounts.urls`
- [ ] Run `makemigrations` + `migrate`
- [ ] **Commit: "Add accounts app with auth endpoints and child management"**

### Phase 2: Backend Registration & Dashboard Integration

- [ ] Add nullable `parent` and `child` FKs to `Registration` model
- [ ] Run `makemigrations` + `migrate`
- [ ] Update `RegistrationSerializer`: accept optional `child_id`, conditionally require manual fields
- [ ] Update `RegistrationCreateView.perform_create`: if authenticated + `child_id`, resolve child and auto-populate fields
- [ ] Add `DashboardRegistrationSerializer` (nested trip, child name, registration status, payment status)
- [ ] Add `DashboardView(ListAPIView)` with `IsAuthenticated` permission
- [ ] Add dashboard URL to `payments/urls.py`
- [ ] **Commit: "Add parent/child FKs to Registration and dashboard endpoint"**

### Phase 3: Backend Tests

- [ ] Tests for signup/login/logout flows (valid + invalid)
- [ ] Tests for child CRUD (ownership enforced, cannot access other user's children)
- [ ] Tests for authenticated registration with `child_id`
- [ ] Tests for dashboard endpoint (returns correct data, filtered by user)
- [ ] Tests that anonymous registration still works unchanged
- [ ] **Commit: "Add tests for accounts, auth registration, and dashboard"**

### Phase 4: Frontend Auth Infrastructure

- [ ] Install `react-router-dom`
- [ ] Create `AuthContext.tsx` (user, token, login, signup, logout, isAuthenticated)
- [ ] Create `ProtectedRoute.tsx` component
- [ ] Update `api/client.ts`: add auth header injection + new API functions (signup, login, logout, fetchMe, fetchChildren, createChild, updateChild, deleteChild, fetchDashboard)
- [ ] Update `types/index.ts`: add `User`, `Child`, `AuthResponse`, `DashboardRegistration` types
- [ ] **Commit: "Add frontend auth context, protected routes, and API client updates"**

### Phase 5: Frontend Pages & Routing

- [ ] Create `LoginPage.tsx` (email + password form, react-hook-form)
- [ ] Create `SignupPage.tsx` (name, email, password, confirm password)
- [ ] Create `DashboardPage.tsx` (children list + registrations with payment status indicators)
- [ ] Create `ChildManager.tsx` (add/edit/delete children inline)
- [ ] Create `TripWizardPage.tsx` (wrapper for existing PaymentWizard)
- [ ] Restructure `App.tsx` with react-router-dom routes
- [ ] Update `main.tsx`: wrap in `BrowserRouter` + `AuthProvider`
- [ ] **Commit: "Add login, signup, dashboard pages with routing"**

### Phase 6: Frontend Registration Integration

- [ ] Update `RegistrationStep.tsx`: if authenticated, show child dropdown + auto-fill parent info; if anonymous, show existing manual form
- [ ] Update `Header.tsx`: if authenticated, show user name + "Dashboard" link + "Logout" button; if anonymous, show "Login" + "Sign Up" links
- [ ] **Commit: "Integrate child selection in registration and auth-aware header"**

### Phase 7: Frontend Tests

- [ ] Test `RegistrationStep` renders child dropdown when authenticated
- [ ] Test `RegistrationStep` renders manual form when anonymous
- [ ] Test `DashboardPage` renders registrations with status
- [ ] Test `AuthContext` login/logout flows
- [ ] **Commit: "Add frontend tests for auth, dashboard, and registration integration"**

### Phase 8: Final Polish

- [ ] Manual E2E testing of full flow
- [ ] Update README with new features and setup instructions
- [ ] **Commit: "Final documentation and polish for accounts feature"**

---

## Key Files Modified

| File | Action | What Changes |
|------|--------|-------------|
| `backend/kindo/settings.py` | MODIFY | Add apps + DRF auth config |
| `backend/kindo/urls.py` | MODIFY | Include accounts.urls |
| `backend/payments/models.py` | MODIFY | Add parent/child FKs to Registration |
| `backend/payments/serializers.py` | MODIFY | Dual-mode registration + dashboard serializer |
| `backend/payments/views.py` | MODIFY | Dual-mode registration + dashboard view |
| `backend/payments/urls.py` | MODIFY | Add dashboard URL |
| `frontend/src/App.tsx` | MODIFY | Router with routes |
| `frontend/src/main.tsx` | MODIFY | BrowserRouter + AuthProvider |
| `frontend/src/api/client.ts` | MODIFY | Auth header + new API functions |
| `frontend/src/types/index.ts` | MODIFY | New types |
| `frontend/src/components/Header.tsx` | MODIFY | Auth-aware navigation |
| `frontend/src/components/wizard/RegistrationStep.tsx` | MODIFY | Child dropdown for authenticated users |

---

## Principles Applied

| Principle | How Applied |
|-----------|-------------|
| **SRP** | Separate `accounts` app; `Child` model owns child data; `Registration` denormalizes for record-keeping |
| **OCP** | Anonymous flow untouched; auth flow extends via nullable FKs and conditional logic |
| **DIP** | Views depend on DRF's authentication/permission abstractions |
| **ISP** | `IsChildOwner` is a focused permission class, not a monolithic permissions check |
| **KISS/YAGNI** | Token auth (not OAuth); no roles/permissions beyond ownership; no unnecessary features |
| **DRY** | Auth header injection in one place (api/client.ts); child resolution logic in one serializer method |
| **Information Expert** | Child dropdown data comes from `AuthContext` which owns user state |
| **OWASP** | Django password validators; token auth; ownership checks on child/dashboard endpoints |
| **FIRST** | Tests are independent (each creates own data), fast (no external deps), self-checking |

---

## Verification (End-to-End)

### Setup
```bash
# Terminal 1: Backend
cd backend
python manage.py migrate
python manage.py loaddata sample_trips
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### Test Cases

1. **Signup flow**: Sign up with name/email/password → redirected to dashboard → empty state
2. **Add children**: Add 2 children from dashboard → see them listed
3. **Register child for trip**: Browse trips → select trip → pick child from dropdown → parent info auto-filled → pay → see confirmation
4. **Dashboard status**: Go to dashboard → see registration with "Confirmed" status and payment indicator
5. **Multiple children**: Register second child for different trip → dashboard shows both
6. **Anonymous flow**: Log out → register anonymously (type all fields manually) → existing flow works unchanged
7. **Login persistence**: Refresh page → still logged in (token in localStorage)
8. **Ownership isolation**: User A cannot see User B's children or registrations
