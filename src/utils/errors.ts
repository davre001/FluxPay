// Error handling middleware and utilities

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export function handleError(error: unknown) {
  // TODO: implement error handling logic
  console.error(error);
}
