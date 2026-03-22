import { useEffect, useState } from 'react';
import type { Trip } from '../../types';
import type { WizardAction } from './wizardReducer';
import { fetchTrips, withdrawRegistration, cancelRegistration } from '../../api/client';

interface Props {
  dispatch: React.Dispatch<WizardAction>;
}

export default function TripDetailsStep({ dispatch }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [showWithdrawChoice, setShowWithdrawChoice] = useState<string | null>(null);

  const loadTrips = () => {
    setLoading(true);
    setError(null);
    fetchTrips()
      .then(setTrips)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrips();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kindo-purple border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-kindo-red/30 bg-red-50 p-4 text-center text-kindo-red">
        <p className="font-medium">Failed to load trips</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          onClick={loadTrips}
          className="mt-3 rounded-lg bg-kindo-purple px-4 py-2 text-sm font-medium text-white transition hover:bg-kindo-purple-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (trips.length === 0) {
    return <p className="py-8 text-center text-kindo-gray-500">No trips available at the moment.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-kindo-gray-800">Available Trips</h2>
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="rounded-lg border border-kindo-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-kindo-gray-800">{trip.title}</h3>
              <p className="mt-1 text-sm text-kindo-gray-500">{trip.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-kindo-gray-600">
                <span>📍 {trip.destination}</span>
                <span>📅 {new Date(trip.date).toLocaleDateString('en-NZ', { dateStyle: 'medium' })}</span>
                <span>🎒 {trip.spots_remaining} / {trip.capacity} spots</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-lg font-bold text-kindo-purple">${trip.cost}</span>
              <button
                disabled={trip.is_full}
                onClick={() => dispatch({ type: 'SELECT_TRIP', payload: trip })}
                className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition ${
                  trip.is_full
                    ? 'cursor-not-allowed bg-kindo-gray-300'
                    : 'bg-kindo-purple hover:bg-kindo-purple-dark'
                }`}
              >
                {trip.is_full ? 'Full' : 'Register'}
              </button>
            </div>
          </div>
          {trip.registered_children.length > 0 && (
            <div className="mt-3 border-t border-kindo-gray-200 pt-3">
              <p className="text-xs font-medium text-kindo-gray-500 mb-1.5">Registered:</p>
              <div className="flex flex-wrap gap-2">
                {trip.registered_children.map((child) => (
                  <span
                    key={child.registration_id}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      child.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {child.name}
                    <span className="text-[10px]">
                      {child.status === 'confirmed' ? '✓' : '⏳'}
                    </span>
                    {showWithdrawChoice === child.registration_id ? (
                      <span className="ml-1 inline-flex gap-1">
                        <button
                          disabled={withdrawingId === child.registration_id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setWithdrawingId(child.registration_id);
                            try {
                              await withdrawRegistration(child.registration_id, 'credit');
                              loadTrips();
                            } catch { /* handled silently */ }
                            finally { setWithdrawingId(null); setShowWithdrawChoice(null); }
                          }}
                          className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] text-white hover:bg-green-700"
                          title="Keep as account credit"
                        >
                          Credit
                        </button>
                        <button
                          disabled={withdrawingId === child.registration_id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setWithdrawingId(child.registration_id);
                            try {
                              await withdrawRegistration(child.registration_id, 'refund');
                              loadTrips();
                            } catch { /* handled silently */ }
                            finally { setWithdrawingId(null); setShowWithdrawChoice(null); }
                          }}
                          className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white hover:bg-blue-700"
                          title="Refund to card"
                        >
                          Refund
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowWithdrawChoice(null); }}
                          className="rounded bg-gray-400 px-1.5 py-0.5 text-[10px] text-white hover:bg-gray-500"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      child.status === 'confirmed' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowWithdrawChoice(child.registration_id); }}
                          className="ml-1 text-[10px] text-red-500 hover:text-red-700"
                          title="Withdraw"
                        >
                          ✕
                        </button>
                      ) : (
                        <button
                          disabled={withdrawingId === child.registration_id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setWithdrawingId(child.registration_id);
                            try {
                              await cancelRegistration(child.registration_id);
                              loadTrips();
                            } catch { /* handled silently */ }
                            finally { setWithdrawingId(null); }
                          }}
                          className="ml-1 text-[10px] text-red-500 hover:text-red-700"
                          title="Cancel registration"
                        >
                          ✕
                        </button>
                      )
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
