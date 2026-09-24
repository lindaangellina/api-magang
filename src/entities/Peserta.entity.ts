import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { JurnalHarian } from "./Jurnal.entity";
import { Skill } from "./Skill.entity";

export type StatusPeserta = "aktif" | "lulus" | "berhenti";

@Entity("peserta")
export class Peserta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  nama!: string;

  @Column({ type: "varchar", length: 100 })
  sekolah!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  email!: string;

  @Column({ type: "varchar", nullable: true })
  telepon?: string;

  @Column({ type: "int", default: 1 })
  fase!: number;

  @Column({ type: "enum", enum: ["aktif", "lulus", "berhenti"], default: "aktif" })
  status!: StatusPeserta;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // relasi — satu peserta punya banyak jurnal
  @OneToMany(() => JurnalHarian, (jurnal) => jurnal.peserta)
  jurnalList!: JurnalHarian[];

  // relasi baru — banyak peserta bisa punya banyak skill, dan sebaliknya
  @ManyToMany(() => Skill, (skill) => skill.peserta)
  @JoinTable({ name: "peserta_skill" })
  skills!: Skill[];
}