export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(
    statusCode: number,
    message: string,
    code = 'api_error'
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message, 'validation_error');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message, 'not_found');
    this.name = 'NotFoundError';
  }
}

export class PaymentError extends ApiError {
  constructor(message: string, statusCode = 402) {
    super(statusCode, message, 'payment_error');
    this.name = 'PaymentError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(401, message, 'unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export function handleError(error: unknown) {
  console.error(error);
}
