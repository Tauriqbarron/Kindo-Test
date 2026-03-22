import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChildManager from '../components/ChildManager';
import WithdrawModal from '../components/WithdrawModal';
import type { Child, DashboardRegistration } from '../types';
import * as api from '../api/client';

function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string | null }) {
  if (status === 'confirmed' && paymentStatus === 'success') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        Paid
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
        Pending Payment
      </span>
    );
  }
  if (status === 'failed' || paymentStatus === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Failed
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [registrations, setRegistrations] = useState<DashboardRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState('0.00');
  const [withdrawingReg, setWithdrawingReg] = useState<DashboardRegistration | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [childrenData, regData, creditData] = await Promise.all([
        api.fetchChildren(),
        api.fetchDashboard(),
        api.fetchCreditBalance(),
      ]);
      setChildren(childrenData);
      setRegistrations(regData);
      setCreditBalance(creditData.balance);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleCancel(regId: string) {
    setCancellingId(regId);
    try {
      await api.cancelRegistration(regId);
      await loadData();
    } catch {
      // Error handled silently
    } finally {
      setCancellingId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-kindo-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-kindo-gray-800">
            Welcome, {user?.first_name}
          </h2>
          {parseFloat(creditBalance) > 0 && (
            <p className="mt-1 text-sm text-kindo-gray-600">
              Account Credit: <span className="font-semibold text-kindo-green">${creditBalance}</span>
            </p>
          )}
        </div>
        <Link
          to="/trips"
          className="rounded-lg bg-kindo-purple px-4 py-2 text-sm font-medium text-white transition hover:bg-kindo-purple-dark"
        >
          Register for a Trip
        </Link>
      </div>

      <div className="mb-8">
        <ChildManager children={children} onUpdate={loadData} />
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold text-kindo-gray-800">Trip Registrations</h3>
        {registrations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kindo-gray-300 p-4 text-center text-sm text-kindo-gray-500">
            No trip registrations yet.{' '}
            <Link to="/trips" className="font-medium text-kindo-purple hover:underline">Browse trips</Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {registrations.map((reg) => (
              <li key={reg.id} className="rounded-lg border border-kindo-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-kindo-gray-800">{reg.trip.title}</p>
                    <p className="mt-0.5 text-sm text-kindo-gray-500">
                      {reg.trip.destination} &middot;{' '}
                      {new Date(reg.trip.date).toLocaleDateString('en-NZ', { dateStyle: 'medium' })}
                    </p>
                    <p className="mt-1 text-sm text-kindo-gray-600">
                      Student: {reg.child_name} &middot; ${reg.trip.cost}
                    </p>
                  </div>
                  <StatusBadge status={reg.status} paymentStatus={reg.payment_status} />
                </div>
                {(reg.can_withdraw || reg.can_cancel) && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-kindo-gray-100 pt-3">
                    {reg.can_withdraw && (
                      <button
                        onClick={() => setWithdrawingReg(reg)}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Withdraw
                      </button>
                    )}
                    {reg.can_cancel && (
                      <button
                        onClick={() => handleCancel(reg.id)}
                        disabled={cancellingId === reg.id}
                        className="rounded-lg border border-kindo-gray-300 px-3 py-1.5 text-xs font-medium text-kindo-gray-600 transition hover:bg-kindo-gray-50 disabled:opacity-50"
                      >
                        {cancellingId === reg.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {withdrawingReg && (
        <WithdrawModal
          registration={withdrawingReg}
          onClose={() => setWithdrawingReg(null)}
          onSuccess={(balance) => {
            setCreditBalance(balance);
            setWithdrawingReg(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
