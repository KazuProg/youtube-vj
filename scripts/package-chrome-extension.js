import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const chromeExtensionDir = join(__dirname, "../chrome-extension");
  const distDir = join(__dirname, "../dist");
  const outputPath = join(distDir, "YouTube-VJ_Plus.zip");

  mkdirSync(distDir, { recursive: true });

  const output = createWriteStream(outputPath);
  const archive = archiver("zip");

  output.on("close", () => {
    console.log(`Chrome extension packaged: ${outputPath} (${archive.pointer()} bytes)`);
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);

  archive.directory(chromeExtensionDir, false);

  await archive.finalize();
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
