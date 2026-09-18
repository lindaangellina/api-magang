import express, { Application } from "express";
import routes from "./routes";
import {
  requestLogger,
  tambahRequestId,
  rateLimiter,
  cekApiKeyUntukDelete,
  errorHandler,
  notFoundHandler,
} from "./middlewares";

const app: Application = express();

app.use(requestLogger);
app.use(tambahRequestId);
app.use(express.json());
app.use(rateLimiter);
app.use(cekApiKeyUntukDelete);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;