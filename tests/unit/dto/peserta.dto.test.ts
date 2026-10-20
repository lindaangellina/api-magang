import { CreatePesertaDto, ListPesertaQueryDto, UpdateProfilDto } from "../../../src/dto/peserta.dto";
import { validasiDto } from "../../../src/utils/validasi.util";
import { fieldYangGagal, KasusGagal, KasusValid, ulang } from "../../helpers/dto";

describe("CreatePesertaDto", () => {
  const dasar = { nama: "Peserta Uji", sekolah: "SMK Uji", email: "uji@mail.com" };

  it.each<KasusValid>([
    ["valid penuh dengan telepon", { ...dasar, telepon: "081234567890" }, { telepon: "081234567890" }],
    ["tanpa telepon", dasar, { nama: "Peserta Uji" }],
    ["telepon format +62", { ...dasar, telepon: "+6281234567890" }, { telepon: "+6281234567890" }],
    ["email huruf besar dan spasi dinormalkan", { ...dasar, email: "  UJI@Mail.COM " }, { email: "uji@mail.com" }],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(CreatePesertaDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["nama 2 karakter", { ...dasar, nama: "Bu" }, "nama"],
    ["nama 101 karakter", { ...dasar, nama: ulang(101) }, "nama"],
    ["email tidak valid", { ...dasar, email: "bukan-email" }, "email"],
    ["telepon bukan nomor", { ...dasar, telepon: "abc" }, "telepon"],
    ["properti asing role", { ...dasar, role: "mentor" }, "role"],
    ["properti asing password", { ...dasar, password: "x" }, "password"],
    ["properti asing id", { ...dasar, id: 1 }, "id"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(CreatePesertaDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });

  it("menolak body kosong", async () => {
    const gagal = await fieldYangGagal(validasiDto(CreatePesertaDto, {}));
    expect(gagal).toEqual(expect.arrayContaining(["nama", "sekolah", "email"]));
  });
});

describe("UpdateProfilDto", () => {
  it.each<KasusValid>([
    ["ubah nama", { nama: "Nama Uji Satu" }, { nama: "Nama Uji Satu" }],
    ["ubah telepon", { telepon: "081234567890" }, { telepon: "081234567890" }],
    ["sekolah dan telepon +62", { sekolah: "SMK Uji Baru", telepon: "+6281234567890" }, { sekolah: "SMK Uji Baru" }],
    ["nama dengan spasi di tepi di-trim", { nama: "   Nama Spasi   " }, { nama: "Nama Spasi" }],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(UpdateProfilDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["nama 2 karakter", { nama: "ab" }, "nama"],
    ["nama 101 karakter", { nama: ulang(101) }, "nama"],
    ["sekolah hanya spasi", { sekolah: "   " }, "sekolah"],
    ["telepon bukan nomor", { telepon: "abc" }, "telepon"],
    ["properti asing role", { role: "mentor" }, "role"],
    ["properti asing email", { email: "baru@mail.com" }, "email"],
    ["properti asing password", { password: "x" }, "password"],
    ["properti asing id", { id: 5 }, "id"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(UpdateProfilDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });

  it("body kosong lolos DTO (aturan 'minimal satu field' ada di service, bukan DTO)", async () => {
    await expect(validasiDto(UpdateProfilDto, {})).resolves.toBeDefined();
  });
});

describe("ListPesertaQueryDto", () => {
  it.each<KasusValid>([
    ["query kosong memakai nilai bawaan", {}, { page: 1, limit: 10, order: "DESC", sortBy: "createdAt" }],
    ["string dari query diubah menjadi angka", { page: "2", limit: "20" }, { page: 2, limit: 20 }],
    ["order huruf kecil diubah ke huruf besar", { sortBy: "nama", order: "asc" }, { sortBy: "nama", order: "ASC" }],
    ["filter q, fase, sekolah", { q: "budi", fase: "1", sekolah: "SMK" }, { q: "budi", fase: 1, sekolah: "SMK" }],
    ["kunci aneh page[x] dan limit[] diabaikan", { "page[x]": "1", "limit[]": "5" }, { page: 1, limit: 10 }],
  ])("menerima: %s", async (_judul, query, diharapkan) => {
    const hasil = await validasiDto(ListPesertaQueryDto, query, "query");
    expect(hasil).toMatchObject(diharapkan);
  });

  it("mengabaikan parameter asing di query (tidak menolak)", async () => {
    const q = await validasiDto(ListPesertaQueryDto, { foo: "bar" }, "query");
    expect(q).not.toHaveProperty("foo");
  });

  it("mengubah string menjadi tipe angka sungguhan, bukan string", async () => {
    const q = await validasiDto(ListPesertaQueryDto, { page: "2", limit: "20" }, "query");
    expect(typeof q.page).toBe("number");
    expect(typeof q.limit).toBe("number");
  });

  it.each<KasusGagal>([
    ["page nol", { page: "0" }, "page"],
    ["page bukan angka", { page: "abc" }, "page"],
    ["page lebih dari batas", { page: "99999999999" }, "page"],
    ["limit 1000", { limit: "1000" }, "limit"],
    ["limit nol", { limit: "0" }, "limit"],
    ["sortBy di luar whitelist", { sortBy: "password" }, "sortBy"],
    ["order sembarang", { order: "sembarang" }, "order"],
    ["sekolah ganda (array)", { sekolah: ["a", "b"] }, "sekolah"],
    ["fase di luar rentang", { fase: "9" }, "fase"],
    ["q 101 karakter", { q: ulang(101) }, "q"],
  ])("menolak: %s", async (_judul, query, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(ListPesertaQueryDto, query, "query"));
    expect(gagal).toContain(fieldDiharapkan);
  });
});