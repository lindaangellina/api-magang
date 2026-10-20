import { LoginDto, RefreshTokenDto, RegisterDto } from "../../../src/dto/auth.dto";
import { validasiDto } from "../../../src/utils/validasi.util";
import { fieldYangGagal, KasusGagal, KasusValid, ulang } from "../../helpers/dto";

describe("RegisterDto", () => {
  const valid = {
    nama: "Budi Santoso",
    sekolah: "SMK 5 Malang",
    email: "budi@mail.com",
    password: "rahasia123",
    konfirmasiPassword: "rahasia123",
  };
  const pw72 = `a1${ulang(70, "b")}`;

  it("menerima payload yang valid", async () => {
    const hasil = await validasiDto(RegisterDto, valid);
    expect(hasil.nama).toBe("Budi Santoso");
  });

  it.each<KasusValid>([
    ["email huruf besar dan spasi dinormalkan", { ...valid, email: "  Budi@Mail.COM  " }, { email: "budi@mail.com" }],
    ["password tepat 72 karakter", { ...valid, password: pw72, konfirmasiPassword: pw72 }, { password: pw72 }],
    ["nama tepat 3 karakter", { ...valid, nama: "Ali" }, { nama: "Ali" }],
    ["nama dengan spasi di tepi di-trim", { ...valid, nama: "   Budi   " }, { nama: "Budi" }],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(RegisterDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["nama hanya 2 karakter", { ...valid, nama: "Bu" }, "nama"],
    ["nama hanya spasi", { ...valid, nama: "      " }, "nama"],
    ["sekolah hanya spasi", { ...valid, sekolah: "      " }, "sekolah"],
    ["email salah format", { ...valid, email: "bukan-email" }, "email"],
    ["password tanpa angka", { ...valid, password: "hanyahuruf", konfirmasiPassword: "hanyahuruf" }, "password"],
    ["password tanpa huruf", { ...valid, password: "12345678", konfirmasiPassword: "12345678" }, "password"],
    ["password 73 karakter", { ...valid, password: `a1${ulang(71, "b")}`, konfirmasiPassword: `a1${ulang(71, "b")}` }, "password"],
    ["password lebih dari 72 karakter", { ...valid, password: "a1".repeat(40), konfirmasiPassword: "a1".repeat(40) }, "password"],
    ["konfirmasi password berbeda", { ...valid, konfirmasiPassword: "lain12345" }, "konfirmasiPassword"],
    ["properti asing role", { ...valid, role: "mentor" }, "role"],
    ["tipe salah (nama angka)", { ...valid, nama: 123 }, "nama"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(RegisterDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });

  it("menolak body kosong dan melaporkan semua field wajib", async () => {
    const gagal = await fieldYangGagal(validasiDto(RegisterDto, {}));
    expect(gagal).toEqual(expect.arrayContaining(["nama", "sekolah", "email", "password"]));
  });

  it("menolak body yang bukan objek (array)", async () => {
    const gagal = await fieldYangGagal(validasiDto(RegisterDto, []));
    expect(gagal).toEqual(["body"]);
  });
});

describe("LoginDto", () => {
  const valid = { email: "budi@mail.com", password: "apa-saja" };

  it.each<KasusValid>([
    ["login normal", valid, { email: "budi@mail.com", password: "apa-saja" }],
    ["email huruf besar dan spasi dinormalkan", { ...valid, email: "  BUDI@Mail.COM  " }, { email: "budi@mail.com" }],
    ["email dengan spasi di kiri saja", { ...valid, email: "   budi@mail.com" }, { email: "budi@mail.com" }],
    ["password lemah tetap diterima (aturan kekuatan hanya saat register)", { ...valid, password: "a" }, { password: "a" }],
    ["password tepat 72 karakter", { ...valid, password: ulang(72) }, {}],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(LoginDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["email tidak valid", { ...valid, email: "bukan-email" }, "email"],
    ["password kosong", { ...valid, password: "" }, "password"],
    ["password bukan teks", { ...valid, password: 12345678 }, "password"],
    ["password null", { ...valid, password: null }, "password"],
    ["password 73 karakter", { ...valid, password: ulang(73) }, "password"],
    ["email lebih dari 254 karakter", { ...valid, email: `${ulang(250)}@mail.com` }, "email"],
    ["properti asing role", { ...valid, role: "mentor" }, "role"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(LoginDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });

  it("menolak body kosong", async () => {
    const gagal = await fieldYangGagal(validasiDto(LoginDto, {}));
    expect(gagal).toEqual(expect.arrayContaining(["email", "password"]));
  });
});

describe("RefreshTokenDto", () => {
  it.each<KasusValid>([
    ["token berbentuk JWT", { refreshToken: "aaa.bbb.ccc" }, { refreshToken: "aaa.bbb.ccc" }],
    ["token tepat 2048 karakter", { refreshToken: ulang(2048) }, {}],
    ["token satu karakter", { refreshToken: "x" }, { refreshToken: "x" }],
  ])("menerima: %s", async (_judul, payload, diharapkan) => {
    const hasil = await validasiDto(RefreshTokenDto, payload);
    expect(hasil).toMatchObject(diharapkan);
  });

  it.each<KasusGagal>([
    ["body kosong", {}, "refreshToken"],
    ["refreshToken berupa angka", { refreshToken: 123 }, "refreshToken"],
    ["refreshToken kosong", { refreshToken: "" }, "refreshToken"],
    ["refreshToken berupa array", { refreshToken: ["a"] }, "refreshToken"],
    ["refreshToken null", { refreshToken: null }, "refreshToken"],
    ["refreshToken 2049 karakter", { refreshToken: ulang(2049) }, "refreshToken"],
    ["properti asing role", { refreshToken: "aaa.bbb.ccc", role: "mentor" }, "role"],
  ])("menolak: %s", async (_judul, payload, fieldDiharapkan) => {
    const gagal = await fieldYangGagal(validasiDto(RefreshTokenDto, payload));
    expect(gagal).toContain(fieldDiharapkan);
  });
});