import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import healthRoutes from "./routes/health.routes";
import { config } from "./config/env.config";
import { API_PREFIX } from "./config/constants";
import { spec } from "./docs/swagger";
import {
  requestId,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from "./middlewares";

const app: Application = express();

app.use(requestId);

if (config.docs.enabled) {
  // Dokumen mentah (JSON): dipakai Postman dan generator tipe
  app.get("/api/docs.json", (_req, res) => {
    res.json(spec);
  });

  // Dipasang SEBELUM helmet global: CSP bawaan helmet bisa memblokir aset Swagger UI.
  // CSP dimatikan khusus rute docs; semua rute lain tetap dilindungi helmet() di bawah.
  app.use(
    "/api/docs",
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "API Magang Batch 4 — Dokumentasi",
      swaggerOptions: { persistAuthorization: true, docExpansion: "list" },
    })
  );
}

 app.use(helmet());// helmet global untuk semua route lain
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    // Tanpa ini, JavaScript di browser tidak bisa membaca header-header ini
    exposedHeaders: ["Location", "X-Request-Id", "Retry-After"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use(API_PREFIX, healthRoutes);
app.use(API_PREFIX, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;