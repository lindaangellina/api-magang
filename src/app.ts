import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes";
import healthRoutes from "./routes/health.routes";
import { config } from "./config/env.config";
import { API_PREFIX } from "./config/constants";
import {
  requestId,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from "./middlewares";

const app: Application = express();

app.use(requestId);
app.use(helmet());
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