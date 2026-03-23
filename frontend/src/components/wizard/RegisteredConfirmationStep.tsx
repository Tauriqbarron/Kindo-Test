import { useNavigate } from 'react-router-dom';
import type { Registration, Trip } from '../../types';
import type { WizardAction } from './wizardReducer';

interface Props {
  trip: Trip;
  registration: Registration;
  dispatch: React.Dispatch<WizardAction>;
}

export default function RegisteredConfirmationStep({ trip, registration, dispatch }: Props) {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-kindo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-kindo-gray-800">Registration Complete!</h2>
      <p className="mt-1 text-sm text-kindo-gray-500">
        {registration.student_name} is registered for {trip.title}.
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-lg border border-kindo-gray-200 bg-white p-5 text-left">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-kindo-gray-400">Details</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-kindo-gray-500">Trip</dt>
            <dd className="font-medium text-kindo-gray-800">{trip.title}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-kindo-gray-500">Student</dt>
            <dd className="font-medium text-kindo-gray-800">{registration.student_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-kindo-gray-500">Amount Owing</dt>
            <dd className="font-medium text-amber-600">${trip.cost}</dd>
          </div>
          {trip.payment_due_date && (
            <div className="flex justify-between">
              <dt className="text-kindo-gray-500">Payment Due</dt>
              <dd className="font-medium text-kindo-gray-800">
                {new Date(trip.payment_due_date).toLocaleDateString('en-NZ', { dateStyle: 'medium' })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <p className="mt-4 text-sm text-amber-600">
        Payment is still required. You can pay from your dashboard.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg border border-kindo-purple px-6 py-2.5 text-sm font-medium text-kindo-purple transition hover:bg-kindo-purple hover:text-white"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="rounded-lg bg-kindo-purple px-6 py-2.5 text-sm font-medium text-white transition hover:bg-kindo-purple-dark"
        >
          Register Another Child
        </button>
      </div>
    </div>
  );
}
