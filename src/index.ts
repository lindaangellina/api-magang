import express, { Application } from "express";
import dotenv from "dotenv";
import routes from "./routes";
import { requestLogger } from "./middlewares/logger.middleware";
import { tambahRequestId } from "./middlewares/requestId.middleware";
import { rateLimiter } from "./middlewares/rateLimiter.middleware";
import { cekApiKeyUntukDelete } from "./middlewares/auth.middleware";

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(requestLogger);         // 1. catat SEMUA request masuk
app.use(tambahRequestId);       // 2. kasih id unik ke tiap request
app.use(express.json());        // 3. parse body JSON (WAJIB sebelum route)
app.use(rateLimiter);           // 4. cek batas request per IP
app.use(cekApiKeyUntukDelete);  // 5. cek API key khusus DELETE

app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});