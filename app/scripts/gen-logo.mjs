import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const png = fs.readFileSync(path.join(root, "src/assets/logo-zap.png"));
const out = path.join(root, "src/brand/logoZap.ts");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  `export const LOGO_ZAP_DATA_URL = "data:image/png;base64,${png.toString("base64")}";\n`,
);
