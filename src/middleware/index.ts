// Middleware for request handling

export function requestLogger(req: any, res: any, next: any) {
  // TODO: log incoming requests
  next();
}

export function errorHandler(err: any, req: any, res: any, next: any) {
  // TODO: handle errors consistently
  res.status(err.statusCode || 500).json({ error: err.message });
}
