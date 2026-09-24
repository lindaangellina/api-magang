import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { JurnalHarian } from "./Jurnal.entity";

@Entity("mentor")
export class Mentor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  nama!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  email!: string;

  @Column({ type: "jsonb" })
  keahlian!: string[]; // array string, misal ["Node.js", "React", "PostgreSQL"]

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // relasi baru — satu mentor mereview banyak jurnal
  @OneToMany(() => JurnalHarian, (jurnal) => jurnal.reviewer)
  jurnalReview!: JurnalHarian[];
}