import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist");

async function copyIfExists(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(outDir, relativePath);
  try {
    const stat = await fs.stat(source);
    if (stat.isDirectory()) {
      await fs.mkdir(target, { recursive: true });
      await fs.cp(source, target, { recursive: true });
      return;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
  } catch {
    // Ignore optional files.
  }
}

async function main() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  await copyIfExists("index.html");
  await copyIfExists("app.js");
  await copyIfExists("styles.css");
  await copyIfExists("assets");
  await copyIfExists("manifest.webmanifest");
  await copyIfExists("favicon.ico");

  console.log("Prepared dist/ for Capacitor.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
