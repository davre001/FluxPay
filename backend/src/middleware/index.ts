import { ApiError } from '../utils/errors.ts';

export function requestLogger(req, _res, next) {
  console.log(`${req.method} ${req.url}`);
  next?.();
}

export function toErrorResponse(error) {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  console.error(error);
  return {
    statusCode: 500,
    body: {
      error: {
        code: 'internal_server_error',
        message: 'Internal server error',
      },
    },
  };
}

export function errorHandler(err, _req, res, _next) {
  const response = toErrorResponse(err);
  res.status(response.statusCode).json(response.body);
}
