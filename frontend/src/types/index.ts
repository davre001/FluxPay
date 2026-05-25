// Frontend types and interfaces

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PaymentFormData {
  amount: number;
  email: string;
  currency: string;
}
