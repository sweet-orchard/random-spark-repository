import fs from "node:fs";
import path from "node:path";

const domDir = path.join(process.cwd(), "node_modules", "framer-motion", "dist", "es", "render", "dom");
const target = path.join(domDir, "create-visual-element.mjs");
const candidates = [
  path.join(domDir, "create-visual-element 3.mjs"),
  path.join(domDir, "create-visual-element 2.mjs"),
];

if (fs.existsSync(target)) {
  process.exit(0);
}

const source = candidates.find((file) => fs.existsSync(file));
if (!source) {
  console.warn("[postinstall] framer-motion fix skipped: no source file found");
  process.exit(0);
}

fs.copyFileSync(source, target);
console.log(`[postinstall] restored missing ${path.relative(process.cwd(), target)} from ${path.basename(source)}`);
