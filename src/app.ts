import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes";
import healthRoutes from "./routes/health.routes";
import { config } from "./config/env.config";
import {
  requestId,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from "./middlewares";

const app: Application = express();

app.use(requestId); // 1. beri ID dulu, supaya semua log punya ID
app.use(helmet()); // 2. security header standar
app.use(
  cors({
    origin: config.cors.origins, // daftar origin yang diizinkan
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" })); // 3. batasi ukuran body
app.use(requestLogger); // 4. log request

app.use("/api", healthRoutes);
app.use("/api", routes); // 5. route aplikasi

app.use(notFoundHandler); // 6. 404
app.use(errorHandler); // 7. error handler paling akhir

export default app;