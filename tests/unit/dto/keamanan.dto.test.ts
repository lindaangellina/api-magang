// SOAL 4: test khusus keamanan pada lapisan DTO.
import { LoginDto, RegisterDto } from "../../../src/dto/auth.dto";
import { CreatePesertaDto, ListPesertaQueryDto, UpdateProfilDto } from "../../../src/dto/peserta.dto";
import { ListJurnalQueryDto } from "../../../src/dto/jurnal.dto";
import { ValidationError } from "../../../src/utils/AppError";
import { validasiDto } from "../../../src/utils/validasi.util";
import { fieldYangGagal, tangkapError, ulang } from "../../helpers/dto";

describe("a. mass assignment lewat UpdateProfilDto", () => {
  it.each<[string, unknown]>([
    ["role", "mentor"],
    ["id", 1],
    ["password", "baru12345"],
  ])("menolak %s walau dikirim sendirian", async (field, nilai) => {
    const gagal = await fieldYangGagal(validasiDto(UpdateProfilDto, { [field]: nilai }));
    expect(gagal).toEqual([field]);
  });

  it("menolak role walau dikirim bersama field yang sah", async () => {
    const gagal = await fieldYangGagal(
      validasiDto(UpdateProfilDto, { nama: "Budi Santoso", role: "mentor" })
    );
    expect(gagal).toEqual(["role"]);
  });

  it("menolak role, id, dan password sekaligus", async () => {
    const gagal = await fieldYangGagal(
      validasiDto(UpdateProfilDto, { role: "mentor", id: 1, password: "baru12345" })
    );
    expect(gagal).toEqual(expect.arrayContaining(["role", "id", "password"]));
  });

  it("menolak email (tidak boleh diubah lewat endpoint ini)", async () => {
    const gagal = await fieldYangGagal(validasiDto(UpdateProfilDto, { email: "x@mail.com" }));
    expect(gagal).toEqual(["email"]);
  });
});

describe("b. nilai password tidak muncul di detail error", () => {
  it("RegisterDto: password terlalu pendek", async () => {
    const err = await tangkapError(
      validasiDto(RegisterDto, {
        nama: "Budi Santoso", sekolah: "SMK 5 Malang", email: "budi@mail.com",
        password: "rhs1", konfirmasiPassword: "rhs1",
      })
    );
    expect(err).toBeInstanceOf(ValidationError);
    expect(JSON.stringify((err as ValidationError).detail)).not.toContain("rhs1");
    expect(JSON.stringify(err)).not.toContain("rhs1");
  });

  it("RegisterDto: konfirmasi berbeda tidak membocorkan kedua password", async () => {
    const err = await tangkapError(
      validasiDto(RegisterDto, {
        nama: "Budi Santoso", sekolah: "SMK 5 Malang", email: "budi@mail.com",
        password: "Rahasia-Satu-1", konfirmasiPassword: "Rahasia-Dua-2",
      })
    );
    const teks = JSON.stringify(err);
    expect(teks).not.toContain("Rahasia-Satu-1");
    expect(teks).not.toContain("Rahasia-Dua-2");
  });

  it("LoginDto: password terlalu panjang", async () => {
    const panjang = `Rhs9${ulang(80, "z")}`;
    const err = await tangkapError(validasiDto(LoginDto, { email: "budi@mail.com", password: panjang }));
    expect(err).toBeInstanceOf(ValidationError);
    expect(JSON.stringify(err)).not.toContain(panjang);
  });
});

describe("c. sortBy=password ditolak pada kedua query DTO", () => {
  it("ListPesertaQueryDto", async () => {
    const gagal = await fieldYangGagal(validasiDto(ListPesertaQueryDto, { sortBy: "password" }, "query"));
    expect(gagal).toContain("sortBy");
  });

  it("ListJurnalQueryDto", async () => {
    const gagal = await fieldYangGagal(validasiDto(ListJurnalQueryDto, { sortBy: "password" }, "query"));
    expect(gagal).toContain("sortBy");
  });

  it.each(["nama", "fase", "createdAt"])("ListPesertaQueryDto menerima sortBy=%s", async (kolom) => {
    const q = await validasiDto(ListPesertaQueryDto, { sortBy: kolom }, "query");
    expect(q.sortBy).toBe(kolom);
  });
});

describe("d. email dinormalkan (spasi dan huruf besar)", () => {
  const mentah = "  Budi.Santoso@Mail.COM  ";
  const diharapkan = "budi.santoso@mail.com";

  it("RegisterDto", async () => {
    const hasil = await validasiDto(RegisterDto, {
      nama: "Budi Santoso", sekolah: "SMK 5 Malang", email: mentah,
      password: "rahasia123", konfirmasiPassword: "rahasia123",
    });
    expect(hasil.email).toBe(diharapkan);
  });

  it("LoginDto (harus sama dengan register, kalau tidak login tidak cocok)", async () => {
    const hasil = await validasiDto(LoginDto, { email: mentah, password: "apa-saja" });
    expect(hasil.email).toBe(diharapkan);
  });

  it("CreatePesertaDto", async () => {
    const hasil = await validasiDto(CreatePesertaDto, { nama: "Budi", sekolah: "SMK 5", email: mentah });
    expect(hasil.email).toBe(diharapkan);
  });
});