import fs from "fs";
import path from "path";
import { spec } from "../docs/swagger";

const tujuan = path.join(process.cwd(), "docs", "openapi.json");

fs.mkdirSync(path.dirname(tujuan), { recursive: true });
fs.writeFileSync(tujuan, JSON.stringify(spec, null, 2), "utf-8");

console.log(`Dokumen OpenAPI ditulis ke ${tujuan}`);