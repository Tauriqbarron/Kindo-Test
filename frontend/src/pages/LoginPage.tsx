import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h2 className="mb-6 text-center text-2xl font-semibold text-kindo-gray-800">Log In</h2>

      {serverError && (
        <div role="alert" className="mb-4 rounded-lg border border-kindo-red/30 bg-red-50 p-3 text-sm text-kindo-red">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
            placeholder="sarah@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-kindo-red">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-kindo-gray-700">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="mt-1 w-full rounded-lg border border-kindo-gray-300 px-3 py-2 text-sm focus:border-kindo-purple focus:outline-none focus:ring-1 focus:ring-kindo-purple"
          />
          {errors.password && <p className="mt-1 text-xs text-kindo-red">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-kindo-purple py-2.5 text-sm font-medium text-white transition hover:bg-kindo-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Logging in...
            </span>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-kindo-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-kindo-purple hover:underline">Sign up</Link>
      </p>

      <p className="mt-2 text-center text-sm text-kindo-gray-500">
        <Link to="/trips" className="font-medium text-kindo-purple hover:underline">Continue as guest</Link>
      </p>
    </div>
  );
}
