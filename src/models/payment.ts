// Payment domain models

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
}
