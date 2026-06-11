import { ValidationError } from './errors.ts';
import { normalizeAddress, sanitizeString } from './helpers.ts';

export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'cancelled'];
export const SUPPORTED_CURRENCIES = ['FPT', 'ETH', 'USDC', 'USD'];

export function validatePaymentAmount(amount: any) {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
}

export function validateEmail(email: any) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidEthereumAddress(address: any) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTransactionHash(hash: any) {
  return typeof hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function assertPaymentStatus(status: any) {
  if (!PAYMENT_STATUSES.includes(status)) {
    throw new ValidationError(`Status must be one of: ${PAYMENT_STATUSES.join(', ')}`);
  }
  return status;
}

export function parsePaymentInput(data: any = {}) {
  const amount = Number(data.amount);
  if (!validatePaymentAmount(amount)) {
    throw new ValidationError('Amount must be a positive number');
  }

  const userId = sanitizeString(data.userId);
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('userId is required');
  }

  const currencyInput = sanitizeString(data.currency || 'FPT');
  if (typeof currencyInput !== 'string') {
    throw new ValidationError('currency must be a string');
  }
  const currency = currencyInput.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new ValidationError(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  const transactionHash = sanitizeString(data.transactionHash);
  if (transactionHash && !isValidTransactionHash(transactionHash)) {
    throw new ValidationError('transactionHash must be a 32-byte hex string');
  }

  const buyerWallet = normalizeAddress(data.buyerWallet);
  if (buyerWallet && !isValidEthereumAddress(buyerWallet)) {
    throw new ValidationError('buyerWallet must be a valid Ethereum address');
  }

  const sellerWallet = normalizeAddress(data.sellerWallet);
  if (sellerWallet && !isValidEthereumAddress(sellerWallet)) {
    throw new ValidationError('sellerWallet must be a valid Ethereum address');
  }

  return {
    amount,
    userId,
    currency,
    description: String(sanitizeString(data.description || '')),
    datasetId: String(sanitizeString(data.datasetId || '')),
    buyerWallet,
    sellerWallet,
    transactionHash,
    network: String(sanitizeString(data.network || '')),
    metadata: data.metadata && typeof data.metadata === 'object' ? data.metadata : {},
  };
}
