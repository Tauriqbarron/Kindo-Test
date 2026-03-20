import type { PaymentResult, Trip } from '../../types';
import type { WizardAction } from './wizardReducer';

interface Props {
  trip: Trip;
  paymentResult: PaymentResult;
  dispatch: React.Dispatch<WizardAction>;
}

export default function ConfirmationStep({ trip, paymentResult, dispatch }: Props) {
  const { transaction, registration } = paymentResult;

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-kindo-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-kindo-gray-800">Payment Confirmed!</h2>
      <p className="mt-1 text-sm text-kindo-gray-500">
        {registration?.student_name} is registered for {trip.title}.
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-lg border border-kindo-gray-200 bg-white p-5 text-left">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-kindo-gray-400">Receipt</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-kindo-gray-500">Trip</dt>
            <dd className="font-medium text-kindo-gray-800">{trip.title}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-kindo-gray-500">Student</dt>
            <dd className="font-medium text-kindo-gray-800">{registration?.student_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-kindo-gray-500">Amount</dt>
            <dd className="font-medium text-kindo-gray-800">${transaction?.amount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-kindo-gray-500">Card</dt>
            <dd className="font-medium text-kindo-gray-800">**** {transaction?.card_last_four}</dd>
          </div>
          {transaction?.transaction_ref && (
            <div className="flex justify-between">
              <dt className="text-kindo-gray-500">Reference</dt>
              <dd className="font-mono text-xs text-kindo-gray-600">{transaction.transaction_ref}</dd>
            </div>
          )}
          {transaction?.processed_at && (
            <div className="flex justify-between">
              <dt className="text-kindo-gray-500">Date</dt>
              <dd className="font-medium text-kindo-gray-800">
                {new Date(transaction.processed_at).toLocaleString('en-NZ')}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <button
        onClick={() => dispatch({ type: 'RESET' })}
        className="mt-6 rounded-lg bg-kindo-purple px-6 py-2.5 text-sm font-medium text-white transition hover:bg-kindo-purple-dark"
      >
        Register Another Child
      </button>
    </div>
  );
}
