import { Transform } from "class-transformer";

// Sanitasi: dijalankan SEBELUM validasi (saat plainToInstance).
// Semua decorator hanya mengubah string dan membiarkan tipe lain apa adanya,
// supaya nilai yang salah tipe tetap ditolak oleh decorator validasi.

export const Trim = () =>
  Transform(({ value }) => (typeof value === "string" ? value.trim() : value));

export const KeHurufKecil = () =>
  Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value));

export const KeHurufBesar = () =>
  Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value));

// Jangan pakai @Type(() => Boolean) untuk query string: Boolean("false") === true.
export const KeBoolean = () =>
  Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value; // biarkan apa adanya, nanti ditolak oleh @IsBoolean
  });