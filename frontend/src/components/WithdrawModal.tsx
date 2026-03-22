import { useState } from 'react';
import type { DashboardRegistration } from '../types';
import * as api from '../api/client';

interface Props {
  registration: DashboardRegistration;
  onClose: () => void;
  onSuccess: (creditBalance: string) => void;
}

export default function WithdrawModal({ registration, onClose, onSuccess }: Props) {
  const [resolution, setResolution] = useState<'credit' | 'refund'>('credit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const result = await api.withdrawRegistration(registration.id, resolution);
      if (result.success) {
        onSuccess(result.credit_balance ?? '0.00');
      } else {
        setError(result.error ?? 'Withdrawal failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-kindo-gray-800">
          Withdraw from {registration.trip.title}
        </h3>

        <div className="mt-3 space-y-1 text-sm text-kindo-gray-600">
          <p>Student: <span className="font-medium text-kindo-gray-800">{registration.child_name}</span></p>
          <p>Amount: <span className="font-medium text-kindo-gray-800">${registration.trip.cost}</span></p>
        </div>

        <p className="mt-4 text-sm font-medium text-kindo-gray-700">
          How would you like to receive your refund?
        </p>

        <div className="mt-3 space-y-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${resolution === 'credit' ? 'border-kindo-purple bg-kindo-purple/5' : 'border-kindo-gray-200 hover:border-kindo-gray-300'}`}>
            <input
              type="radio"
              name="resolution"
              value="credit"
              checked={resolution === 'credit'}
              onChange={() => setResolution('credit')}
              className="mt-0.5 accent-kindo-purple"
            />
            <div>
              <span className="text-sm font-medium text-kindo-gray-800">Keep as account credit</span>
              <p className="text-xs text-kindo-gray-500">Use toward a future trip payment</p>
            </div>
          </label>

          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${resolution === 'refund' ? 'border-kindo-purple bg-kindo-purple/5' : 'border-kindo-gray-200 hover:border-kindo-gray-300'}`}>
            <input
              type="radio"
              name="resolution"
              value="refund"
              checked={resolution === 'refund'}
              onChange={() => setResolution('refund')}
              className="mt-0.5 accent-kindo-purple"
            />
            <div>
              <span className="text-sm font-medium text-kindo-gray-800">Process refund to card</span>
              <p className="text-xs text-kindo-gray-500">Refund to the original payment method</p>
            </div>
          </label>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-kindo-gray-300 px-4 py-2 text-sm font-medium text-kindo-gray-700 transition hover:bg-kindo-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  );
}
