import type {
  Trip, Registration, PaymentResult, RegistrationFormData, PaymentFormData,
  AuthResponse, User, Child, DashboardRegistration, WithdrawResult, CreditBalance,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: getAuthHeaders(),
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.detail || body?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Trips
export function fetchTrips(): Promise<Trip[]> {
  return request<Trip[]>('/trips/');
}

export function fetchTrip(id: string): Promise<Trip> {
  return request<Trip>(`/trips/${id}/`);
}

// Registrations
export function createRegistration(data: RegistrationFormData): Promise<Registration> {
  return request<Registration>('/registrations/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fetchRegistration(id: string): Promise<Registration> {
  return request<Registration>(`/registrations/${id}/`);
}

// Payments
export function processPayment(data: PaymentFormData): Promise<PaymentResult> {
  return request<PaymentResult>('/payments/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Auth
export function signup(data: { first_name: string; last_name: string; email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout/', { method: 'POST' });
}

export function fetchMe(): Promise<User> {
  return request<User>('/auth/me/');
}

// Children
export function fetchChildren(): Promise<Child[]> {
  return request<Child[]>('/children/');
}

export function createChild(data: { name: string; grade?: string }): Promise<Child> {
  return request<Child>('/children/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateChild(id: string, data: { name: string; grade?: string }): Promise<Child> {
  return request<Child>(`/children/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteChild(id: string): Promise<void> {
  return request<void>(`/children/${id}/`, { method: 'DELETE' });
}

// Dashboard
export function fetchDashboard(): Promise<DashboardRegistration[]> {
  return request<DashboardRegistration[]>('/dashboard/');
}

// Withdrawals
export function withdrawRegistration(id: string, resolution: 'credit' | 'refund'): Promise<WithdrawResult> {
  return request<WithdrawResult>(`/registrations/${id}/withdraw/`, {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  });
}

export function cancelRegistration(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/registrations/${id}/cancel/`, {
    method: 'POST',
  });
}

// Credits
export function fetchCreditBalance(): Promise<CreditBalance> {
  return request<CreditBalance>('/credits/balance/');
}
