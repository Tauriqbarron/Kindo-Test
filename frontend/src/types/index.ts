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
}

export interface Registration {
  id: string;
  trip: string | Trip;
  student_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
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

export interface RegistrationFormData {
  trip: string;
  student_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
}

export interface PaymentFormData {
  registration_id: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
}
