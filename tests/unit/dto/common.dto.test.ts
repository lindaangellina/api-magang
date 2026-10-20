import { IdParamDto } from "../../../src/dto/common.dto";
import { validasiDto } from "../../../src/utils/validasi.util";
import { fieldYangGagal } from "../../helpers/dto";

describe("IdParamDto", () => {
  it.each<[string, unknown, number]>([
    ["id string biasa", "42", 42],
    ["id terkecil", "1", 1],
    ["id terbesar integer PostgreSQL", "2147483647", 2147483647],
    ["id yang sudah berupa angka", 5, 5],
  ])("menerima dan mengubah ke angka: %s", async (_judul, id, diharapkan) => {
    const hasil = await validasiDto(IdParamDto, { id }, "params");
    expect(hasil.id).toBe(diharapkan);
    expect(typeof hasil.id).toBe("number");
  });

  it.each<[string, unknown]>([
    ["id bukan angka", "abc"],
    ["id nol", "0"],
    ["id negatif", "-1"],
    ["id desimal", "1.5"],
    ["id lebih dari batas integer", "99999999999"],
    ["id kosong", ""],
  ])("menolak: %s", async (_judul, id) => {
    const gagal = await fieldYangGagal(validasiDto(IdParamDto, { id }, "params"));
    expect(gagal).toContain("id");
  });

  it("menolak jika id tidak ada sama sekali", async () => {
    const gagal = await fieldYangGagal(validasiDto(IdParamDto, {}, "params"));
    expect(gagal).toContain("id");
  });
});