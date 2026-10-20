import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { KeHurufBesar, Trim } from "./decorators/transform";

// Untuk semua route /:id
export class IdParamDto {
  @Type(() => Number) // "5" menjadi 5, "abc" menjadi NaN lalu ditolak @IsInt
  @IsInt({ message: "id harus berupa bilangan bulat" })
  @Min(1, { message: "id minimal 1" })
  @Max(2147483647, { message: "id terlalu besar" }) // batas integer PostgreSQL; tanpa ini id raksasa memicu error database (500)
  id!: number;
}

// Dasar untuk semua endpoint daftar (pengganti parseListQuery Minggu 13)
export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "page harus berupa bilangan bulat" })
  @Min(1, { message: "page minimal 1" })
  @Max(1000000, { message: "page maksimal 1000000" })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "limit harus berupa bilangan bulat" })
  @Min(1, { message: "limit minimal 1" })
  @Max(100, { message: "limit maksimal 100" })
  limit: number = 10;

  @IsOptional()
  @KeHurufBesar()
  @IsIn(["ASC", "DESC"], { message: "order harus ASC atau DESC" })
  order: "ASC" | "DESC" = "DESC";

  @IsOptional()
  @Trim()
  @IsString({ message: "q harus berupa teks" })
  @MaxLength(100, { message: "q maksimal 100 karakter" })
  q?: string;
}