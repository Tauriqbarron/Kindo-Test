import type { Trip, Registration, PaymentResult } from '../../types';

export type WizardStep = 'trip' | 'registration' | 'payment' | 'confirmation';

export type WizardState = {
  step: WizardStep;
  selectedTrip: Trip | null;
  registration: Registration | null;
  paymentResult: PaymentResult | null;
  error: string | null;
};

export type WizardAction =
  | { type: 'SELECT_TRIP'; payload: Trip }
  | { type: 'REGISTER_SUCCESS'; payload: Registration }
  | { type: 'PAYMENT_SUCCESS'; payload: PaymentResult }
  | { type: 'PAYMENT_FAILURE'; payload: string }
  | { type: 'GO_BACK' }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' };

export const initialState: WizardState = {
  step: 'trip',
  selectedTrip: null,
  registration: null,
  paymentResult: null,
  error: null,
};

const stepOrder: WizardStep[] = ['trip', 'registration', 'payment', 'confirmation'];

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SELECT_TRIP':
      return {
        ...state,
        step: 'registration',
        selectedTrip: action.payload,
        error: null,
      };

    case 'REGISTER_SUCCESS':
      return {
        ...state,
        step: 'payment',
        registration: action.payload,
        error: null,
      };

    case 'PAYMENT_SUCCESS':
      return {
        ...state,
        step: 'confirmation',
        paymentResult: action.payload,
        error: null,
      };

    case 'PAYMENT_FAILURE':
      return {
        ...state,
        error: action.payload,
      };

    case 'GO_BACK': {
      const currentIndex = stepOrder.indexOf(state.step);
      if (currentIndex <= 0) return state;
      return {
        ...state,
        step: stepOrder[currentIndex - 1],
        error: null,
      };
    }

    case 'RESET':
      return initialState;

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}
