// src/utils/validasi.util.ts
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError as ClassValidatorError } from "class-validator";
import { FieldError, ValidationError } from "./AppError";

export type Sumber = "body" | "query" | "params";

// MINGGU 15 SELASA: logika validasi dipisah dari Express supaya bisa diuji sebagai fungsi murni.
// Middleware validasi() di src/middlewares hanya tinggal membungkus fungsi ini.
export async function validasiDto<T extends object>(
  dto: ClassConstructor<T>,
  mentah: unknown,
  sumber: Sumber = "body"
): Promise<T> {
  // Express 5: req.body bisa undefined kalau tidak ada body
  const data = mentah ?? {};

  // Tolak body yang bukan objek JSON (misal array atau teks)
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new ValidationError([{ field: sumber, pesan: `${sumber} harus berupa objek` }]);
  }

  const instance = plainToInstance(dto, data as Record<string, unknown>, {
    exposeDefaultValues: true,
  });

  const errors = await validate(instance, {
    whitelist: true, // buang properti tanpa decorator
    forbidNonWhitelisted: sumber === "body", // body dengan properti asing ditolak
    validationError: { target: false, value: false }, // JANGAN ikutkan nilai (mis. password)
  });

  if (errors.length > 0) {
    throw new ValidationError(ratakan(errors));
  }

  return instance;
}

// Meratakan output class-validator (bersarang) menjadi daftar { field, pesan }
// sesuai format error Minggu 13.
export function ratakan(
  errors: ClassValidatorError[],
  awalan: string = ""
): FieldError[] {
  return errors.flatMap((e) => {
    const field = awalan ? `${awalan}.${e.property}` : e.property;

    const pesanSendiri: FieldError[] = Object.entries(e.constraints ?? {}).map(
      ([jenis, pesan]) => ({
        field,
        // Pesan bawaan untuk properti asing berbahasa Inggris, kita ganti
        pesan:
          jenis === "whitelistValidation"
            ? "Properti ini tidak diizinkan"
            : pesan,
      })
    );

    // Objek/array bersarang punya children, ratakan secara rekursif
    const pesanAnak = e.children?.length ? ratakan(e.children, field) : [];

    return [...pesanSendiri, ...pesanAnak];
  });
}