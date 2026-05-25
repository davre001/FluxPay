// Utility functions for validation

export function validatePaymentAmount(amount: number): boolean {
  // TODO: implement payment validation logic
  return amount > 0;
}

export function validateEmail(email: string): boolean {
  // TODO: implement email validation
  return email.includes('@');
}
