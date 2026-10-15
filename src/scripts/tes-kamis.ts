// Uji otomatis Minggu 14 Kamis (Soal 1-5). Server harus sudah jalan (npm run dev).
// Jalankan:  npx ts-node src/scripts/tes-kamis.ts
// Untuk tes review (Soal 3) dibutuhkan akun berrole mentor:
//   set MENTOR_EMAIL=tes2@mail.com
//   set MENTOR_PASSWORD=Rahasia123
// (kalau tidak diisi, bagian mentor dilewati)

const BASE = process.env.BASE_URL ?? "http://localhost:3000/api/v1";
const MENTOR_EMAIL = process.env.MENTOR_EMAIL ?? "";
const MENTOR_PASSWORD = process.env.MENTOR_PASSWORD ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
interface Hasil {
  status: number;
  body: Json;
}

let lulus = 0;
let gagal = 0;

async function panggil(
  method: string,
  path: string,
  token?: string,
  body?: unknown
): Promise<Hasil> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const teks = await res.text();
  let isi: Json = null;
  try {
    isi = teks ? JSON.parse(teks) : null;
  } catch {
    isi = teks;
  }
  return { status: res.status, body: isi };
}

function ringkas(h: Hasil): string {
  const detail = h.body?.error?.detail as Array<{ field: string; pesan: string }> | undefined;
  if (detail) return detail.map((d) => `${d.field}: ${d.pesan}`).join(" | ");
  return h.body?.pesan ?? h.body?.error?.pesan ?? "";
}

function cek(label: string, kondisi: boolean, h?: Hasil): void {
  if (kondisi) lulus++;
  else gagal++;
  const info = h ? `  [HTTP ${h.status}] ${ringkas(h)}` : "";
  console.log(`${kondisi ? "LULUS" : "GAGAL"}  ${label}${info}`);
}

function punyaField(h: Hasil, field: string): boolean {
  const detail = h.body?.error?.detail as Array<{ field: string }> | undefined;
  return !!detail?.some((d) => d.field === field);
}

function tanpaPassword(label: string, h: Hasil): void {
  const teks = JSON.stringify(h.body).toLowerCase();
  cek(`Soal 5: tidak ada kata "password" di response ${label}`, h.status < 300 && !teks.includes("password"), h);
}

async function daftarDanLogin(prefix: string): Promise<{ id: number; token: string }> {
  const email = `${prefix}${Date.now()}@mail.com`;
  const reg = await panggil("POST", "/auth/register", undefined, {
    nama: "Peserta Uji",
    sekolah: "SMK Uji",
    email,
    password: "Rahasia123",
    konfirmasiPassword: "Rahasia123",
  });
  if (reg.status !== 201) throw new Error(`Register gagal: ${JSON.stringify(reg.body)}`);
  const login = await panggil("POST", "/auth/login", undefined, { email, password: "Rahasia123" });
  return { id: reg.body.data.id as number, token: login.body.data.accessToken as string };
}

async function main(): Promise<void> {
  console.log(`Menguji ${BASE}\n`);

  // ---------------- Soal 1: konfirmasi password ----------------
  console.log("== Soal 1: konfirmasi password ==");
  const email = `kamis${Date.now()}@mail.com`;
  const dasar = { nama: "Peserta Uji", sekolah: "SMK Uji", email, password: "Rahasia123" };

  let h = await panggil("POST", "/auth/register", undefined, dasar);
  cek("register tanpa konfirmasiPassword -> 422 di konfirmasiPassword", h.status === 422 && punyaField(h, "konfirmasiPassword"), h);

  h = await panggil("POST", "/auth/register", undefined, { ...dasar, konfirmasiPassword: "Beda12345" });
  cek("password dan konfirmasi berbeda -> 422 di konfirmasiPassword", h.status === 422 && punyaField(h, "konfirmasiPassword"), h);

  h = await panggil("POST", "/auth/register", undefined, { ...dasar, konfirmasiPassword: "Rahasia123" });
  cek("register valid -> 201", h.status === 201, h);
  cek("response register tidak memuat konfirmasiPassword", h.status === 201 && h.body.data.konfirmasiPassword === undefined, h);
  tanpaPassword("register", h);

  h = await panggil("POST", "/auth/login", undefined, { email, password: "Rahasia123" });
  cek("login setelah register -> 200", h.status === 200, h);
  tanpaPassword("login", h);
  const tokenA: string = h.body.data.accessToken;
  const idA: number = h.body.data.peserta.id;

  const peserB = await daftarDanLogin("kamisb");

  // ---------------- Soal 2: DTO jurnal ----------------
  console.log("\n== Soal 2: DTO jurnal ==");
  h = await panggil("POST", "/jurnal", tokenA, { kegiatan: "Belajar validasi nested dan response DTO" });
  cek("POST jurnal valid -> 201", h.status === 201, h);
  cek("pesertaId diambil dari token", h.status === 201 && h.body.data.pesertaId === idA, h);
  cek("statusReview awal belum", h.status === 201 && h.body.data.statusReview === "belum", h);
  const idJurnal: number = h.body.data?.id;

  h = await panggil("POST", "/jurnal", tokenA, { kegiatan: "Kegiatan yang cukup panjang", pesertaId: 1 });
  cek("pesertaId di body -> 422 di pesertaId", h.status === 422 && punyaField(h, "pesertaId"), h);

  h = await panggil("POST", "/jurnal", tokenA, { kegiatan: "Kegiatan yang cukup panjang", statusReview: "sudah" });
  cek("statusReview di body POST -> 422", h.status === 422 && punyaField(h, "statusReview"), h);

  h = await panggil("POST", "/jurnal", tokenA, { kegiatan: "pendek" });
  cek("kegiatan kurang dari 10 karakter -> 422", h.status === 422 && punyaField(h, "kegiatan"), h);

  h = await panggil("POST", "/jurnal", tokenA, {});
  cek("body kosong -> 422", h.status === 422, h);

  h = await panggil("PUT", `/jurnal/${idJurnal}`, tokenA, { hambatan: "Sempat bingung ValidateNested" });
  cek("PUT hanya hambatan -> 200 (semua field opsional)", h.status === 200 && h.body.data.hambatan === "Sempat bingung ValidateNested", h);

  h = await panggil("PUT", `/jurnal/${idJurnal}`, tokenA, {});
  cek("PUT body kosong -> 422 (minimal satu field)", h.status === 422, h);

  h = await panggil("PUT", `/jurnal/${idJurnal}`, tokenA, { statusReview: "sudah" });
  cek("PUT mencoba ubah statusReview -> 422", h.status === 422 && punyaField(h, "statusReview"), h);

  h = await panggil("PUT", `/jurnal/${idJurnal}`, peserB.token, { hambatan: "Coba edit milik orang lain" });
  cek("peserta lain edit jurnal -> 403 (aturan di service)", h.status === 403, h);

  // ---------------- Soal 4: nested + array ----------------
  console.log("\n== Soal 4: lampiran (nested dan array) ==");
  const isi = "Menguji lampiran pada jurnal harian";
  const lamp = (n: number) => Array.from({ length: n }, (_, i) => ({ url: `https://contoh.com/file${i}.png` }));

  h = await panggil("POST", "/jurnal", tokenA, { kegiatan: isi, lampiran: lamp(6) });
  cek("lampiran 6 item -> 422 di lampiran", h.status === 422 && punyaField(h, "lampiran"), h);

  h = await panggil("POST", "/jurnal", tokenA, {
    kegiatan: isi,
    lampiran: [{ url: "https://contoh.com/a.png" }, { url: "bukan-url" }],
  });
  cek('item ke-2 URL salah -> detail memuat "lampiran.1.url"', h.status === 422 && punyaField(h, "lampiran.1.url"), h);

  h = await panggil("POST", "/jurnal", tokenA, { kegiatan: isi, lampiran: "bukan array" });
  cek("lampiran bukan array -> 422", h.status === 422, h);

  h = await panggil("POST", "/jurnal", tokenA, { kegiatan: isi, lampiran: ["teks biasa"] });
  cek("item lampiran berupa teks -> 422", h.status === 422, h);

  h = await panggil("POST", "/jurnal", tokenA, {
    kegiatan: isi,
    lampiran: [{ url: "https://contoh.com/a.png", sisipan: "x" }],
  });
  cek("properti asing di dalam item lampiran -> 422 (lampiran.0.sisipan)", h.status === 422 && punyaField(h, "lampiran.0.sisipan"), h);

  h = await panggil("POST", "/jurnal", tokenA, {
    kegiatan: isi,
    lampiran: [
      { url: "https://contoh.com/a.png", keterangan: "Screenshot hasil tes" },
      { url: "https://contoh.com/b.png" },
    ],
  });
  cek("2 lampiran valid -> 201 dan tersimpan", h.status === 201 && Array.isArray(h.body.data.lampiran) && h.body.data.lampiran.length === 2, h);
  const idDenganLampiran: number = h.body.data?.id;

  h = await panggil("GET", `/jurnal/${idDenganLampiran}`);
  cek("GET jurnal memuat lampiran dan catatanMentor", h.status === 200 && h.body.data.lampiran?.length === 2 && "catatanMentor" in h.body.data, h);
  tanpaPassword("GET /jurnal/:id", h);

  // ---------------- Soal 3: validasi bersyarat ----------------
  console.log("\n== Soal 3: validasi bersyarat (review) ==");
  let tokenMentor = "";
  if (MENTOR_EMAIL && MENTOR_PASSWORD) {
    const lm = await panggil("POST", "/auth/login", undefined, { email: MENTOR_EMAIL, password: MENTOR_PASSWORD });
    if (lm.status === 200 && lm.body.data.peserta.role === "mentor") tokenMentor = lm.body.data.accessToken;
    else console.log(`(login mentor gagal atau role bukan mentor: HTTP ${lm.status}, role ${lm.body?.data?.peserta?.role})`);
  }

  if (!tokenMentor) {
    console.log("DILEWATI: set MENTOR_EMAIL dan MENTOR_PASSWORD (akun harus berrole mentor)");
  } else {
    const url = `/jurnal/${idJurnal}/review`;

    h = await panggil("PATCH", url, tokenMentor, { statusReview: "sudah" });
    cek("a. sudah tanpa catatan -> 422 di catatan", h.status === 422 && punyaField(h, "catatan"), h);

    h = await panggil("PATCH", url, tokenMentor, { statusReview: "sudah", catatan: "Baik" });
    cek("b. sudah, catatan 'Baik' (4 karakter, kurang dari 5) -> 422", h.status === 422 && punyaField(h, "catatan"), h);

    // "Bagus" persis 5 karakter, jadi lolos MinLength(5): ini batas bawah yang sah
    h = await panggil("PATCH", url, tokenMentor, { statusReview: "sudah", catatan: "Bagus" });
    cek("b2. sudah, catatan 'Bagus' (tepat 5 karakter) -> 200 (batas bawah sah)", h.status === 200, h);

    h = await panggil("PATCH", url, tokenMentor, { statusReview: "belum" });
    cek("c. belum tanpa catatan -> 200", h.status === 200, h);

    h = await panggil("PATCH", url, tokenMentor, { statusReview: "sudah", catatan: "Kerja bagus, lanjutkan" });
    cek("d. sudah dengan catatan valid -> 200 dan catatanMentor tersimpan", h.status === 200 && h.body.data.catatanMentor === "Kerja bagus, lanjutkan" && h.body.data.statusReview === "sudah", h);

    h = await panggil("PATCH", url, tokenMentor, { statusReview: "belum", catatan: { x: 1 } });
    cek("e. belum + catatan aneh -> 200 dan catatanMentor dikosongkan (null)", h.status === 200 && h.body.data.catatanMentor === null, h);

    h = await panggil("PATCH", url, tokenMentor, {});
    cek("f. body kosong -> 422 di statusReview", h.status === 422 && punyaField(h, "statusReview"), h);

    h = await panggil("PATCH", url, tokenMentor, { statusReview: "sudah", catatan: "Catatan cukup panjang", reviewerId: 1 });
    cek("g. properti asing (reviewerId) -> 422", h.status === 422 && punyaField(h, "reviewerId"), h);

    h = await panggil("PATCH", url, tokenA, { statusReview: "belum" });
    cek("h. peserta biasa mencoba review -> 403", h.status === 403, h);
  }

  // ---------------- Soal 5: response DTO ----------------
  console.log("\n== Soal 5: response DTO (tidak ada password di semua endpoint) ==");
  h = await panggil("GET", "/peserta?limit=5");
  tanpaPassword("GET /peserta", h);
  h = await panggil("GET", `/peserta/${idA}`);
  tanpaPassword("GET /peserta/:id", h);
  h = await panggil("GET", "/me", tokenA);
  tanpaPassword("GET /me", h);
  h = await panggil("PATCH", "/me", tokenA, { sekolah: "SMK Uji Baru" });
  tanpaPassword("PATCH /me", h);
  h = await panggil("PATCH", `/peserta/${idA}`, tokenA, { nama: "Peserta Uji Dua" });
  tanpaPassword("PATCH /peserta/:id", h);
  h = await panggil("GET", `/peserta/${idA}/jurnal`);
  tanpaPassword("GET /peserta/:id/jurnal", h);
  cek("GET /peserta/:id/jurnal tetap memuat nama dan daftar jurnal", h.status === 200 && typeof h.body.data.peserta === "string" && h.body.data.jurnal.length >= 1, h);
  h = await panggil("GET", "/me/jurnal", tokenA);
  tanpaPassword("GET /me/jurnal", h);
  if (tokenMentor) {
    h = await panggil("GET", "/jurnal?limit=5", tokenMentor);
    tanpaPassword("GET /jurnal", h);
  }

  console.log(`\nRingkasan: ${lulus} lulus, ${gagal} gagal`);
  if (gagal > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Skrip berhenti:", err instanceof Error ? err.message : err);
  process.exit(1);
});