// Frontend utility functions

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // TODO: format amount as currency
  return `${currency} ${amount}`;
}

export function formatDate(date: Date): string {
  // TODO: format date consistently
  return date.toLocaleDateString();
}
