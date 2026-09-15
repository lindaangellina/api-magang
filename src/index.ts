import express, { Application } from "express";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Semua route di-prefix /api
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});