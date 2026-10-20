import {
  CreateJurnalDto,
  ListJurnalQueryDto,
  ReviewJurnalDto,
  UpdateJurnalDto,
} from "../../../src/dto/jurnal.dto";
import { validasiDto } from "../../../src/utils/validasi.util";
import { fieldYangGagal, KasusGagal, KasusValid, ulang } from "../../helpers/dto";

const lampiran = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ url: `https://contoh.com/f${i}.png` }));

describe("CreateJurnalDto: objek bersarang", () => {
  const dasar = { kegiatan: "Belajar unit testing dengan Jest" };

  it.each<KasusValid>([
    ["hanya kegiatan", dasar, { kegiatan: "Belajar unit testing dengan Jest" }],
    [
      "dengan hambatan dan linkCommit",
      { ...dasar, hambatan: "Sempat bingung", linkCommit: "https://github.com/lindaangellina/api-magang/commit/abc123" },
      { hambatan: "Sempat bingung" },
    ],
    ["kegiatan tepat 10 karakter", { kegiatan: "0123456789" }, { kegiatan: "0123456789" }],
    ["kegiatan tepat 2000 karakter", { kegiatan: ulang(2000) }, {}],
    [
      "dengan 2 lampiran",
      { ...dasar, lampiran: [{ url: "https://contoh.com/a.png", keterangan: "Screenshot" }, { url: "https://contoh.com/b.png" }] },
      {},
    ],
    ["tepat 5 lampiran", { ...dasar, lampiran: lampiran(5) }, {}],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(CreateJurnalDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it("menyimpan lampiran valid sebagai array", async () => {
    const hasil = await validasiDto(CreateJurnalDto, {
      ...dasar,
      lampiran: [{ url: "https://contoh.com/ss1.png", keterangan: "tangkapan layar" }],
    });
    expect(hasil.lampiran).toHaveLength(1);
  });

  it.each<KasusGagal>([
    ["kegiatan 9 karakter", { kegiatan: "123456789" }, "kegiatan"],
    ["kegiatan 2001 karakter", { kegiatan: ulang(2001) }, "kegiatan"],
    ["properti asing pesertaId (harus dari token)", { ...dasar, pesertaId: 99 }, "pesertaId"],
    ["hambatan bukan teks", { ...dasar, hambatan: 123 }, "hambatan"],
    ["linkCommit bukan URL", { ...dasar, linkCommit: "bukan-url" }, "linkCommit"],
    ["linkCommit lebih dari 2048 karakter", { ...dasar, linkCommit: `https://contoh.com/${ulang(2100)}` }, "linkCommit"],
    ["lampiran 6 item", { ...dasar, lampiran: lampiran(6) }, "lampiran"],
    ["lampiran bukan array", { ...dasar, lampiran: "bukan-array" }, "lampiran"],
    ["lampiran item ke-2 URL salah (notasi titik)", { ...dasar, lampiran: [{ url: "https://contoh.com/ok.png" }, { url: "bukan-url" }] }, "lampiran.1.url"],
    ["lampiran item berisi properti asing", { ...dasar, lampiran: [{ url: "https://contoh.com/a.png", sisipan: "x" }] }, "lampiran.0.sisipan"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(CreateJurnalDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });

  it("menolak body kosong", async () => {
    const gagal = await fieldYangGagal(validasiDto(CreateJurnalDto, {}));
    expect(gagal).toContain("kegiatan");
  });

  it("menolak pesertaId dan hanya melaporkan field itu", async () => {
    const gagal = await fieldYangGagal(validasiDto(CreateJurnalDto, { ...dasar, pesertaId: 99 }));
    expect(gagal).toEqual(["pesertaId"]);
  });
});

describe("UpdateJurnalDto", () => {
  it.each<KasusValid>([
    ["ubah kegiatan", { kegiatan: "Kegiatan diperbarui lewat PUT" }, { kegiatan: "Kegiatan diperbarui lewat PUT" }],
    ["ubah hambatan", { hambatan: "Hambatan diperbarui" }, { hambatan: "Hambatan diperbarui" }],
    ["ubah linkCommit", { linkCommit: "https://github.com/lindaangellina/api-magang/commit/def456" }, {}],
    ["ubah kegiatan dan hambatan", { kegiatan: "Kegiatan diperbarui lagi", hambatan: "Tidak ada" }, {}],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(UpdateJurnalDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["kegiatan 6 karakter (kurang dari 10)", { kegiatan: "pendek" }, "kegiatan"],
    ["kegiatan bukan teks", { kegiatan: 123 }, "kegiatan"],
    ["hambatan 2001 karakter", { hambatan: ulang(2001) }, "hambatan"],
    ["linkCommit bukan URL", { linkCommit: "bukan-url" }, "linkCommit"],
    ["properti asing statusReview", { statusReview: "sudah" }, "statusReview"],
    ["properti asing pesertaId", { pesertaId: 1 }, "pesertaId"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(UpdateJurnalDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });

  it("body kosong lolos DTO (aturan 'minimal satu field' ada di service, bukan DTO)", async () => {
    await expect(validasiDto(UpdateJurnalDto, {})).resolves.toBeDefined();
  });
});

describe("ReviewJurnalDto: validasi bersyarat", () => {
  it.each<KasusValid>([
    ["belum tanpa catatan", { statusReview: "belum" }, { statusReview: "belum" }],
    ["sudah dengan catatan", { statusReview: "sudah", catatan: "Kerja bagus, lanjutkan" }, { catatan: "Kerja bagus, lanjutkan" }],
    ["sudah, catatan tepat 5 karakter", { statusReview: "sudah", catatan: "Bagus" }, { catatan: "Bagus" }],
    ["sudah, catatan dengan spasi di tepi di-trim", { statusReview: "sudah", catatan: "   Catatan rapi   " }, { catatan: "Catatan rapi" }],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(ReviewJurnalDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["statusReview di luar daftar", { statusReview: "lulus" }, "statusReview"],
    ["sudah tanpa catatan", { statusReview: "sudah" }, "catatan"],
    ["sudah, catatan 4 karakter", { statusReview: "sudah", catatan: "Baik" }, "catatan"],
    ["sudah, catatan bukan teks", { statusReview: "sudah", catatan: 12345 }, "catatan"],
    ["sudah, catatan 2001 karakter", { statusReview: "sudah", catatan: ulang(2001) }, "catatan"],
    ["sudah, catatan hanya spasi", { statusReview: "sudah", catatan: "      " }, "catatan"],
    ["properti asing reviewerId", { statusReview: "sudah", catatan: "Catatan cukup panjang", reviewerId: 1 }, "reviewerId"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(ReviewJurnalDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });

  it("menolak body kosong", async () => {
    const gagal = await fieldYangGagal(validasiDto(ReviewJurnalDto, {}));
    expect(gagal).toContain("statusReview");
  });

  it("catatan wajib jika statusReview sudah", async () => {
    const gagal = await fieldYangGagal(validasiDto(ReviewJurnalDto, { statusReview: "sudah" }));
    expect(gagal).toContain("catatan");
  });

  it("catatan boleh kosong jika statusReview belum", async () => {
    await expect(validasiDto(ReviewJurnalDto, { statusReview: "belum" })).resolves.toBeDefined();
  });

  it("catatan yang aneh diabaikan saat statusReview belum (ValidateIf melewati semua validator)", async () => {
    await expect(
      validasiDto(ReviewJurnalDto, { statusReview: "belum", catatan: 123 })
    ).resolves.toBeDefined();
  });
});

describe("ListJurnalQueryDto", () => {
  it.each<KasusValid>([
    ["tanpa parameter memakai nilai bawaan", {}, { page: 1, limit: 10, order: "DESC", sortBy: "createdAt" }],
    ["belumDireview=true", { belumDireview: "true", limit: "5" }, { belumDireview: true, limit: 5 }],
    ["rentang tanggal dan sortBy", { from: "2026-01-01", to: "2026-12-31", sortBy: "statusReview", order: "asc" }, { sortBy: "statusReview", order: "ASC" }],
    ["filter pesertaId dan statusReview", { pesertaId: "3", statusReview: "belum" }, { pesertaId: 3, statusReview: "belum" }],
  ])("menerima: %s", async (_judul, query, diharapkan) => {
    const hasil = await validasiDto(ListJurnalQueryDto, query, "query");
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["belumDireview bukan boolean", { belumDireview: "abc" }, "belumDireview"],
    ["tanggal tidak ada (31 Februari)", { from: "2026-02-31" }, "from"],
    ["format tanggal salah", { from: "31-01-2026" }, "from"],
    ["to dengan format salah", { to: "2026/12/31" }, "to"],
    ["statusReview di luar daftar", { statusReview: "lulus" }, "statusReview"],
    ["pesertaId bukan angka", { pesertaId: "abc" }, "pesertaId"],
    ["pesertaId lebih dari batas integer", { pesertaId: "99999999999" }, "pesertaId"],
    ["sortBy di luar whitelist", { sortBy: "password" }, "sortBy"],
  ])("menolak: %s", async (_judul, query, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(ListJurnalQueryDto, query, "query"));
    expect(gagal).toContain(fieldDiharapkan);
  });

  // Regression test bug Minggu 14: Boolean("false") === true
  it("belumDireview=false benar-benar bernilai false (bukan true)", async () => {
    const q = await validasiDto(ListJurnalQueryDto, { belumDireview: "false" }, "query");
    expect(q.belumDireview).toBe(false);
  });

  it("belumDireview=true bernilai boolean true (bukan string)", async () => {
    const q = await validasiDto(ListJurnalQueryDto, { belumDireview: "true" }, "query");
    expect(q.belumDireview).toBe(true);
  });
});