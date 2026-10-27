import swaggerJSDoc from "swagger-jsdoc";
import { isProd } from "../config/env.config";
import { components } from "./components";

export const spec = swaggerJSDoc({
  failOnErrors: true, // anotasi YAML yang rusak = error saat start, bukan peringatan yang terabaikan
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API Magang Batch 4",
      version: "1.0.0",
      description:
        "REST API untuk program magang PT Nawasena Insan Permata.\n\n" +
        "Semua endpoint berada di bawah `/api/v1`. Format response sukses dan error " +
        "seragam; setiap response membawa header `X-Request-Id` untuk pelacakan log.",
    },
    servers: [{ url: "/api/v1", description: "API v1" }],
    // Komponen reusable (schemas, responses, parameters, securitySchemes)
    components: components as never,
    // Terkunci secara default: endpoint publik harus sengaja menulis `security: []`
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Registrasi, login, refresh token, logout" },
      { name: "Profil", description: "Data milik pengguna yang sedang login" },
      { name: "Peserta", description: "Pengelolaan data peserta" },
      { name: "Jurnal", description: "Jurnal harian dan proses review mentor" },
      { name: "Sistem", description: "Health check" },
    ],
  },
  // Lokasi file yang dipindai untuk mencari komentar @openapi
  apis: isProd ? ["./dist/routes/*.js"] : ["./src/routes/*.ts"],
}) as Record<string, unknown>;