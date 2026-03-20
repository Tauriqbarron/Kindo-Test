import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Registration, Trip } from '../../types';
import type { WizardAction } from './wizardReducer';
import { processPayment } from '../../api/client';

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
      const result = await processPayment({
        registration_id: registration.id,
        card_number: values.card_number.replace(/\s/g, ''),
        expiry_date: values.expiry_date,
        cvv: values.cvv,
      });

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
      </div>

      <h2 className="mb-4 text-lg font-semibold text-kindo-gray-800">Payment Details</h2>

      <div aria-live="polite">
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-kindo-red/30 bg-red-50 p-3 text-sm text-kindo-red">
            {error}
            <p className="mt-1 text-xs text-kindo-gray-500">Please check your details and try again.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Card Number</label>
          <input
            {...register('card_number', {
              required: 'Card number is required',
              validate: (v) => v.replace(/\s/g, '').length >= 13 || 'Card number too short',
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
                required: 'Expiry is required',
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
                required: 'CVV is required',
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
          ) : (
            `Pay $${trip.cost}`
          )}
        </button>

        <p className="text-center text-xs text-kindo-gray-400">
          Your card details are sent directly to the payment processor and are not stored.
        </p>
      </form>
    </div>
  );
}
