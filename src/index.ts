import express, { Application } from "express";
import dotenv from "dotenv";
import routes from "./routes";
import { requestLogger } from "./middlewares/logger.middleware";
import { tambahRequestId } from "./middlewares/requestId.middleware";
import { rateLimiter } from "./middlewares/rateLimiter.middleware";
import { cekApiKeyUntukDelete } from "./middlewares/auth.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(requestLogger);
app.use(tambahRequestId);
app.use(express.json());
app.use(rateLimiter);
app.use(cekApiKeyUntukDelete);

app.use("/api", routes);

app.use(notFoundHandler);  // setelah semua route
app.use(errorHandler);     // PALING TERAKHIR

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});