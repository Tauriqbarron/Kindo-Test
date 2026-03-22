import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FormValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await signup(values.first_name, values.last_name, values.email, values.password);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h2 className="mb-6 text-center text-2xl font-semibold text-kindo-gray-800">Create Account</h2>

      {serverError && (
        <div role="alert" className="mb-4 rounded-lg border border-kindo-red/30 bg-red-50 p-3 text-sm text-kindo-red">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-kindo-gray-700">First Name</label>
            <input
              {...register('first_name', { required: 'First name is required' })}
              className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
              placeholder="Sarah"
            />
            {errors.first_name && <p className="mt-1 text-xs text-kindo-red">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-kindo-gray-700">Last Name</label>
            <input
              {...register('last_name', { required: 'Last name is required' })}
              className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
              placeholder="Wilson"
            />
            {errors.last_name && <p className="mt-1 text-xs text-kindo-red">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Email</label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
            })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
            placeholder="sarah@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-kindo-red">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Password</label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' },
            })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
          />
          {errors.password && <p className="mt-1 text-xs text-kindo-red">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Confirm Password</label>
          <input
            type="password"
            {...register('confirm_password', {
              required: 'Please confirm your password',
              validate: (val) => val === watch('password') || 'Passwords do not match',
            })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
          />
          {errors.confirm_password && <p className="mt-1 text-xs text-kindo-red">{errors.confirm_password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-kindo-purple py-2.5 text-sm font-medium text-white transition hover:bg-kindo-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-kindo-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-kindo-purple hover:underline">Log in</Link>
      </p>
    </div>
  );
}
