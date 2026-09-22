import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type StatusReview = "belum" | "sudah";

@Entity("jurnal_harian")
export class JurnalHarian {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  pesertaId!: number; // sementara belum pakai relasi — itu materi Kamis

  @Column({ type: "text" })
  kegiatan!: string;

  @Column({ type: "text", nullable: true })
  hambatan?: string;

  @Column({ type: "varchar", nullable: true })
  linkCommit?: string;

  @Column({ type: "enum", enum: ["belum", "sudah"], default: "belum" })
  statusReview!: StatusReview;

  @CreateDateColumn()
  createdAt!: Date;
}