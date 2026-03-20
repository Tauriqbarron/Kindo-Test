import { useReducer } from 'react';
import { wizardReducer, initialState } from './wizardReducer';
import StepIndicator from '../StepIndicator';
import TripDetailsStep from './TripDetailsStep';
import RegistrationStep from './RegistrationStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';

export default function PaymentWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  return (
    <div>
      <StepIndicator currentStep={state.step} />

      {state.step === 'trip' && (
        <TripDetailsStep dispatch={dispatch} />
      )}

      {state.step === 'registration' && state.selectedTrip && (
        <RegistrationStep trip={state.selectedTrip} dispatch={dispatch} />
      )}

      {state.step === 'payment' && state.selectedTrip && state.registration && (
        <PaymentStep
          trip={state.selectedTrip}
          registration={state.registration}
          error={state.error}
          dispatch={dispatch}
        />
      )}

      {state.step === 'confirmation' && state.selectedTrip && state.paymentResult && (
        <ConfirmationStep
          trip={state.selectedTrip}
          paymentResult={state.paymentResult}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}
