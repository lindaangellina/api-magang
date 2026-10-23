#!/usr/bin/env node
/*
 * SUNTIK BUG otomatis (mutation testing manual, dijalankan oleh skrip).
 *
 * Untuk setiap bug: ubah SATU file, jalankan test, catat apakah ada test yang gagal,
 * lalu kembalikan file ke aslinya. Hasil ditulis ke docs/suntik-bug-hasil.md.
 *
 * JALANKAN HANYA PADA SALINAN REPOSITORY (bukan yang asli):
 *   node tools/suntik-bug.js --ya            (npm test saja)
 *   node tools/suntik-bug.js --ya --int      (ikut menjalankan integration test, butuh database)
 *
 * Bila skrip terhenti di tengah jalan, jalankan lagi (file asli dipulihkan dari .suntik-backup/),
 * atau cek dengan:  git status  (lalu  git checkout -- src  untuk membatalkan perubahan).
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, ".suntik-backup");
const HASIL = path.join(ROOT, "docs", "suntik-bug-hasil.md");
const OUT_JSON = path.join(ROOT, ".suntik-hasil.json");
const pakaiInt = process.argv.includes("--int");

if (!process.argv.includes("--ya")) {
  console.log("Skrip ini MENGUBAH file di src/ sementara. Jalankan pada SALINAN repository.\nPakai: node tools/suntik-bug.js --ya [--int]");
  process.exit(1);
}

const sandi = (rel) => rel.replace(/[\\/]/g, "__");

function pulihkanSemua() {
  if (!fs.existsSync(BACKUP)) return;
  for (const nama of fs.readdirSync(BACKUP)) {
    const rel = nama.replace(/__/g, "/");
    fs.copyFileSync(path.join(BACKUP, nama), path.join(ROOT, rel));
  }
  fs.rmSync(BACKUP, { recursive: true, force: true });
}

// Sisa dari proses yang pernah terhenti: pulihkan dulu sebelum mulai
pulihkanSemua();
process.on("SIGINT", () => { pulihkanSemua(); process.exit(130); });

const ganti = (s, cari, pengganti) => s.replace(cari, pengganti);

const BUG = [
  { no: 1, deskripsi: "buatMeta: page < totalPages menjadi page <= totalPages", file: "src/utils/pagination.ts",
    ubah: (s) => ganti(s, "page < totalPages", "page <= totalPages") },
  { no: 2, deskripsi: "ListQueryDto: hapus @Max(100) dari limit", file: "src/dto/common.dto.ts",
    ubah: (s) => ganti(s, /[ \t]*@Max\(100, \{ message: "limit maksimal 100" \}\)\r?\n/, "") },
  { no: 3, deskripsi: "UpdateProfilDto: hapus @IsOptional dari field nama", file: "src/dto/peserta.dto.ts",
    ubah: (s) => ganti(s, /(class UpdateProfilDto \{\s*)@IsOptional\(\)\s*\r?\n\s*/, "$1") },
  { no: 4, deskripsi: "authGuard: hapus next() pada jalur sukses", file: "src/middlewares/auth.middleware.ts",
    ubah: (s) => { const i = s.lastIndexOf("next()"); return i < 0 ? s : s.slice(0, i) + "void next" + s.slice(i + 6); } },
  { no: 5, deskripsi: "requireRole: ForbiddenError menjadi UnauthorizedError", file: "src/middlewares/role.middleware.ts",
    ubah: (s) => s.split("ForbiddenError").join("UnauthorizedError") },
  { no: 6, deskripsi: "errorHandler: error 23505 menjadi 400, bukan 409", file: "src/middlewares/error.middleware.ts",
    ubah: (s) => ganti(s, 'return new ConflictError("Data dengan nilai yang sama sudah ada");',
      'return new AppError("Data dengan nilai yang sama sudah ada", 400, ErrorCode.VALIDATION_ERROR);') },
  { no: 7, deskripsi: "AuthService.login: pesan berbeda untuk email salah dan password salah", file: "src/services/auth.service.ts",
    ubah: (s) => ganti(s, 'throw new UnauthorizedError("Email atau password salah");', 'throw new UnauthorizedError("Email tidak terdaftar");') },
  { no: 8, deskripsi: "serialisasi: hapus excludeExtraneousValues", file: "src/utils/serialisasi.ts",
    ubah: (s) => ganti(s, "{ excludeExtraneousValues: true }", "{}") },
  { no: 9, deskripsi: "validasi: forbidNonWhitelisted menjadi false", file: "src/utils/validasi.util.ts",
    ubah: (s) => ganti(s, 'forbidNonWhitelisted: sumber === "body"', "forbidNonWhitelisted: false") },
  { no: 10, deskripsi: "AuthService.logout: refresh token tidak dihapus dari database", file: "src/services/auth.service.ts",
    ubah: (s) => ganti(s, "await this.refreshTokenRepo.delete({ token: refreshTokenInput });", "void refreshTokenInput;") },
];

function jalankan(config) {
  // Path relatif (cwd = ROOT) supaya aman walau nama folder mengandung spasi
  const args = ["jest", ...(config ? ["--config", config] : []), "--json", "--outputFile=.suntik-hasil.json", "--silent", "--forceExit"];
  fs.rmSync(OUT_JSON, { force: true });
  const r = spawnSync("npx", args, { cwd: ROOT, shell: true, encoding: "utf8", timeout: 600000 });
  if (!fs.existsSync(OUT_JSON)) {
    const sisa = `${r.stderr || ""}${r.stdout || ""}`.trim().split("\n").slice(-15).join("\n");
    return { gagal: [], kompilasi: [], tidakJalan: true, sisa };
  }
  const j = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  fs.rmSync(OUT_JSON, { force: true });
  const gagal = [];
  const kompilasi = [];
  for (const suite of j.testResults) {
    const rusak = suite.assertionResults.filter((a) => a.status === "failed");
    for (const a of rusak) gagal.push(a.fullName);
    if (suite.status === "failed" && rusak.length === 0) {
      if (/error TS\d+|TS\d{4}:/.test(suite.message)) kompilasi.push(path.basename(suite.name));
      else gagal.push(`(suite gagal berjalan) ${path.basename(suite.name)}`);
    }
  }
  return { gagal, kompilasi, tidakJalan: false };
}

fs.mkdirSync(BACKUP, { recursive: true });

console.log("Memeriksa test asli (harus hijau sebelum bug disuntikkan)...");
const dasar = jalankan();
if (dasar.tidakJalan || dasar.gagal.length || dasar.kompilasi.length) {
  console.log("Test asli TIDAK hijau. Perbaiki dulu, lalu ulangi.");
  if (dasar.tidakJalan) console.log("Jest tidak menghasilkan laporan. Keluaran terakhir:\n" + (dasar.sisa || "(kosong)"));
  if (dasar.gagal.length) console.log("Test gagal:", dasar.gagal.slice(0, 5));
  if (dasar.kompilasi.length) console.log("Error kompilasi pada:", dasar.kompilasi.slice(0, 5));
  pulihkanSemua();
  process.exit(1);
}

const baris = [];
for (const b of BUG) {
  const target = path.join(ROOT, b.file);
  process.stdout.write(`Bug ${b.no}: ${b.deskripsi} ... `);
  if (!fs.existsSync(target)) { console.log("FILE TIDAK ADA"); baris.push({ b, status: "tidak-diterapkan", info: `file ${b.file} tidak ditemukan` }); continue; }

  const asli = fs.readFileSync(target, "utf8");
  const baru = b.ubah(asli);
  if (baru === asli) { console.log("POLA TIDAK COCOK (lakukan manual)"); baris.push({ b, status: "tidak-diterapkan", info: "pola kode tidak ditemukan, suntik manual" }); continue; }

  fs.copyFileSync(target, path.join(BACKUP, sandi(b.file)));
  try {
    fs.writeFileSync(target, baru);
    let hasil = jalankan();
    if (!hasil.gagal.length && !hasil.kompilasi.length && pakaiInt) hasil = jalankan("jest.integration.config.ts");
    if (hasil.gagal.length) {
      console.log(`TERDETEKSI (${hasil.gagal.length} test gagal)`);
      baris.push({ b, status: "ya", info: hasil.gagal });
    } else if (hasil.kompilasi.length) {
      console.log("ERROR KOMPILASI (tidak sah, suntik manual)");
      baris.push({ b, status: "kompilasi", info: "perubahan menyebabkan error TypeScript, bukan kegagalan test" });
    } else {
      console.log("LOLOS (TIDAK terdeteksi)");
      baris.push({ b, status: "tidak", info: [] });
    }
  } finally {
    fs.copyFileSync(path.join(BACKUP, sandi(b.file)), target);
    fs.rmSync(path.join(BACKUP, sandi(b.file)), { force: true });
  }
}
pulihkanSemua();

const esc = (t) => String(t).replace(/\|/g, "\\|");
const label = { ya: "ya", tidak: "**tidak**", "tidak-diterapkan": "belum diuji", kompilasi: "belum diuji" };
let md = "# Hasil Suntik Bug\n\n";
md += `Dijalankan dengan \`node tools/suntik-bug.js --ya${pakaiInt ? " --int" : ""}\`. Setiap bug disuntikkan satu per satu, lalu file dikembalikan.\n\n`;
md += "| Bug | Perubahan | Terdeteksi? | Test yang gagal |\n|---|---|---|---|\n";
for (const r of baris) {
  const tes = Array.isArray(r.info)
    ? r.info.length ? r.info.slice(0, 3).map(esc).join("<br>") + (r.info.length > 3 ? `<br>dan ${r.info.length - 3} lainnya` : "") : "-"
    : esc(r.info);
  md += `| ${r.b.no} | ${esc(r.b.deskripsi)} | ${label[r.status]} | ${tes} |\n`;
}
const terdeteksi = baris.filter((r) => r.status === "ya").length;
md += `\nTerdeteksi: **${terdeteksi} dari ${BUG.length}**.\n`;
fs.mkdirSync(path.dirname(HASIL), { recursive: true });
fs.writeFileSync(HASIL, md);
console.log(`\nTerdeteksi ${terdeteksi} dari ${BUG.length}. Tabel: docs/suntik-bug-hasil.md`);