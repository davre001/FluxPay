// API service layer for frontend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export async function submitPayment(paymentData: any) {
  // TODO: submit payment to backend
  const response = await fetch(`${API_BASE_URL}/api/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
  return response.json();
}

export async function getPaymentStatus(paymentId: string) {
  // TODO: fetch payment status
  const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`);
  return response.json();
}
