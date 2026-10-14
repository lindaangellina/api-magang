declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      validated?: { body?: unknown; query?: unknown; params?: unknown };
    }
  }
}

export {};