import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import templateArray from "./midi-script-template.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extractArrowFunctionBody = (fnStr) => {
  const arrowIndex = fnStr.indexOf("=> {");
  const bodyEnd = fnStr.lastIndexOf("}");

  if (arrowIndex === -1 || bodyEnd === -1) {
    throw new Error("Invalid arrow function format.");
  }

  const lines = fnStr.substring(arrowIndex + 4, bodyEnd).split("\n");

  const indentSizes = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    });
  if (indentSizes.length === 0) {
    throw new Error("Script code is empty in function string.");
  }
  const minIndent = Math.min(...indentSizes);

  const result = lines
    .map((line) => (line.trim().length !== 0 ? line.slice(minIndent) : ""))
    .join("\n")
    .trim();
  if (result === "") {
    throw new Error("Script code is empty after normalization in function string.");
  }

  return result;
};

try {
  const transformedArray = JSON.parse(
    JSON.stringify(templateArray, (_key, value) => {
      if (typeof value === "function") {
        try {
          return extractArrowFunctionBody(value.toString());
        } catch (extractError) {
          throw new Error(`Failed to extract function body: ${extractError.message}`);
        }
      }
      return value;
    })
  );

  const outputPath = join(
    __dirname,
    "../src/pages/Controller/utils/generated/midi-script-template.json"
  );
  const outputDir = dirname(outputPath);

  mkdirSync(outputDir, { recursive: true });

  const jsonContent = JSON.stringify(transformedArray, null, 2);
  writeFileSync(outputPath, jsonContent, "utf-8");

  console.log(` Successfully generated ${transformedArray.length} templates in ${outputPath}`);
} catch (error) {
  console.error("Error generating MIDI template:", error);
  process.exit(1);
}
