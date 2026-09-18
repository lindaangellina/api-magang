import app from "./app";
import { config } from "./config/env.config";

app.listen(config.app.port, () => {
  console.log(`${config.app.name} berjalan di http://localhost:${config.app.port}`);
});