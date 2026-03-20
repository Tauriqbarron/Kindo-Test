import { describe, it, expect } from 'vitest';
import { wizardReducer, initialState } from '../components/wizard/wizardReducer';
import type { WizardState } from '../components/wizard/wizardReducer';
import type { Trip, Registration, PaymentResult } from '../types';

const mockTrip: Trip = {
  id: '1',
  title: 'Museum Visit',
  description: 'A day at the museum',
  destination: 'Te Papa',
  date: '2026-06-15',
  cost: '45.00',
  school_id: 'SCH001',
  activity_id: 'ACT001',
  capacity: 30,
  spots_remaining: 25,
  is_full: false,
};

const mockRegistration: Registration = {
  id: '2',
  trip: '1',
  student_name: 'Emma Wilson',
  parent_name: 'Sarah Wilson',
  parent_email: 'sarah@example.com',
  parent_phone: '',
  status: 'pending',
  created_at: '2026-03-20T00:00:00Z',
};

const mockPaymentResult: PaymentResult = {
  success: true,
  transaction: {
    id: '3',
    registration: '2',
    amount: '45.00',
    status: 'success',
    transaction_ref: 'TX-123',
    card_last_four: '1111',
    processed_at: '2026-03-20T00:00:00Z',
    created_at: '2026-03-20T00:00:00Z',
  },
  registration: { ...mockRegistration, status: 'confirmed' },
};

describe('wizardReducer', () => {
  it('starts with trip step and null state', () => {
    expect(initialState.step).toBe('trip');
    expect(initialState.selectedTrip).toBeNull();
    expect(initialState.registration).toBeNull();
    expect(initialState.paymentResult).toBeNull();
    expect(initialState.error).toBeNull();
  });

  describe('SELECT_TRIP', () => {
    it('moves to registration step and stores trip', () => {
      const state = wizardReducer(initialState, { type: 'SELECT_TRIP', payload: mockTrip });
      expect(state.step).toBe('registration');
      expect(state.selectedTrip).toEqual(mockTrip);
      expect(state.error).toBeNull();
    });

    it('clears any existing error', () => {
      const withError: WizardState = { ...initialState, error: 'some error' };
      const state = wizardReducer(withError, { type: 'SELECT_TRIP', payload: mockTrip });
      expect(state.error).toBeNull();
    });
  });

  describe('REGISTER_SUCCESS', () => {
    it('moves to payment step and stores registration', () => {
      const atRegistration: WizardState = { ...initialState, step: 'registration', selectedTrip: mockTrip };
      const state = wizardReducer(atRegistration, { type: 'REGISTER_SUCCESS', payload: mockRegistration });
      expect(state.step).toBe('payment');
      expect(state.registration).toEqual(mockRegistration);
    });
  });

  describe('PAYMENT_SUCCESS', () => {
    it('moves to confirmation step and stores result', () => {
      const atPayment: WizardState = {
        ...initialState, step: 'payment', selectedTrip: mockTrip, registration: mockRegistration,
      };
      const state = wizardReducer(atPayment, { type: 'PAYMENT_SUCCESS', payload: mockPaymentResult });
      expect(state.step).toBe('confirmation');
      expect(state.paymentResult).toEqual(mockPaymentResult);
    });
  });

  describe('PAYMENT_FAILURE', () => {
    it('stays on payment step and sets error', () => {
      const atPayment: WizardState = {
        ...initialState, step: 'payment', selectedTrip: mockTrip, registration: mockRegistration,
      };
      const state = wizardReducer(atPayment, { type: 'PAYMENT_FAILURE', payload: 'Declined' });
      expect(state.step).toBe('payment');
      expect(state.error).toBe('Declined');
    });
  });

  describe('GO_BACK', () => {
    it('moves from registration to trip', () => {
      const atRegistration: WizardState = { ...initialState, step: 'registration', selectedTrip: mockTrip };
      const state = wizardReducer(atRegistration, { type: 'GO_BACK' });
      expect(state.step).toBe('trip');
    });

    it('moves from payment to registration', () => {
      const atPayment: WizardState = {
        ...initialState, step: 'payment', selectedTrip: mockTrip, registration: mockRegistration,
      };
      const state = wizardReducer(atPayment, { type: 'GO_BACK' });
      expect(state.step).toBe('registration');
    });

    it('does not go back from trip step', () => {
      const state = wizardReducer(initialState, { type: 'GO_BACK' });
      expect(state.step).toBe('trip');
    });

    it('clears error when going back', () => {
      const withError: WizardState = {
        ...initialState, step: 'payment', selectedTrip: mockTrip, registration: mockRegistration, error: 'fail',
      };
      const state = wizardReducer(withError, { type: 'GO_BACK' });
      expect(state.error).toBeNull();
    });
  });

  describe('RESET', () => {
    it('returns to initial state', () => {
      const fullState: WizardState = {
        step: 'confirmation',
        selectedTrip: mockTrip,
        registration: mockRegistration,
        paymentResult: mockPaymentResult,
        error: null,
      };
      const state = wizardReducer(fullState, { type: 'RESET' });
      expect(state).toEqual(initialState);
    });
  });

  describe('CLEAR_ERROR', () => {
    it('clears error without changing step', () => {
      const withError: WizardState = { ...initialState, step: 'payment', error: 'Something went wrong' };
      const state = wizardReducer(withError, { type: 'CLEAR_ERROR' });
      expect(state.error).toBeNull();
      expect(state.step).toBe('payment');
    });
  });
});
