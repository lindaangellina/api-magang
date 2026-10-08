import { ErrorCode } from "./errorCodes";

export interface FieldError {
  field: string;
  pesan: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly kode: ErrorCode = ErrorCode.INTERNAL_ERROR,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, new.target);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Data") {
    super(`${resource} tidak ditemukan`, 404, ErrorCode.NOT_FOUND);
  }
}

export class ValidationError extends AppError {
  constructor(detail: FieldError[]) {
    super("Validasi gagal", 422, ErrorCode.VALIDATION_ERROR, detail);
  }
}

export class UnauthorizedError extends AppError {
  constructor(pesan: string = "Silakan login terlebih dahulu") {
    super(pesan, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(pesan: string = "Kamu tidak berhak melakukan aksi ini") {
    super(pesan, 403, ErrorCode.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(pesan: string) {
    super(pesan, 409, ErrorCode.CONFLICT);
  }
}

export class RateLimitedError extends AppError {
  constructor(cobaLagiDalamDetik: number) {
    super(
      "Terlalu banyak request, coba lagi nanti",
      429,
      ErrorCode.RATE_LIMITED,
      { cobaLagiDalamDetik }
    );
  }
}