import { ClassConstructor, plainToInstance } from "class-transformer";

// Mengubah entity/objek mentah menjadi Response DTO.
// excludeExtraneousValues: hanya properti ber-@Expose yang dibawa keluar.
export function serialisasi<T>(dto: ClassConstructor<T>, data: unknown[]): T[];
export function serialisasi<T>(dto: ClassConstructor<T>, data: unknown): T;
export function serialisasi<T>(dto: ClassConstructor<T>, data: unknown): T | T[] {
  return plainToInstance(dto, data, { excludeExtraneousValues: true }) as T | T[];
}