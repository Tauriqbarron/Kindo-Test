import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@example.com' },
    token: 'test-token',
    loading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock API client
const mockFetchChildren = vi.fn();
const mockFetchDashboard = vi.fn();

vi.mock('../../api/client', () => ({
  fetchChildren: (...args: unknown[]) => mockFetchChildren(...args),
  fetchDashboard: (...args: unknown[]) => mockFetchDashboard(...args),
  createChild: vi.fn(),
  updateChild: vi.fn(),
  deleteChild: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome message', async () => {
    mockFetchChildren.mockResolvedValue([]);
    mockFetchDashboard.mockResolvedValue([]);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome, Sarah')).toBeInTheDocument();
    });
  });

  it('renders empty state when no registrations', async () => {
    mockFetchChildren.mockResolvedValue([]);
    mockFetchDashboard.mockResolvedValue([]);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No trip registrations yet.')).toBeInTheDocument();
    });
  });

  it('renders registrations with payment status', async () => {
    mockFetchChildren.mockResolvedValue([
      { id: 'child-1', name: 'Emma Wilson', grade: 'Year 5', created_at: '2026-01-01' },
    ]);
    mockFetchDashboard.mockResolvedValue([
      {
        id: 'reg-1',
        trip: { id: 'trip-1', title: 'Museum Visit', destination: 'Te Papa', date: '2026-06-15', cost: '45.00' },
        student_name: 'Emma Wilson',
        child_name: 'Emma Wilson',
        status: 'confirmed',
        payment_status: 'success',
        created_at: '2026-01-01',
      },
    ]);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Museum Visit')).toBeInTheDocument();
    });
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getAllByText(/Emma Wilson/).length).toBeGreaterThan(0);
  });

  it('renders pending payment status', async () => {
    mockFetchChildren.mockResolvedValue([]);
    mockFetchDashboard.mockResolvedValue([
      {
        id: 'reg-2',
        trip: { id: 'trip-1', title: 'Beach Trip', destination: 'Mount Maunganui', date: '2026-07-01', cost: '55.00' },
        student_name: 'Jack Wilson',
        child_name: 'Jack Wilson',
        status: 'pending',
        payment_status: null,
        created_at: '2026-01-01',
      },
    ]);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Beach Trip')).toBeInTheDocument();
      expect(screen.getByText('Pending Payment')).toBeInTheDocument();
    });
  });

  it('renders children list', async () => {
    mockFetchChildren.mockResolvedValue([
      { id: 'child-1', name: 'Emma Wilson', grade: 'Year 5', created_at: '2026-01-01' },
    ]);
    mockFetchDashboard.mockResolvedValue([]);

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Emma Wilson')).toBeInTheDocument();
      expect(screen.getByText('Year 5')).toBeInTheDocument();
    });
  });
});
