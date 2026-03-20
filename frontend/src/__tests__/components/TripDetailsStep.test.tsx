import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripDetailsStep from '../../components/wizard/TripDetailsStep';
import type { Trip } from '../../types';

const mockTrips: Trip[] = [
  {
    id: '1',
    title: 'Museum Visit',
    description: 'A day at the museum',
    destination: 'Te Papa',
    date: '2026-06-15',
    cost: '45.00',
    school_id: 'SCH001',
    activity_id: 'ACT001',
    capacity: 30,
    spots_remaining: 25,
    is_full: false,
  },
  {
    id: '2',
    title: 'Full Trip',
    description: 'No spots left',
    destination: 'Beach',
    date: '2026-07-01',
    cost: '30.00',
    school_id: 'SCH002',
    activity_id: 'ACT002',
    capacity: 1,
    spots_remaining: 0,
    is_full: true,
  },
];

vi.mock('../../api/client', () => ({
  fetchTrips: vi.fn(),
}));

import { fetchTrips } from '../../api/client';
const mockFetchTrips = vi.mocked(fetchTrips);

describe('TripDetailsStep', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    mockFetchTrips.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<TripDetailsStep dispatch={dispatch} />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders trip cards after loading', async () => {
    mockFetchTrips.mockResolvedValue(mockTrips);
    render(<TripDetailsStep dispatch={dispatch} />);

    await waitFor(() => {
      expect(screen.getByText('Museum Visit')).toBeInTheDocument();
    });
    expect(screen.getByText('Full Trip')).toBeInTheDocument();
  });

  it('disables register button for full trips', async () => {
    mockFetchTrips.mockResolvedValue(mockTrips);
    render(<TripDetailsStep dispatch={dispatch} />);

    await waitFor(() => {
      expect(screen.getByText('Full')).toBeInTheDocument();
    });
    expect(screen.getByText('Full')).toBeDisabled();
  });

  it('dispatches SELECT_TRIP on register click', async () => {
    mockFetchTrips.mockResolvedValue(mockTrips);
    const user = userEvent.setup();
    render(<TripDetailsStep dispatch={dispatch} />);

    await waitFor(() => {
      expect(screen.getByText('Register')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Register'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_TRIP', payload: mockTrips[0] });
  });

  it('shows error with retry button on fetch failure', async () => {
    mockFetchTrips.mockRejectedValue(new Error('Network error'));
    render(<TripDetailsStep dispatch={dispatch} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load trips')).toBeInTheDocument();
    });
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('retries on Try Again click', async () => {
    mockFetchTrips.mockRejectedValueOnce(new Error('Network error'));
    mockFetchTrips.mockResolvedValueOnce(mockTrips);
    const user = userEvent.setup();
    render(<TripDetailsStep dispatch={dispatch} />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Try Again'));
    await waitFor(() => {
      expect(screen.getByText('Museum Visit')).toBeInTheDocument();
    });
  });

  it('shows empty state when no trips', async () => {
    mockFetchTrips.mockResolvedValue([]);
    render(<TripDetailsStep dispatch={dispatch} />);

    await waitFor(() => {
      expect(screen.getByText(/no trips available/i)).toBeInTheDocument();
    });
  });
});
