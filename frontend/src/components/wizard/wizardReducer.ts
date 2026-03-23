import type { Trip, Registration, PaymentResult } from '../../types';

export type WizardStep = 'trip' | 'registration' | 'payment' | 'confirmation' | 'registered_confirmation';

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
  | { type: 'REGISTER_ONLY_SUCCESS'; payload: Registration }
  | { type: 'INIT_PAYMENT'; payload: { trip: Trip; registration: Registration } }
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

    case 'REGISTER_ONLY_SUCCESS':
      return {
        ...state,
        step: 'registered_confirmation',
        registration: action.payload,
        error: null,
      };

    case 'INIT_PAYMENT':
      return {
        ...state,
        step: 'payment',
        selectedTrip: action.payload.trip,
        registration: action.payload.registration,
        error: null,
      };

    case 'GO_BACK': {
      const current = state.step === 'registered_confirmation' ? 'confirmation' : state.step;
      const currentIndex = stepOrder.indexOf(current);
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
