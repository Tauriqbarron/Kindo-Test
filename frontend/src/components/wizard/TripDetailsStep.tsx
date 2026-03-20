import { useEffect, useState } from 'react';
import type { Trip } from '../../types';
import type { WizardAction } from './wizardReducer';
import { fetchTrips } from '../../api/client';

interface Props {
  dispatch: React.Dispatch<WizardAction>;
}

export default function TripDetailsStep({ dispatch }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
        </div>
      ))}
    </div>
  );
}
