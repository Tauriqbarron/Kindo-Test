import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegistrationStep from '../../components/wizard/RegistrationStep';
import type { Trip } from '../../types';

const mockTrip: Trip = {
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
};

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock API client
vi.mock('../../api/client', () => ({
  fetchChildren: vi.fn().mockResolvedValue([
    { id: 'child-1', name: 'Emma Wilson', grade: 'Year 5', created_at: '2026-01-01' },
    { id: 'child-2', name: 'Jack Wilson', grade: 'Year 3', created_at: '2026-01-01' },
  ]),
  createRegistration: vi.fn().mockResolvedValue({
    id: 'reg-1',
    trip: '1',
    student_name: 'Emma Wilson',
    parent_name: 'Sarah Wilson',
    parent_email: 'sarah@example.com',
    parent_phone: '',
    status: 'pending',
    created_at: '2026-01-01',
  }),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('RegistrationStep', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@example.com' },
        token: 'test-token',
        loading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      });
    });

    it('renders child dropdown instead of manual form', async () => {
      renderWithRouter(<RegistrationStep trip={mockTrip} dispatch={mockDispatch} />);

      await waitFor(() => {
        expect(screen.getByText('Select Child')).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('e.g. Emma Wilson')).not.toBeInTheDocument();

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Emma Wilson (Year 5)')).toBeInTheDocument();
      expect(screen.getByText('Jack Wilson (Year 3)')).toBeInTheDocument();
    });

    it('shows parent info from user profile', async () => {
      renderWithRouter(<RegistrationStep trip={mockTrip} dispatch={mockDispatch} />);

      await waitFor(() => {
        expect(screen.getByText(/Sarah Wilson/)).toBeInTheDocument();
        expect(screen.getByText(/sarah@example.com/)).toBeInTheDocument();
      });
    });
  });

  describe('when anonymous', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      });
    });

    it('renders manual form fields', () => {
      renderWithRouter(<RegistrationStep trip={mockTrip} dispatch={mockDispatch} />);

      expect(screen.getByPlaceholderText('e.g. Emma Wilson')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Sarah Wilson')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('sarah@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('021-555-0123')).toBeInTheDocument();
    });

    it('does not show child dropdown', () => {
      renderWithRouter(<RegistrationStep trip={mockTrip} dispatch={mockDispatch} />);

      expect(screen.queryByText('Select Child')).not.toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegistrationStep trip={mockTrip} dispatch={mockDispatch} />);

      await user.click(screen.getByRole('button', { name: 'Continue to Payment' }));

      await waitFor(() => {
        expect(screen.getByText('Student name is required')).toBeInTheDocument();
      });
    });
  });
});
