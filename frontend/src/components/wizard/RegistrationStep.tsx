import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Trip } from '../../types';
import type { WizardAction } from './wizardReducer';
import { createRegistration } from '../../api/client';

interface Props {
  trip: Trip;
  dispatch: React.Dispatch<WizardAction>;
}

interface FormValues {
  student_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
}

export default function RegistrationStep({ trip, dispatch }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const registration = await createRegistration({ ...values, trip: trip.id });
      dispatch({ type: 'REGISTER_SUCCESS', payload: registration });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed');
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
        &larr; Back to trips
      </button>

      <div className="mb-6 rounded-lg border border-kindo-gray-200 bg-white p-4">
        <h3 className="font-semibold text-kindo-gray-800">{trip.title}</h3>
        <p className="text-sm text-kindo-gray-500">
          {trip.destination} &middot; {new Date(trip.date).toLocaleDateString('en-NZ', { dateStyle: 'medium' })} &middot; ${trip.cost}
        </p>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-kindo-gray-800">Register Your Child</h2>

      <div aria-live="polite">
        {serverError && (
          <div role="alert" className="mb-4 rounded-lg border border-kindo-red/30 bg-red-50 p-3 text-sm text-kindo-red">
            {serverError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Student Name</label>
          <input
            {...register('student_name', { required: 'Student name is required', minLength: { value: 2, message: 'Must be at least 2 characters' } })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
            placeholder="e.g. Emma Wilson"
          />
          {errors.student_name && <p className="mt-1 text-xs text-kindo-red">{errors.student_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Parent / Guardian Name</label>
          <input
            {...register('parent_name', { required: 'Parent name is required', minLength: { value: 2, message: 'Must be at least 2 characters' } })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
            placeholder="e.g. Sarah Wilson"
          />
          {errors.parent_name && <p className="mt-1 text-xs text-kindo-red">{errors.parent_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Email</label>
          <input
            type="email"
            {...register('parent_email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
            })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
            placeholder="sarah@example.com"
          />
          {errors.parent_email && <p className="mt-1 text-xs text-kindo-red">{errors.parent_email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Phone (optional)</label>
          <input
            {...register('parent_phone')}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
            placeholder="021-555-0123"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-kindo-purple py-2.5 text-sm font-medium text-white transition hover:bg-kindo-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Registering...
            </span>
          ) : (
            'Continue to Payment'
          )}
        </button>
      </form>
    </div>
  );
}
