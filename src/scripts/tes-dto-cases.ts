import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000/api/v1";
const MENTOR_EMAIL = process.env.MENTOR_EMAIL ?? "";
const MENTOR_PASSWORD = process.env.MENTOR_PASSWORD ?? "";
const MULAI = "<!-- HASIL-UJI:MULAI -->";
const SELESAI = "<!-- HASIL-UJI:SELESAI -->";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

interface Kasus {
  label: string;
  metode: string;
  path: string;
  body?: unknown;
  token?: string;
  status: number; // status HTTP yang diharapkan
  field?: string; // untuk 422: field yang harus muncul di detail
  tampil?: string; // teks di kolom payload (default: body, atau path untuk GET)
  simpanId?: (id: number) => void; // dipanggil dengan data.id jika sukses
}

interface Grup {
  dto: string;
  endpoint: string;
  catatan?: string;
  valid: Kasus[];
  tidakValid: Kasus[];
}

interface Hasil {
  status: number;
  body: Json;
}

let kenaRateLimit = false;

async function panggil(k: Kasus): Promise<Hasil> {
  const headers: Record<string, string> = {};
  if (k.body !== undefined) headers["Content-Type"] = "application/json";
  if (k.token) headers["Authorization"] = `Bearer ${k.token}`;
  const res = await fetch(`${BASE}${k.path}`, {
    method: k.metode,
    headers,
    body: k.body === undefined ? undefined : JSON.stringify(k.body),
  });
  const teks = await res.text();
  let isi: Json = null;
  try {
    isi = teks ? JSON.parse(teks) : null;
  } catch {
    isi = teks;
  }
  if (res.status === 429) kenaRateLimit = true;
  return { status: res.status, body: isi };
}

function detailError(h: Hasil): Array<{ field: string; pesan: string }> {
  return (h.body?.error?.detail as Array<{ field: string; pesan: string }> | undefined) ?? [];
}

// Payload ditampilkan ringkas: string panjang dipotong supaya dokumen tetap terbaca
function ringkas(nilai: unknown): string {
  return JSON.stringify(nilai, (_k, v) =>
    typeof v === "string" && v.length > 60 ? `${v.slice(0, 15)}…(${v.length} karakter)` : v
  );
}

function sel(teks: string): string {
  return teks.replace(/\|/g, "\\|");
}

interface Baris {
  no: number;
  payload: string;
  harap: string;
  nyata: string;
  cocok: boolean;
}

async function jalankan(daftar: Kasus[]): Promise<Baris[]> {
  const baris: Baris[] = [];
  let no = 1;
  for (const k of daftar) {
    const h = await panggil(k);
    const detail = detailError(h);
    let cocok = h.status === k.status;
    if (cocok && k.field) cocok = detail.some((d) => d.field === k.field);

    if (cocok && k.simpanId && h.body?.data?.id) k.simpanId(h.body.data.id as number);

    let nyata = `${h.status}`;
    if (h.status === 422 && detail.length > 0) {
      const dipilih = detail.find((d) => d.field === k.field) ?? detail[0];
      nyata += `, ${dipilih.field}: "${dipilih.pesan}"`;
    } else if (h.body?.error?.kode) {
      nyata += ` ${h.body.error.kode}`;
    }
    nyata += cocok ? " ✓" : " ✗";

    const harap = k.status === 422 && k.field ? `422, field ${k.field}` : `${k.status}`;
    const payload =
      k.tampil ?? (k.body !== undefined ? ringkas(k.body) : `${k.metode} ${k.path}`);
    baris.push({ no: no++, payload, harap, nyata, cocok });
  }
  return baris;
}

function tabel(baris: Baris[]): string {
  const kepala = "| # | Payload | Diharapkan | Hasil nyata |\n|---|---|---|---|\n";
  return (
    kepala +
    baris
      .map((b) => `| ${b.no} | \`${sel(b.payload)}\` | ${sel(b.harap)} | ${sel(b.nyata)} |`)
      .join("\n")
  );
}

async function masuk(email: string, password: string): Promise<{ token: string; refresh: string; id: number; role: string }> {
  const h = await panggil({ label: "login", metode: "POST", path: "/auth/login", body: { email, password }, status: 200 });
  if (h.status !== 200) throw new Error(`Login ${email} gagal: HTTP ${h.status} ${JSON.stringify(h.body)}`);
  return {
    token: h.body.data.accessToken as string,
    refresh: h.body.data.refreshToken as string,
    id: h.body.data.peserta.id as number,
    role: h.body.data.peserta.role as string,
  };
}

async function main(): Promise<void> {
  const ts = Date.now();
  console.log(`Menjalankan kasus uji DTO terhadap ${BASE}\n`);

  // ----------------------------- persiapan -----------------------------
  const emailA = `dtocase${ts}@mail.com`;
  const reg = await panggil({
    label: "setup",
    metode: "POST",
    path: "/auth/register",
    body: { nama: "Peserta Kasus", sekolah: "SMK Uji", email: emailA, password: "Rahasia123", konfirmasiPassword: "Rahasia123" },
    status: 201,
  });
  if (reg.status !== 201) throw new Error(`Persiapan gagal (register): ${JSON.stringify(reg.body)}`);
  const A = await masuk(emailA, "Rahasia123");
  const refreshUntukLogout = (await masuk(emailA, "Rahasia123")).refresh;

  const j = await panggil({
    label: "setup jurnal",
    metode: "POST",
    path: "/jurnal",
    token: A.token,
    body: { kegiatan: "Jurnal awal untuk kasus uji DTO" },
    status: 201,
  });
  const jurnalA = j.body.data.id as number;

  let tokenMentor = "";
  if (MENTOR_EMAIL && MENTOR_PASSWORD) {
    try {
      const m = await masuk(MENTOR_EMAIL, MENTOR_PASSWORD);
      if (m.role === "mentor") tokenMentor = m.token;
      else console.log(`(akun ${MENTOR_EMAIL} bukan mentor, role: ${m.role})`);
    } catch (e) {
      console.log(`(${e instanceof Error ? e.message : e})`);
    }
  }

  const buatPesertaDibuat: number[] = [];
  const x = (n: number, c = "a") => c.repeat(n);
  const urlPanjang = `https://contoh.com/${x(2100)}`;
  const lampiran = (n: number) => Array.from({ length: n }, (_, i) => ({ url: `https://contoh.com/f${i}.png` }));
  const dasarReg = { nama: "Budi Santoso", sekolah: "SMK 5 Malang", password: "rahasia123", konfirmasiPassword: "rahasia123" };
  const dasarPeserta = { nama: "Peserta Uji", sekolah: "SMK Uji" };

  // ----------------------------- kasus per DTO -----------------------------
  const grup: Grup[] = [];

  const reg1 = (label: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "POST", path: "/auth/register", body, status, field,
  });
  grup.push({
    dto: "RegisterDto",
    endpoint: "POST /auth/register (body)",
    valid: [
      reg1("valid penuh", { ...dasarReg, email: `reg1${ts}@mail.com` }, 201),
      reg1("email huruf besar dan spasi", { ...dasarReg, email: `  Reg2${ts}@Mail.COM  ` }, 201),
      reg1("password tepat 72 karakter", { ...dasarReg, email: `reg3${ts}@mail.com`, password: `a1${x(70, "b")}`, konfirmasiPassword: `a1${x(70, "b")}` }, 201),
      reg1("nama tepat 3 karakter", { ...dasarReg, nama: "Ali", email: `reg4${ts}@mail.com` }, 201),
    ],
    tidakValid: [
      reg1("body kosong", {}, 422, "nama"),
      reg1("nama 2 karakter", { ...dasarReg, nama: "Bu", email: `r${ts}@mail.com` }, 422, "nama"),
      reg1("nama hanya spasi", { ...dasarReg, nama: "      ", email: `r${ts}@mail.com` }, 422, "nama"),
      reg1("email tidak valid", { ...dasarReg, email: "bukan-email" }, 422, "email"),
      reg1("password tanpa angka", { ...dasarReg, email: `r${ts}@mail.com`, password: "rahasiaaa", konfirmasiPassword: "rahasiaaa" }, 422, "password"),
      reg1("password 73 karakter", { ...dasarReg, email: `r${ts}@mail.com`, password: `a1${x(71, "b")}`, konfirmasiPassword: `a1${x(71, "b")}` }, 422, "password"),
      reg1("konfirmasi berbeda", { ...dasarReg, email: `r${ts}@mail.com`, konfirmasiPassword: "beda12345" }, 422, "konfirmasiPassword"),
      reg1("properti asing role", { ...dasarReg, email: `r${ts}@mail.com`, role: "mentor" }, 422, "role"),
      reg1("tipe salah (nama angka, email boolean)", { nama: 123, email: true }, 422, "nama"),
    ],
  });

  const log = (label: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "POST", path: "/auth/login", body, status, field,
  });
  grup.push({
    dto: "LoginDto",
    endpoint: "POST /auth/login (body)",
    catatan: "Kasus tidak valid dibatasi lima karena setiap request gagal dihitung rate limit login (10 per 15 menit).",
    valid: [
      log("login normal", { email: emailA, password: "Rahasia123" }, 200),
      log("email huruf besar dan spasi", { email: `  ${emailA.toUpperCase()}  `, password: "Rahasia123" }, 200),
      log("email dengan spasi di kiri saja", { email: `   ${emailA}`, password: "Rahasia123" }, 200),
    ],
    tidakValid: [
      log("body kosong", {}, 422, "email"),
      log("email tidak valid", { email: "bukan-email", password: "Rahasia123" }, 422, "email"),
      log("password kosong", { email: emailA, password: "" }, 422, "password"),
      log("password bukan teks", { email: emailA, password: 12345678 }, 422, "password"),
      log("password 73 karakter", { email: emailA, password: x(73) }, 422, "password"),
    ],
  });

  const rt = (label: string, path: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "POST", path, body, status, field,
  });
  grup.push({
    dto: "RefreshTokenDto",
    endpoint: "POST /auth/refresh dan POST /auth/logout (body)",
    valid: [
      rt("refresh dengan token sah", "/auth/refresh", { refreshToken: A.refresh }, 200),
      rt("refresh lagi dengan token yang sama", "/auth/refresh", { refreshToken: A.refresh }, 200),
      rt("logout dengan token sah", "/auth/logout", { refreshToken: refreshUntukLogout }, 200),
    ],
    tidakValid: [
      rt("body kosong", "/auth/refresh", {}, 422, "refreshToken"),
      rt("refreshToken berupa angka", "/auth/refresh", { refreshToken: 123 }, 422, "refreshToken"),
      rt("refreshToken kosong", "/auth/refresh", { refreshToken: "" }, 422, "refreshToken"),
      rt("refreshToken berupa array", "/auth/logout", { refreshToken: ["a"] }, 422, "refreshToken"),
      rt("refreshToken null", "/auth/logout", { refreshToken: null }, 422, "refreshToken"),
      rt("refreshToken 5000 karakter", "/auth/refresh", { refreshToken: x(5000) }, 422, "refreshToken"),
      rt("properti asing", "/auth/refresh", { refreshToken: A.refresh, role: "mentor" }, 422, "role"),
    ],
  });

  const cp = (label: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "POST", path: "/peserta", body, status, field,
    simpanId: (id) => buatPesertaDibuat.push(id),
  });
  grup.push({
    dto: "CreatePesertaDto",
    endpoint: "POST /peserta (body)",
    catatan: "Endpoint ini publik (tanpa token), peninggalan Minggu 9. Data uji yang terbentuk dihapus lagi oleh skrip bila akun mentor tersedia.",
    valid: [
      cp("valid penuh", { ...dasarPeserta, email: `cp1${ts}@mail.com`, telepon: "081234567890" }, 201),
      cp("tanpa telepon", { ...dasarPeserta, email: `cp2${ts}@mail.com` }, 201),
      cp("telepon format +62", { ...dasarPeserta, email: `cp3${ts}@mail.com`, telepon: "+6281234567890" }, 201),
      cp("email huruf besar dan spasi", { ...dasarPeserta, email: `  CP4${ts}@Mail.COM ` }, 201),
    ],
    tidakValid: [
      cp("body kosong", {}, 422, "nama"),
      cp("nama 2 karakter", { ...dasarPeserta, nama: "Bu", email: `cp${ts}@mail.com` }, 422, "nama"),
      cp("nama 101 karakter", { ...dasarPeserta, nama: x(101), email: `cp${ts}@mail.com` }, 422, "nama"),
      cp("email tidak valid", { ...dasarPeserta, email: "bukan-email" }, 422, "email"),
      cp("telepon bukan nomor", { ...dasarPeserta, email: `cp${ts}@mail.com`, telepon: "abc" }, 422, "telepon"),
      cp("properti asing role", { ...dasarPeserta, email: `cp${ts}@mail.com`, role: "mentor" }, 422, "role"),
      cp("properti asing password", { ...dasarPeserta, email: `cp${ts}@mail.com`, password: "x" }, 422, "password"),
    ],
  });

  const up = (label: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "PATCH", path: "/me", token: A.token, body, status, field,
  });
  grup.push({
    dto: "UpdateProfilDto",
    endpoint: "PATCH /me dan PATCH /peserta/:id (body)",
    valid: [
      up("ubah nama", { nama: "Nama Uji Satu" }, 200),
      up("ubah telepon", { telepon: "081234567890" }, 200),
      up("sekolah dan telepon +62", { sekolah: "SMK Uji Baru", telepon: "+6281234567890" }, 200),
      up("nama dengan spasi di tepi (di-trim)", { nama: "   Nama Spasi   " }, 200),
    ],
    tidakValid: [
      up("body kosong (minimal satu field)", {}, 422, "body"),
      up("properti asing role", { role: "mentor" }, 422, "role"),
      up("properti asing email", { email: "baru@mail.com" }, 422, "email"),
      up("properti asing password", { password: "x" }, 422, "password"),
      up("nama 2 karakter", { nama: "ab" }, 422, "nama"),
      up("nama 101 karakter", { nama: x(101) }, 422, "nama"),
      up("sekolah hanya spasi", { sekolah: "   " }, 422, "sekolah"),
      up("telepon bukan nomor", { telepon: "abc" }, 422, "telepon"),
    ],
  });

  const cj = (label: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "POST", path: "/jurnal", token: A.token, body, status, field,
  });
  grup.push({
    dto: "CreateJurnalDto (+ LampiranDto)",
    endpoint: "POST /jurnal (body)",
    valid: [
      cj("hanya kegiatan", { kegiatan: "Belajar DTO pada hari Jumat" }, 201),
      cj("dengan hambatan dan linkCommit", { kegiatan: "Belajar DTO pada hari Jumat", hambatan: "Sempat bingung", linkCommit: "https://github.com/lindaangellina/api-magang/commit/abc123" }, 201),
      cj("kegiatan tepat 10 karakter", { kegiatan: "0123456789" }, 201),
      cj("kegiatan tepat 2000 karakter", { kegiatan: x(2000) }, 201),
      cj("dengan 2 lampiran", { kegiatan: "Menguji lampiran jurnal", lampiran: [{ url: "https://contoh.com/a.png", keterangan: "Screenshot" }, { url: "https://contoh.com/b.png" }] }, 201),
    ],
    tidakValid: [
      cj("body kosong", {}, 422, "kegiatan"),
      cj("kegiatan 9 karakter", { kegiatan: "123456789" }, 422, "kegiatan"),
      cj("kegiatan 2001 karakter", { kegiatan: x(2001) }, 422, "kegiatan"),
      cj("properti asing pesertaId", { kegiatan: "Kegiatan yang cukup panjang", pesertaId: 1 }, 422, "pesertaId"),
      cj("hambatan bukan teks", { kegiatan: "Kegiatan yang cukup panjang", hambatan: 123 }, 422, "hambatan"),
      cj("linkCommit bukan URL", { kegiatan: "Kegiatan yang cukup panjang", linkCommit: "bukan-url" }, 422, "linkCommit"),
      cj("linkCommit lebih dari 2048 karakter", { kegiatan: "Kegiatan yang cukup panjang", linkCommit: urlPanjang }, 422, "linkCommit"),
      cj("lampiran 6 item", { kegiatan: "Kegiatan yang cukup panjang", lampiran: lampiran(6) }, 422, "lampiran"),
      cj("lampiran item ke-2 URL salah", { kegiatan: "Kegiatan yang cukup panjang", lampiran: [{ url: "https://contoh.com/a.png" }, { url: "bukan-url" }] }, 422, "lampiran.1.url"),
      cj("lampiran item berisi properti asing", { kegiatan: "Kegiatan yang cukup panjang", lampiran: [{ url: "https://contoh.com/a.png", sisipan: "x" }] }, 422, "lampiran.0.sisipan"),
    ],
  });

  const uj = (label: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "PUT", path: `/jurnal/${jurnalA}`, token: A.token, body, status, field,
  });
  grup.push({
    dto: "UpdateJurnalDto",
    endpoint: "PUT /jurnal/:id (body)",
    valid: [
      uj("ubah kegiatan", { kegiatan: "Kegiatan diperbarui lewat PUT" }, 200),
      uj("ubah hambatan", { hambatan: "Hambatan diperbarui" }, 200),
      uj("ubah linkCommit", { linkCommit: "https://github.com/lindaangellina/api-magang/commit/def456" }, 200),
      uj("ubah kegiatan dan hambatan", { kegiatan: "Kegiatan diperbarui lagi", hambatan: "Tidak ada hambatan" }, 200),
    ],
    tidakValid: [
      uj("body kosong (minimal satu field)", {}, 422, "body"),
      uj("kegiatan 6 karakter (kurang dari 10)", { kegiatan: "pendek" }, 422, "kegiatan"),
      uj("kegiatan bukan teks", { kegiatan: 123 }, 422, "kegiatan"),
      uj("hambatan 2001 karakter", { hambatan: x(2001) }, 422, "hambatan"),
      uj("linkCommit bukan URL", { linkCommit: "bukan-url" }, 422, "linkCommit"),
      uj("properti asing statusReview", { statusReview: "sudah" }, 422, "statusReview"),
      uj("properti asing pesertaId", { pesertaId: 1 }, 422, "pesertaId"),
    ],
  });

  const rv = (label: string, body: unknown, status: number, field?: string): Kasus => ({
    label, metode: "PATCH", path: `/jurnal/${jurnalA}/review`, token: tokenMentor, body, status, field,
  });
  if (tokenMentor) {
    grup.push({
      dto: "ReviewJurnalDto",
      endpoint: "PATCH /jurnal/:id/review (body, akun mentor)",
      valid: [
        rv("belum tanpa catatan", { statusReview: "belum" }, 200),
        rv("sudah dengan catatan", { statusReview: "sudah", catatan: "Kerja bagus, lanjutkan" }, 200),
        rv("sudah, catatan tepat 5 karakter", { statusReview: "sudah", catatan: "Bagus" }, 200),
        rv("sudah, catatan dengan spasi di tepi (di-trim)", { statusReview: "sudah", catatan: "   Catatan rapi   " }, 200),
      ],
      tidakValid: [
        rv("body kosong", {}, 422, "statusReview"),
        rv("statusReview di luar daftar", { statusReview: "lulus" }, 422, "statusReview"),
        rv("sudah tanpa catatan", { statusReview: "sudah" }, 422, "catatan"),
        rv("sudah, catatan 4 karakter", { statusReview: "sudah", catatan: "Baik" }, 422, "catatan"),
        rv("sudah, catatan bukan teks", { statusReview: "sudah", catatan: 12345 }, 422, "catatan"),
        rv("sudah, catatan 2001 karakter", { statusReview: "sudah", catatan: x(2001) }, 422, "catatan"),
        rv("properti asing reviewerId", { statusReview: "sudah", catatan: "Catatan cukup panjang", reviewerId: 1 }, 422, "reviewerId"),
      ],
    });
  }

  const ip = (label: string, path: string, status: number, field?: string): Kasus => ({
    label, metode: "GET", path, status, field,
  });
  grup.push({
    dto: "IdParamDto",
    endpoint: "semua route /:id (params)",
    catatan: "Baris ke-3 menunjukkan bahwa id yang lolos DTO tetapi datanya tidak ada menghasilkan 404 (aturan service), bukan 422.",
    valid: [
      ip("id peserta yang ada", `/peserta/${A.id}`, 200),
      ip("id jurnal yang ada", `/jurnal/${jurnalA}`, 200),
      ip("id valid tapi data tidak ada", "/peserta/9999999", 404),
      ip("jurnal milik peserta", `/peserta/${A.id}/jurnal`, 200),
    ],
    tidakValid: [
      ip("id bukan angka", "/peserta/abc", 422, "id"),
      ip("id nol", "/peserta/0", 422, "id"),
      ip("id negatif", "/peserta/-1", 422, "id"),
      ip("id desimal", "/peserta/1.5", 422, "id"),
      ip("id lebih dari batas integer", "/peserta/99999999999", 422, "id"),
      ip("id jurnal bukan angka", "/jurnal/abc", 422, "id"),
    ],
  });

  grup.push({
    dto: "ListPesertaQueryDto (+ ListQueryDto)",
    endpoint: "GET /peserta (query)",
    valid: [
      ip("tanpa parameter", "/peserta", 200),
      ip("page dan limit", "/peserta?page=2&limit=5", 200),
      ip("sortBy dan order huruf kecil", "/peserta?sortBy=nama&order=asc", 200),
      ip("filter q, fase, sekolah", "/peserta?q=budi&fase=1&sekolah=SMK", 200),
    ],
    tidakValid: [
      ip("page nol", "/peserta?page=0", 422, "page"),
      ip("page bukan angka", "/peserta?page=abc", 422, "page"),
      ip("page lebih dari batas", "/peserta?page=99999999999", 422, "page"),
      ip("limit 1000", "/peserta?limit=1000", 422, "limit"),
      ip("limit nol", "/peserta?limit=0", 422, "limit"),
      ip("sortBy di luar whitelist", "/peserta?sortBy=password", 422, "sortBy"),
      ip("order sembarang", "/peserta?order=sembarang", 422, "order"),
      ip("sekolah ganda (array)", "/peserta?sekolah=a&sekolah=b", 422, "sekolah"),
      ip("fase 9", "/peserta?fase=9", 422, "fase"),
      ip("q 101 karakter", `/peserta?q=${x(101)}`, 422, "q"),
    ],
  });

  if (tokenMentor) {
    const lj = (label: string, path: string, status: number, field?: string): Kasus => ({
      label, metode: "GET", path, token: tokenMentor, status, field,
    });
    grup.push({
      dto: "ListJurnalQueryDto",
      endpoint: "GET /jurnal (query, akun mentor)",
      valid: [
        lj("tanpa parameter", "/jurnal", 200),
        lj("belumDireview=true", "/jurnal?belumDireview=true&limit=5", 200),
        lj("rentang tanggal dan sortBy", "/jurnal?from=2026-01-01&to=2026-12-31&sortBy=statusReview&order=asc", 200),
        lj("filter pesertaId dan statusReview", `/jurnal?pesertaId=${A.id}&statusReview=belum`, 200),
      ],
      tidakValid: [
        lj("belumDireview bukan boolean", "/jurnal?belumDireview=abc", 422, "belumDireview"),
        lj("belumDireview bertentangan dengan statusReview", "/jurnal?belumDireview=true&statusReview=sudah", 422, "belumDireview"),
        lj("tanggal tidak ada (31 Februari)", "/jurnal?from=2026-02-31", 422, "from"),
        lj("format tanggal salah", "/jurnal?from=31-01-2026", 422, "from"),
        lj("statusReview di luar daftar", "/jurnal?statusReview=lulus", 422, "statusReview"),
        lj("pesertaId bukan angka", "/jurnal?pesertaId=abc", 422, "pesertaId"),
        lj("pesertaId lebih dari batas integer", "/jurnal?pesertaId=99999999999", 422, "pesertaId"),
        lj("sortBy di luar whitelist", "/jurnal?sortBy=password", 422, "sortBy"),
      ],
    });
  }

  // ----------------------------- eksekusi -----------------------------
  let total = 0;
  let cocok = 0;
  const bagian: string[] = [];
  for (const g of grup) {
    const v = await jalankan(g.valid);
    const t = await jalankan(g.tidakValid);
    total += v.length + t.length;
    cocok += [...v, ...t].filter((b) => b.cocok).length;
    console.log(`${g.dto}: valid ${v.filter((b) => b.cocok).length}/${v.length}, tidak valid ${t.filter((b) => b.cocok).length}/${t.length}`);
    for (const b of [...v, ...t].filter((r) => !r.cocok)) {
      console.log(`   GAGAL: ${b.payload.slice(0, 90)} -> harap ${b.harap}, dapat ${b.nyata}`);
    }
    bagian.push(
      `### ${g.dto}\n\nEndpoint: ${g.endpoint}\n` +
        (g.catatan ? `\nCatatan: ${g.catatan}\n` : "") +
        `\n**Valid (${v.length})**\n\n${tabel(v)}\n\n**Tidak valid (${t.length})**\n\n${tabel(t)}\n`
    );
  }

  // bersihkan data uji POST /peserta bila ada mentor
  let bersih = "";
  if (tokenMentor && buatPesertaDibuat.length > 0) {
    let terhapus = 0;
    for (const id of buatPesertaDibuat) {
      const d = await panggil({ label: "hapus", metode: "DELETE", path: `/peserta/${id}`, token: tokenMentor, status: 204 });
      if (d.status === 204) terhapus++;
    }
    bersih = `Data uji dari POST /peserta dihapus kembali: ${terhapus} dari ${buatPesertaDibuat.length}.`;
    console.log(bersih);
  }

  const dilewati = tokenMentor ? "" : "\nDilewati (tanpa akun mentor): ReviewJurnalDto dan ListJurnalQueryDto.\n";
  const tanggal = new Date().toISOString().slice(0, 10);
  const isi =
    `${MULAI}\n\n` +
    `## Hasil uji nyata\n\n` +
    `Dibuat otomatis oleh \`src/scripts/tes-dto-cases.ts\` pada ${tanggal} terhadap API yang berjalan di \`${BASE}\`. ` +
    `Ringkasan: **${cocok} dari ${total} kasus sesuai harapan.** Tanda ✓ berarti hasil nyata sama dengan yang diharapkan.\n` +
    `${dilewati}\n${bagian.join("\n")}\n${SELESAI}`;

  const berkas = join(process.cwd(), "docs", "dto-cases.md");
  if (existsSync(berkas)) {
    const lama = readFileSync(berkas, "utf-8");
    const a = lama.indexOf(MULAI);
    const b = lama.indexOf(SELESAI);
    const baru =
      a >= 0 && b > a
        ? lama.slice(0, a) + isi + lama.slice(b + SELESAI.length)
        : `${lama.trimEnd()}\n\n${isi}\n`;
    writeFileSync(berkas, baru, "utf-8");
    console.log(`\nHasil ditulis ke docs/dto-cases.md`);
  } else {
    writeFileSync(join(process.cwd(), "dto-cases-hasil.md"), isi, "utf-8");
    console.log("\ndocs/dto-cases.md tidak ditemukan, hasil ditulis ke dto-cases-hasil.md");
  }

  if (kenaRateLimit) {
    console.log("\nPERINGATAN: ada respons 429 (rate limit login). Hasil tidak valid. Restart server lalu jalankan ulang.");
    process.exitCode = 1;
  }
  console.log(`\nRingkasan: ${cocok} dari ${total} kasus sesuai harapan`);
  if (cocok !== total) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Skrip berhenti:", err instanceof Error ? err.message : err);
  process.exit(1);
});