import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./env.config";
import { Peserta } from "../entities/Peserta.entity";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { Mentor } from "../entities/Mentor.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false, // SEMENTARA true buat Soal 4 — nanti diubah balik ke false
  logging: config.app.env === "development",
  entities: [Peserta, JurnalHarian, Mentor],
  migrations: ["src/migrations/**/*.ts"],
});