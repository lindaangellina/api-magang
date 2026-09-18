export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(pesan: string, statusCode: number = 500) {
    super(pesan);
    this.statusCode = statusCode;
    this.isOperational = true; // error yang kita buat sendiri, bukan bug tak terduga

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Data") {
    super(`${resource} tidak ditemukan`, 404);
  }
}

export class ValidationError extends AppError {
  public readonly detail: string[];

  constructor(detail: string[]) {
    super("Validasi gagal", 400);
    this.detail = detail;
  }
}

export class UnauthorizedError extends AppError {
  constructor(pesan: string = "Tidak memiliki akses") {
    super(pesan, 401);
  }
}

export class ConflictError extends AppError {
  constructor(pesan: string) {
    super(pesan, 409);
  }
}