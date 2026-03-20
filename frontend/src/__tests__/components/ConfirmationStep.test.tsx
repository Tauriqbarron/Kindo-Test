import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationStep from '../../components/wizard/ConfirmationStep';
import type { Trip, PaymentResult } from '../../types';

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
  spots_remaining: 24,
  is_full: false,
};

const mockPaymentResult: PaymentResult = {
  success: true,
  transaction: {
    id: '3',
    registration: '2',
    amount: '45.00',
    status: 'success',
    transaction_ref: 'TX-123-ABC',
    card_last_four: '1111',
    processed_at: '2026-03-20T10:30:00Z',
    created_at: '2026-03-20T10:30:00Z',
  },
  registration: {
    id: '2',
    trip: '1',
    student_name: 'Emma Wilson',
    parent_name: 'Sarah Wilson',
    parent_email: 'sarah@example.com',
    parent_phone: '',
    status: 'confirmed',
    created_at: '2026-03-20T10:00:00Z',
  },
};

describe('ConfirmationStep', () => {
  const dispatch = vi.fn();

  it('displays success message with student name and trip', () => {
    render(<ConfirmationStep trip={mockTrip} paymentResult={mockPaymentResult} dispatch={dispatch} />);
    expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
    expect(screen.getAllByText(/Emma Wilson/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Museum Visit/).length).toBeGreaterThanOrEqual(1);
  });

  it('displays receipt details', () => {
    render(<ConfirmationStep trip={mockTrip} paymentResult={mockPaymentResult} dispatch={dispatch} />);
    expect(screen.getByText('$45.00')).toBeInTheDocument();
    expect(screen.getByText('**** 1111')).toBeInTheDocument();
    expect(screen.getByText('TX-123-ABC')).toBeInTheDocument();
  });

  it('dispatches RESET on Register Another Child click', async () => {
    const user = userEvent.setup();
    render(<ConfirmationStep trip={mockTrip} paymentResult={mockPaymentResult} dispatch={dispatch} />);

    await user.click(screen.getByText('Register Another Child'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'RESET' });
  });
});
