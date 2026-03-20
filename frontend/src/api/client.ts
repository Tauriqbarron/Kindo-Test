import type { Trip, Registration, PaymentResult, RegistrationFormData, PaymentFormData } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.detail || body?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

export function fetchTrips(): Promise<Trip[]> {
  return request<Trip[]>('/trips/');
}

export function fetchTrip(id: string): Promise<Trip> {
  return request<Trip>(`/trips/${id}/`);
}

export function createRegistration(data: RegistrationFormData): Promise<Registration> {
  return request<Registration>('/registrations/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fetchRegistration(id: string): Promise<Registration> {
  return request<Registration>(`/registrations/${id}/`);
}

export function processPayment(data: PaymentFormData): Promise<PaymentResult> {
  return request<PaymentResult>('/payments/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
