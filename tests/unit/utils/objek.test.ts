import { hanyaYangDiisi } from "../../../src/utils/objek";

describe("hanyaYangDiisi", () => {
  it("membuang properti yang bernilai undefined", () => {
    const hasil = hanyaYangDiisi({ nama: "Budi", sekolah: undefined });
    expect(hasil).toStrictEqual({ nama: "Budi" });
    expect(Object.keys(hasil)).toEqual(["nama"]);
  });

  it("mempertahankan null (artinya: kosongkan field ini)", () => {
    expect(hanyaYangDiisi({ telepon: null })).toStrictEqual({ telepon: null });
  });

  it("mempertahankan string kosong", () => {
    expect(hanyaYangDiisi({ nama: "" })).toStrictEqual({ nama: "" });
  });

  it("mempertahankan angka 0", () => {
    expect(hanyaYangDiisi({ fase: 0 })).toStrictEqual({ fase: 0 });
  });

  it("mempertahankan false", () => {
    expect(hanyaYangDiisi({ aktif: false })).toStrictEqual({ aktif: false });
  });

  it("objek kosong menghasilkan objek kosong", () => {
    expect(hanyaYangDiisi({})).toStrictEqual({});
  });

  it("semua undefined menghasilkan objek kosong", () => {
    expect(hanyaYangDiisi({ a: undefined, b: undefined })).toStrictEqual({});
  });

  it("tidak mengubah objek asli", () => {
    const asli = { nama: "Budi", sekolah: undefined };
    hanyaYangDiisi(asli);
    expect(Object.keys(asli)).toEqual(["nama", "sekolah"]);
  });

  it("bekerja pada instance class dengan properti yang belum diisi (target ES2022)", () => {
    class ContohDto {
      nama?: string;
      sekolah?: string;
      telepon?: string;
    }
    const dto = new ContohDto();
    dto.nama = "Budi";

    expect(Object.keys(hanyaYangDiisi(dto))).toEqual(["nama"]);
  });
});