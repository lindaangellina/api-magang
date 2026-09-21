import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./env.config";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false, // JANGAN true — pakai migration (Rabu)
  logging: config.app.env === "development",
  entities: ["src/entities/**/*.ts"],
  migrations: ["src/migrations/**/*.ts"],
});