import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from "class-validator";
import { KeBoolean } from "./decorators/transform";
import { ListQueryDto } from "./common.dto";

// Kolom yang boleh dipakai untuk pengurutan daftar jurnal
export const SORT_JURNAL = ["createdAt", "statusReview"] as const;

export class ListJurnalQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(SORT_JURNAL, {
    message: `sortBy harus salah satu dari: ${SORT_JURNAL.join(", ")}`,
  })
  sortBy: (typeof SORT_JURNAL)[number] = "createdAt";

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "pesertaId harus berupa bilangan bulat" })
  @Min(1, { message: "pesertaId minimal 1" })
  pesertaId?: number;

  @IsOptional()
  @IsIn(["belum", "sudah"], { message: "statusReview harus belum atau sudah" })
  statusReview?: "belum" | "sudah";

  // from dan to: service memakai `${from}T00:00:00`, jadi hanya tanggal murni
  // YYYY-MM-DD yang boleh. IsDateString saja menerima juga "2026-09-01T10:00:00Z"
  // yang akan merusak query. strict: true menolak tanggal yang tidak ada (2026-02-31).
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "from harus berformat YYYY-MM-DD, contoh 2026-09-01",
  })
  @IsDateString({ strict: true }, { message: "from bukan tanggal yang valid" })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "to harus berformat YYYY-MM-DD, contoh 2026-09-30",
  })
  @IsDateString({ strict: true }, { message: "to bukan tanggal yang valid" })
  to?: string;

  @IsOptional()
  @KeBoolean()
  @IsBoolean({ message: "belumDireview harus true atau false" })
  belumDireview?: boolean;
}