import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Peserta } from "./Peserta.entity";

@Entity("skill")
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  nama!: string;

  @ManyToMany(() => Peserta, (peserta) => peserta.skills)
  peserta!: Peserta[];
}