import { getMetadataStorage } from "class-validator";
import { components } from "../../../src/docs/components";
import { ErrorCode } from "../../../src/utils/errorCodes";
import { RegisterDto, LoginDto, RefreshTokenDto } from "../../../src/dto/auth.dto";
import { UpdateProfilDto } from "../../../src/dto/peserta.dto";
import { CreateJurnalDto, UpdateJurnalDto, LampiranDto } from "../../../src/dto/jurnal.dto";

type Skema = Record<string, Record<string, unknown>>;
const schemas = components.schemas as unknown as Record<string, { properties?: Skema }>;

// Ambil batas (minLength, maxLength, ...) langsung dari decorator class-validator
function batasDto(dto: new () => object, properti: string): Record<string, number> {
  const meta = getMetadataStorage().getTargetValidationMetadatas(dto, "", true, false);
  const hasil: Record<string, number> = {};
  for (const m of meta) {
    if (m.propertyName !== properti) continue;
    const nama = m.name ?? "";
    if (["minLength", "maxLength", "min", "max", "arrayMaxSize"].includes(nama)) {
      hasil[nama] = m.constraints?.[0] as number;
    }
  }
  return hasil;
}

const PETA = { minLength: "minLength", maxLength: "maxLength", min: "minimum", max: "maximum", arrayMaxSize: "maxItems" } as const;

// [kelas DTO, nama schema OpenAPI]
const PASANGAN: [new () => object, string][] = [
  [RegisterDto, "RegisterRequest"],
  [LoginDto, "LoginRequest"],
  [RefreshTokenDto, "RefreshRequest"],
  [UpdateProfilDto, "UpdateProfilRequest"],
  [CreateJurnalDto, "CreateJurnalRequest"],
  [UpdateJurnalDto, "UpdateJurnalRequest"],
  [LampiranDto, "Lampiran"],
];

describe("Komponen OpenAPI: sinkron dengan DTO", () => {
  it.each(PASANGAN)("batas %p sama persis dengan schema %s", (dto, namaSchema) => {
    const props = schemas[namaSchema].properties as Skema;
    let diperiksa = 0;
    for (const [properti, skema] of Object.entries(props)) {
      const batas = batasDto(dto, properti);
      for (const [kunciDto, nilai] of Object.entries(batas)) {
        expect({ properti, kata: PETA[kunciDto as keyof typeof PETA], nilai: skema[PETA[kunciDto as keyof typeof PETA]] })
          .toEqual({ properti, kata: PETA[kunciDto as keyof typeof PETA], nilai });
        diperiksa++;
      }
    }
    // Pastikan pemeriksaan benar-benar berjalan (bukan lolos karena metadata kosong)
    expect(diperiksa).toBeGreaterThan(0);
  });

  it("ErrorResponse.kode.enum sama dengan Object.values(ErrorCode)", () => {
    const kode = (schemas.ErrorResponse.properties as Skema).error as unknown as { properties: Skema };
    expect(kode.properties.kode.enum).toEqual(Object.values(ErrorCode));
  });

  it("setiap $ref di components menunjuk ke komponen yang ada", () => {
    const teks = JSON.stringify(components);
    const rujukan = [...teks.matchAll(/#\/components\/(\w+)\/(\w+)/g)];
    expect(rujukan.length).toBeGreaterThan(0);
    for (const [, jenis, nama] of rujukan) {
      expect(components).toHaveProperty([jenis, nama]);
    }
  });

  it("response error yang diwajibkan ada", () => {
    expect(Object.keys(components.responses)).toEqual(
      expect.arrayContaining(["Unauthorized", "Forbidden", "NotFound", "Conflict", "ValidationError", "PayloadTooLarge", "TooManyRequests"])
    );
  });
});