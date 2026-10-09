import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./env.config";
import { Peserta } from "../entities/Peserta.entity";
import { JurnalHarian } from "../entities/Jurnal.entity";
import { Mentor } from "../entities/Mentor.entity";
import { Skill } from "../entities/Skill.entity";
import { RefreshToken } from "../entities/RefreshToken.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false,
  logging: ["error", "warn"],
  entities: [Peserta, JurnalHarian, Mentor, Skill, RefreshToken],
  migrations: ["src/migrations/**/*.ts"],
});