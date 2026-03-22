import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Registration, Trip } from '../../types';
import type { WizardAction } from './wizardReducer';
import { processPayment, fetchCreditBalance } from '../../api/client';

interface Props {
  trip: Trip;
  registration: Registration;
  error: string | null;
  dispatch: React.Dispatch<WizardAction>;
}

interface FormValues {
  card_number: string;
  expiry_date: string;
  cvv: string;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export default function PaymentStep({ trip, registration, error, dispatch }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [creditBalance, setCreditBalance] = useState('0.00');
  const [useCredit, setUseCredit] = useState(false);

  const balance = parseFloat(creditBalance);
  const tripCost = parseFloat(trip.cost);
  const creditApplied = useCredit ? Math.min(balance, tripCost) : 0;
  const amountDue = tripCost - creditApplied;
  const creditCoversAll = useCredit && balance >= tripCost;

  useEffect(() => {
    fetchCreditBalance()
      .then((data) => setCreditBalance(data.balance))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const payload: Record<string, unknown> = {
        registration_id: registration.id,
        use_credit: useCredit,
      };
      if (!creditCoversAll) {
        payload.card_number = values.card_number.replace(/\s/g, '');
        payload.expiry_date = values.expiry_date;
        payload.cvv = values.cvv;
      }

      const result = await processPayment(payload as Parameters<typeof processPayment>[0]);

      if (result.success) {
        dispatch({ type: 'PAYMENT_SUCCESS', payload: result });
      } else {
        dispatch({ type: 'PAYMENT_FAILURE', payload: result.error || 'Payment failed' });
      }
    } catch (err) {
      dispatch({ type: 'PAYMENT_FAILURE', payload: err instanceof Error ? err.message : 'Payment failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => dispatch({ type: 'GO_BACK' })}
        className="mb-4 text-sm text-kindo-purple hover:underline"
      >
        &larr; Back to registration
      </button>

      <div className="mb-6 rounded-lg border border-kindo-gray-200 bg-white p-4">
        <h3 className="font-semibold text-kindo-gray-800">{trip.title}</h3>
        <p className="text-sm text-kindo-gray-500">
          Registering: {registration.student_name}
        </p>
        <p className="mt-2 text-lg font-bold text-kindo-purple">Total: ${trip.cost}</p>

        {balance > 0 && (
          <div className="mt-3 border-t border-kindo-gray-100 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCredit}
                onChange={(e) => setUseCredit(e.target.checked)}
                className="accent-kindo-purple"
              />
              <span className="text-sm text-kindo-gray-700">
                Apply account credit <span className="font-semibold text-kindo-green">(${creditBalance} available)</span>
              </span>
            </label>
            {useCredit && (
              <div className="mt-2 space-y-1 text-sm text-kindo-gray-600">
                <div className="flex justify-between">
                  <span>Credit applied:</span>
                  <span className="font-medium text-kindo-green">-${creditApplied.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card charge:</span>
                  <span className="font-medium text-kindo-gray-800">${amountDue.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-kindo-gray-800">
        {creditCoversAll ? 'Confirm Payment' : 'Payment Details'}
      </h2>

      <div aria-live="polite">
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-kindo-red/30 bg-red-50 p-3 text-sm text-kindo-red">
            {error}
            <p className="mt-1 text-xs text-kindo-gray-500">Please check your details and try again.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!creditCoversAll && (
          <>
            <div>
              <label className="block text-sm font-medium text-kindo-gray-700">Card Number</label>
              <input
                {...register('card_number', {
                  required: !creditCoversAll ? 'Card number is required' : false,
                  validate: (v) => creditCoversAll || v.replace(/\s/g, '').length >= 13 || 'Card number too short',
                })}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  setValue('card_number', formatted, { shouldValidate: true });
                }}
                inputMode="numeric"
                placeholder="4111 1111 1111 1111"
                className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm tracking-wider focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
              />
              {errors.card_number && <p className="mt-1 text-xs text-kindo-red">{errors.card_number.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-kindo-gray-700">Expiry Date</label>
                <input
                  {...register('expiry_date', {
                    required: !creditCoversAll ? 'Expiry is required' : false,
                    pattern: { value: /^\d{2}\/\d{2}$/, message: 'Use MM/YY format' },
                  })}
                  onChange={(e) => {
                    const formatted = formatExpiry(e.target.value);
                    setValue('expiry_date', formatted, { shouldValidate: true });
                  }}
                  inputMode="numeric"
                  placeholder="12/28"
                  className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
                />
                {errors.expiry_date && <p className="mt-1 text-xs text-kindo-red">{errors.expiry_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-kindo-gray-700">CVV</label>
                <input
                  {...register('cvv', {
                    required: !creditCoversAll ? 'CVV is required' : false,
                    pattern: { value: /^\d{3,4}$/, message: '3 or 4 digits' },
                  })}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="123"
                  className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
                />
                {errors.cvv && <p className="mt-1 text-xs text-kindo-red">{errors.cvv.message}</p>}
              </div>
            </div>
          </>
        )}

        {creditCoversAll && (
          <p className="rounded-lg border border-kindo-green/30 bg-green-50 p-3 text-center text-sm text-green-700">
            Your account credit covers the full amount. No card payment needed.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-kindo-purple py-2.5 text-sm font-medium text-white transition hover:bg-kindo-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing payment...
            </span>
          ) : creditCoversAll ? (
            'Pay with Credit'
          ) : useCredit && creditApplied > 0 ? (
            `Pay $${amountDue.toFixed(2)} (after $${creditApplied.toFixed(2)} credit)`
          ) : (
            `Pay $${trip.cost}`
          )}
        </button>

        {!creditCoversAll && (
          <p className="text-center text-xs text-kindo-gray-400">
            Your card details are sent directly to the payment processor and are not stored.
          </p>
        )}
      </form>
    </div>
  );
}
