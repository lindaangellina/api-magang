// Ambil hanya field yang benar-benar diisi.
// Dengan target ES2022, properti class yang belum diisi bisa muncul sebagai undefined,
// jadi nilai undefined harus disaring. null, string kosong, 0, dan false adalah nilai
// yang sengaja dikirim client, jadi TETAP dipertahankan.
export function hanyaYangDiisi<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, nilai]) => nilai !== undefined)
  ) as Partial<T>;
}