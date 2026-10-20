import { existsSync, readFileSync, writeFileSync } from "fs";

const MULAI = "<!-- TEMBAK:MULAI -->";
const SELESAI = "<!-- TEMBAK:SELESAI -->";

const BASE = process.env.BASE_URL ?? "http://localhost:3000/api/v1";
const REGISTER_PATH = process.env.REGISTER_PATH ?? "/auth/register";
const LOGIN_PATH = process.env.LOGIN_PATH ?? "/auth/login";
const ME_PATH = process.env.ME_PATH ?? "/me";
const LIST_PATH = process.env.LIST_PATH ?? "/peserta";
const OUT = process.env.OUT ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

interface Hasil {
  status: number; // 0 = koneksi terputus
  teks: string;
  body: Json;
  tipe: string;
}

type Harapan = "tolak" | "aman" | "tidak-crash" | "413";

interface Permintaan {
  kode: string; // mis. "7a"
  metode: string;
  path: string;
  headers?: Record<string, string>;
  isi?: string; // body mentah
  tampil: string; // teks payload untuk laporan
  harap: Harapan;
  token?: boolean; // butuh token peserta (opsional)
  cek?: (h: Hasil) => string | null; // pemeriksaan tambahan, kembalikan pesan gagal atau null
}

async function kirim(p: { metode: string; path: string; headers?: Record<string, string>; isi?: string }, token?: string): Promise<Hasil> {
  const headers: Record<string, string> = { ...(p.headers ?? {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const coba = async (): Promise<Hasil> => {
    try {
      const res = await fetch(`${BASE}${p.path}`, { method: p.metode, headers, body: p.isi });
      const teks = await res.text();
      let body: Json = null;
      try {
        body = teks ? JSON.parse(teks) : null;
      } catch {
        body = null;
      }
      return { status: res.status, teks, body, tipe: res.headers.get("content-type") ?? "" };
    } catch {
      return { status: 0, teks: "", body: null, tipe: "" };
    }
  };
  let h = await coba();
  if (h.status === 0) h = await coba(); // koneksi bisa diputus server saat menolak body besar
  return h;
}

const JSON_HEADER = { "Content-Type": "application/json" };

function bocor(h: Hasil): string | null {
  if (/\$2[aby]\$\d{2}\$/.test(h.teks)) return "hash password bocor di response";
  if (/QueryFailedError|SQLSTATE|syntax error at or near|relation ".*" does not exist/i.test(h.teks)) {
    return "pesan error database bocor di response";
  }
  return null;
}

function nilai(harap: Harapan, h: Hasil): { ok: boolean; hasil: string } {
  const kebocoran = bocor(h);
  if (kebocoran) return { ok: false, hasil: `GAGAL: ${kebocoran}` };
  if (h.status === 0) return { ok: false, hasil: "GAGAL: koneksi terputus tanpa respons" };
  if (h.status >= 500) return { ok: false, hasil: `GAGAL: server error ${h.status} (crash)` };
  const kode = h.body?.error?.kode ? ` ${h.body.error.kode}` : "";
  switch (harap) {
    case "tolak":
      return h.status >= 400
        ? { ok: true, hasil: `Ditolak dengan benar (${h.status}${kode})` }
        : { ok: false, hasil: `GAGAL: diterima (${h.status}) padahal seharusnya ditolak` };
    case "413":
      return h.status === 413
        ? { ok: true, hasil: `Ditolak dengan benar (413${kode})` }
        : { ok: false, hasil: `GAGAL: seharusnya 413, dapat ${h.status}` };
    case "aman":
      return h.status < 300
        ? { ok: true, hasil: `Diterima (${h.status}), disimpan sebagai teks biasa` }
        : { ok: true, hasil: `Ditolak (${h.status}${kode}), aman walau lebih ketat dari yang diharapkan` };
    case "tidak-crash":
      return { ok: true, hasil: `Tidak crash (${h.status}${kode})` };
  }
}

async function main(): Promise<void> {
  const ts = Date.now();
  console.log(`Uji tembak terhadap ${BASE}\n`);

  const valid = (email: string, ekstra: Record<string, unknown> = {}) => ({
    nama: "Budi Santoso",
    sekolah: "SMK 5 Malang",
    email,
    password: "rahasia123",
    konfirmasiPassword: "rahasia123",
    ...ekstra,
  });
  const ringkasan = (o: unknown): string =>
    JSON.stringify(o, (_k, v) =>
      typeof v === "string" && v.length > 40 ? `${v.slice(0, 12)}…(${v.length} karakter)` : v
    );
  const emailUnik = (p: string) => `${p}${ts}@mail.com`;

  // token untuk payload 7b (PATCH /me): daftar lalu login akun sementara
  let token = process.env.TOKEN ?? "";
  if (!token) {
    const email = emailUnik("tembak");
    await kirim({ metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER, isi: JSON.stringify(valid(email)) });
    const lg = await kirim({ metode: "POST", path: LOGIN_PATH, headers: JSON_HEADER, isi: JSON.stringify({ email, password: "rahasia123" }) });
        token = lg.body?.data?.accessToken ?? lg.body?.dataBersih?.accessToken ?? "";
    if (!token) console.log("(tidak dapat token: payload 7b dilewati. Isi TOKEN=... bila perlu)\n");
  }

  const bodySql = valid(emailUnik("sql"), { nama: "'; DROP TABLE peserta; --" });
  const bodyHtml = valid(emailUnik("html"), { nama: "<script>alert(1)</script>" });
  const email8 = `  Tembak8${ts}@Mail.COM  `;

  const daftar: Permintaan[] = [
    { kode: "1", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER, isi: "{}", tampil: "register dengan body {}", harap: "tolak" },
    { kode: "2", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER, isi: "[]", tampil: "register dengan body []", harap: "tolak" },
    {
      kode: "3", metode: "POST", path: REGISTER_PATH, headers: { "Content-Type": "text/plain" },
      isi: JSON.stringify(valid(emailUnik("txt"))), tampil: "Content-Type text/plain, isi JSON valid", harap: "tolak",
    },
    { kode: "4", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER, isi: JSON.stringify({ nama: 123, email: true }), tampil: ringkasan({ nama: 123, email: true }), harap: "tolak" },
    {
      kode: "5", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER,
      isi: JSON.stringify(valid(emailUnik("spasi"), { nama: "      " })), tampil: 'nama "      " (6 spasi)', harap: "tolak",
    },
    {
      kode: "6", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER,
      isi: JSON.stringify(valid(emailUnik("panjang"), { nama: "A".repeat(10000) })), tampil: "nama 10.000 karakter", harap: "tolak",
    },
    {
      kode: "7a", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER,
      isi: JSON.stringify(valid(emailUnik("role"), { role: "mentor" })), tampil: 'register + { "role": "mentor" }', harap: "tolak",
    },
    {
      kode: "7b", metode: "PATCH", path: ME_PATH, headers: JSON_HEADER, token: true,
      isi: JSON.stringify({ role: "mentor" }), tampil: 'PATCH /me + { "role": "mentor" }', harap: "tolak",
    },
    {
      kode: "8", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER,
      isi: JSON.stringify(valid(email8)), tampil: `email "${email8.replace(String(ts), "…")}"`, harap: "aman",
      cek: (h) => {
        if (h.status >= 300) return null;
                const e = h.body?.data?.email ?? h.body?.dataBersih?.email;
        return e === email8.trim().toLowerCase() ? null : `email tidak dinormalkan (tersimpan sebagai ${e})`;
      },
    },
    {
      kode: "9", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER,
      isi: JSON.stringify(valid(emailUnik("pw100"), { password: "a1" + "b".repeat(98), konfirmasiPassword: "a1" + "b".repeat(98) })),
      tampil: "password 100 karakter", harap: "tolak",
    },
    { kode: "10", metode: "GET", path: `${LIST_PATH}?sekolah=a&sekolah=b`, tampil: "?sekolah=a&sekolah=b", harap: "tolak" },
    { kode: "11", metode: "GET", path: `${LIST_PATH}?page[x]=1&limit[]=5`, tampil: "?page[x]=1&limit[]=5", harap: "tidak-crash" },
    {
      kode: "12", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER,
      isi: JSON.stringify(valid(emailUnik("besar"), { nama: "A".repeat(2 * 1024 * 1024) })), tampil: "body 2 MB", harap: "413",
    },
    {
      kode: "13", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER, isi: JSON.stringify(bodySql),
      tampil: `nama "${bodySql.nama}"`, harap: "aman",
            cek: (h) => (h.status < 300 && (h.body?.data?.nama ?? h.body?.dataBersih?.nama) !== bodySql.nama ? "nama berubah di response" : null),
    },
    {
      kode: "14", metode: "POST", path: REGISTER_PATH, headers: JSON_HEADER, isi: JSON.stringify(bodyHtml),
      tampil: `nama "${bodyHtml.nama}"`, harap: "aman",
            cek: (h) => (h.status < 300 && (h.body?.data?.nama ?? h.body?.dataBersih?.nama) !== bodyHtml.nama ? "nama berubah di response" : null),
    },
  ];

  const baris: Array<{ kode: string; payload: string; status: string; hasil: string; ok: boolean; catatan: string }> = [];
  for (const p of daftar) {
    if (p.token && !token) {
      baris.push({ kode: p.kode, payload: p.tampil, status: "-", hasil: "Dilewati (tidak ada token)", ok: false, catatan: "" });
      continue;
    }
    const h = await kirim(p, p.token ? token : undefined);
    const n = nilai(p.harap, h);
    let ok = n.ok;
    let hasil = n.hasil;
    const tambahan = p.cek ? p.cek(h) : null;
    if (tambahan) {
      ok = false;
      hasil = `GAGAL: ${tambahan}`;
    }
    const catatan: string[] = [];
    if (h.teks.includes('"stack"')) catatan.push("response memuat stack trace (aman hanya jika NODE_ENV=development)");
    if (h.status >= 400 && h.body?.error?.pesan) catatan.push(`pesan: ${h.body.error.pesan}`);
    if (p.kode === "14" && h.status < 300) catatan.push(`Content-Type: ${h.tipe || "-"}`);
    baris.push({ kode: p.kode, payload: p.tampil, status: h.status ? String(h.status) : "putus", hasil, ok, catatan: catatan.join("; ") });
    console.log(`${ok ? "LULUS" : "GAGAL"}  #${p.kode} ${p.tampil} -> ${h.status} ${hasil}`);
  }

  // tabel peserta harus tetap ada setelah payload 13
  const cekTabel = await kirim({ metode: "GET", path: `${LIST_PATH}?limit=1` });
  const tabelUtuh = cekTabel.status === 200;
  console.log(`${tabelUtuh ? "LULUS" : "GAGAL"}  setelah payload 13, GET ${LIST_PATH} -> ${cekTabel.status}`);

  // payload bernomor 7 dinilai benar bila 7a dan 7b keduanya benar
  const nomor = Array.from(new Set(baris.map((b) => b.kode.replace(/[ab]$/, ""))));
  const benar = nomor.filter((n) => baris.filter((b) => b.kode.replace(/[ab]$/, "") === n).every((b) => b.ok)).length;

  const md =
    `## Hasil uji tembak terhadap \`${BASE}\`\n\n` +
    `| # | Payload | Status | Hasil | Catatan |\n|---|---|---|---|---|\n` +
    baris.map((b) => `| ${b.kode} | \`${b.payload.replace(/\|/g, "\\|")}\` | ${b.status} | ${b.hasil.replace(/\|/g, "\\|")} | ${b.catatan.replace(/\|/g, "\\|")} |`).join("\n") +
    `\n\nSetelah payload 13 (SQL), \`GET ${LIST_PATH}\` tetap ${cekTabel.status}: tabel masih utuh.\n\n` +
    `**${benar} dari ${nomor.length} payload ditangani dengan benar.**\n`;

  console.log(`\n${md}`);
  if (OUT) {
    // Kalau berkasnya sudah ada dan memuat penanda, hanya bagian di antara penanda yang diganti
    const lama = existsSync(OUT) ? readFileSync(OUT, "utf-8") : "";
    const a = lama.indexOf(MULAI);
    const b = lama.indexOf(SELESAI);
    const isi = a >= 0 && b > a ? lama.slice(0, a) + `${MULAI}\n\n${md}\n${SELESAI}` + lama.slice(b + SELESAI.length) : md;
    writeFileSync(OUT, isi, "utf-8");
    console.log(`Laporan ditulis ke ${OUT}`);
  }
  if (benar < nomor.length || !tabelUtuh) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Skrip berhenti:", err instanceof Error ? err.message : err);
  process.exit(1);
});