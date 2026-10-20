import { FieldError, ValidationError } from "../../src/utils/AppError";

// Mengembalikan daftar nama field yang gagal validasi (array kosong jika valid)
export async function fieldYangGagal(proses: Promise<unknown>): Promise<string[]> {
  try {
    await proses;
    return [];
  } catch (err) {
    if (err instanceof ValidationError) {
      return (err.detail as FieldError[]).map((d) => d.field);
    }
    throw err; // error jenis lain berarti bug sungguhan, biarkan test gagal
  }
}

// Mengembalikan error yang dilempar (atau null jika tidak melempar), untuk memeriksa isinya
export async function tangkapError(proses: Promise<unknown>): Promise<unknown> {
  try {
    await proses;
    return null;
  } catch (err) {
    return err;
  }
}

// Pengulang karakter agar payload panjang mudah ditulis: ulang(73) = "aaaa..."
export function ulang(jumlah: number, karakter = "a"): string {
  return karakter.repeat(jumlah);
}

// Tipe baris untuk it.each: [judul, payload, field yang diharapkan gagal]
export type KasusGagal = [string, Record<string, unknown>, string];
// Tipe baris untuk it.each: [judul, payload, sebagian hasil yang diharapkan]
export type KasusValid = [string, Record<string, unknown>, Record<string, unknown>];