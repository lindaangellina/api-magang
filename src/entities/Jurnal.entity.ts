import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Peserta } from "./Peserta.entity";
import { Mentor } from "./Mentor.entity";

export type StatusReview = "belum" | "sudah";

// Bentuk satu lampiran yang disimpan di kolom jsonb (Minggu 14 Kamis)
export interface LampiranJurnal {
  url: string;
  keterangan?: string;
}

@Entity("jurnal_harian")
export class JurnalHarian {
  @PrimaryGeneratedColumn()
  id!: number;

  // relasi — banyak jurnal dimiliki satu peserta
  @ManyToOne(() => Peserta, (peserta) => peserta.jurnalList)
  @JoinColumn({ name: "peserta_id" })
  peserta!: Peserta;

  @Column({ name: "peserta_id" })
  pesertaId!: number; // tetap ada biar bisa akses id tanpa load relasi penuh

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

  // relasi baru — banyak jurnal direview oleh satu mentor (opsional, belum tentu ada reviewer-nya)
  @ManyToOne(() => Mentor, (mentor) => mentor.jurnalReview, { nullable: true })
  @JoinColumn({ name: "reviewer_id" })
  reviewer?: Mentor;

  @Column({ name: "reviewer_id", nullable: true })
  reviewerId?: number;

  // Minggu 14 Kamis (Soal 3): catatan dari mentor, hanya terisi saat jurnal ditandai "sudah"
  @Column({ type: "text", nullable: true })
  catatanMentor?: string | null;

  // Minggu 14 Kamis (Soal 4): daftar lampiran, disimpan sebagai array JSON
  @Column({ type: "jsonb", nullable: true })
  lampiran?: LampiranJurnal[] | null;
}