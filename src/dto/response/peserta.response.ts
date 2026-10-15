import { Expose } from "class-transformer";

// Pendekatan whitelist: hanya properti ber-@Expose yang boleh keluar.
// password (dan kolom sensitif baru di masa depan) tidak pernah ikut keluar
// sampai seseorang sengaja menambahkan @Expose.
export class PesertaResponseDto {
  @Expose() id!: number;
  @Expose() nama!: string;
  @Expose() sekolah!: string;
  @Expose() email!: string;
  @Expose() telepon?: string | null;
  @Expose() fase!: number;
  @Expose() status!: string;
  @Expose() role!: string;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}