import { useReducer, useEffect } from 'react';
import { wizardReducer, initialState } from './wizardReducer';
import StepIndicator from '../StepIndicator';
import TripDetailsStep from './TripDetailsStep';
import RegistrationStep from './RegistrationStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';
import RegisteredConfirmationStep from './RegisteredConfirmationStep';
import { fetchRegistration, fetchTrip } from '../../api/client';

interface Props {
  initialPayRegistrationId?: string | null;
}

export default function PaymentWizard({ initialPayRegistrationId }: Props = {}) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  useEffect(() => {
    if (!initialPayRegistrationId) return;

    fetchRegistration(initialPayRegistrationId)
      .then((reg) => {
        const tripId = typeof reg.trip === 'string' ? reg.trip : reg.trip.id;
        return fetchTrip(tripId).then((trip) => {
          dispatch({ type: 'INIT_PAYMENT', payload: { trip, registration: reg } });
        });
      })
      .catch(() => {});
  }, [initialPayRegistrationId]);

  return (
    <div>
      {state.step !== 'trip' && <StepIndicator currentStep={state.step} />}

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

      {state.step === 'registered_confirmation' && state.selectedTrip && state.registration && (
        <RegisteredConfirmationStep
          trip={state.selectedTrip}
          registration={state.registration}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}
