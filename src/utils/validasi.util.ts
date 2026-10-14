// src/utils/validasi.util.ts
import { ValidationError as ClassValidatorError } from "class-validator";
import { FieldError } from "./AppError";

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