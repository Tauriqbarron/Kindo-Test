export interface RegisteredChild {
  registration_id: string;
  name: string;
  status: 'pending' | 'registered' | 'confirmed';
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  date: string;
  cost: string;
  school_id: string;
  activity_id: string;
  capacity: number;
  spots_remaining: number;
  is_full: boolean;
  registered_children: RegisteredChild[];
  registration_close_date: string | null;
  payment_due_date: string | null;
  registration_open: boolean;
}

export interface Registration {
  id: string;
  trip: string | Trip;
  student_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: 'pending' | 'registered' | 'confirmed' | 'failed' | 'cancelled';
  created_at: string;
}

export interface Transaction {
  id: string;
  registration: string;
  amount: string;
  status: 'success' | 'failed' | 'pending';
  transaction_ref: string;
  card_last_four: string;
  processed_at: string;
  created_at: string;
}

export interface PaymentResult {
  success: boolean;
  transaction?: Transaction;
  registration?: Registration;
  error?: string;
  registration_id?: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardRegistration {
  id: string;
  trip: { id: string; title: string; destination: string; date: string; cost: string; payment_due_date: string | null };
  student_name: string;
  child_name: string;
  status: 'pending' | 'registered' | 'confirmed' | 'failed' | 'cancelled';
  payment_status: 'success' | 'failed' | 'pending' | 'owing' | null;
  created_at: string;
  can_withdraw: boolean;
  can_cancel: boolean;
  can_pay: boolean;
  amount_owing: string | null;
  withdrawal_status: 'completed' | 'pending' | 'failed' | null;
}

export interface Withdrawal {
  id: string;
  registration: string;
  amount: string;
  resolution: 'credit' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  processed_at: string | null;
  created_at: string;
}

export interface WithdrawResult {
  success: boolean;
  withdrawal?: Withdrawal;
  credit_balance?: string;
  error?: string;
}

export interface CreditBalance {
  balance: string;
}

export interface RegisterOnlyResult {
  success: boolean;
  registration?: Registration;
}

export interface RegistrationFormData {
  trip: string;
  student_name?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  child_id?: string;
}

export interface PaymentFormData {
  registration_id: string;
  card_number?: string;
  expiry_date?: string;
  cvv?: string;
  use_credit?: boolean;
}
