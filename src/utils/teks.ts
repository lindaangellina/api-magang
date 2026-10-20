// Memotong teks agar hasilnya tidak pernah lebih panjang dari `max`.
// Keputusan desain (lihat tests/unit/utils/teks.test.ts):
// - max <= 0          -> ""  (tidak ada ruang sama sekali)
// - max 1..3          -> titik sebanyak max (".", "..", "..."), karena "..." sendiri sudah 3 karakter
// - teks <= max       -> teks apa adanya
// - selain itu        -> potong lalu tambah "..." (total panjang tepat `max`)
export function potongTeks(teks: string, max: number): string {
  if (max <= 0) return "";
  if (teks.length <= max) return teks;
  if (max <= 3) return ".".repeat(max);
  return teks.slice(0, max - 3) + "...";
}