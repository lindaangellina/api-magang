// SOAL 5: test khusus decorator @Sama
import { IsString } from "class-validator";
import { Sama } from "../../../src/dto/decorators/sama";
import { RegisterDto } from "../../../src/dto/auth.dto";
import { FieldError, ValidationError } from "../../../src/utils/AppError";
import { validasiDto } from "../../../src/utils/validasi.util";
import { fieldYangGagal, tangkapError } from "../../helpers/dto";

// DTO kecil khusus untuk menguji decorator. Kedua properti butuh decorator,
// karena whitelist membuang properti yang tidak punya decorator sama sekali.
class ContohTanpaPesan {
  @IsString()
  password!: string;

  @Sama("password")
  konfirmasi!: string;
}

class ContohDenganPesan {
  @IsString()
  password!: string;

  @Sama("password", { message: "Konfirmasi tidak cocok" })
  konfirmasi!: string;
}

describe("decorator @Sama", () => {
  it("lolos jika kedua nilai sama", async () => {
    const hasil = await validasiDto(ContohTanpaPesan, { password: "rahasia123", konfirmasi: "rahasia123" });
    expect(hasil.konfirmasi).toBe("rahasia123");
  });

  it("gagal jika nilai berbeda, dan field yang gagal adalah field yang dihias", async () => {
    const gagal = await fieldYangGagal(
      validasiDto(ContohTanpaPesan, { password: "rahasia123", konfirmasi: "lain12345" })
    );
    expect(gagal).toEqual(["konfirmasi"]);
  });

  it("pesan bawaan berisi nama field yang dibandingkan", async () => {
    const err = await tangkapError(
      validasiDto(ContohTanpaPesan, { password: "rahasia123", konfirmasi: "lain12345" })
    );
    expect(err).toBeInstanceOf(ValidationError);
    const pesan = ((err as ValidationError).detail as FieldError[]).map((d) => d.pesan).join(" ");
    expect(pesan).toContain("konfirmasi");
    expect(pesan).toContain("password");
  });

  it("memakai pesan buatan sendiri jika diberikan", async () => {
    const err = await tangkapError(
      validasiDto(ContohDenganPesan, { password: "rahasia123", konfirmasi: "lain" })
    );
    const detail = (err as ValidationError).detail as FieldError[];
    expect(detail).toContainEqual({ field: "konfirmasi", pesan: "Konfirmasi tidak cocok" });
  });

  it("membedakan huruf besar dan kecil", async () => {
    const gagal = await fieldYangGagal(
      validasiDto(ContohTanpaPesan, { password: "Rahasia123", konfirmasi: "rahasia123" })
    );
    expect(gagal).toEqual(["konfirmasi"]);
  });

  it("membedakan tipe (=== ketat): angka 123 tidak sama dengan teks '123'", async () => {
    // password teks, konfirmasi angka: konfirmasi gagal @Sama (dan ContohTanpaPesan tidak punya IsString di konfirmasi)
    const gagal = await fieldYangGagal(
      validasiDto(ContohTanpaPesan, { password: "123", konfirmasi: 123 })
    );
    expect(gagal).toEqual(["konfirmasi"]);
  });

  it("kedua field tidak ada dianggap sama (undefined === undefined), makanya perlu dipasangkan dengan @IsString", async () => {
    const gagal = await fieldYangGagal(validasiDto(ContohTanpaPesan, {}));
    expect(gagal).toEqual(["password"]); // yang menolak adalah @IsString di password, bukan @Sama
  });

  it("pada RegisterDto: pesan 'Konfirmasi password tidak cocok' muncul di field konfirmasiPassword", async () => {
    const err = await tangkapError(
      validasiDto(RegisterDto, {
        nama: "Budi Santoso", sekolah: "SMK 5 Malang", email: "budi@mail.com",
        password: "rahasia123", konfirmasiPassword: "beda12345",
      })
    );
    const detail = (err as ValidationError).detail as FieldError[];
    expect(detail).toContainEqual({ field: "konfirmasiPassword", pesan: "Konfirmasi password tidak cocok" });
  });
});