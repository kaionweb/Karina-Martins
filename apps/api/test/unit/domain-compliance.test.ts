import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const IGNORED_DIRS = new Set(["node_modules", ".next", "dist", ".turbo"]);

function collectFiles(dir: string, extensions: string[]): string[] {
  const entries = readdirSync(dir);
  let files: string[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) {
      continue;
    }

    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("Conformidade de domínio (Story 5.4)", () => {
  it("GEMINI_API_KEY nunca é referenciada em apps/web (AC1)", () => {
    const webSrc = path.resolve(__dirname, "../../../../apps/web/src");
    const files = collectFiles(webSrc, [".ts", ".tsx"]);

    const offenders = files.filter((file) => readFileSync(file, "utf-8").includes("GEMINI_API_KEY"));

    expect(offenders).toEqual([]);
  });

  it("Profile no schema.prisma não coleta dados excedentes de perfis CHILD nem expõe XP mutável (AC1)", () => {
    const schemaPath = path.resolve(__dirname, "../../../../packages/database/prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf-8");

    const modelStart = schema.indexOf("model Profile {");
    expect(modelStart).toBeGreaterThan(-1);
    const modelEnd = schema.indexOf("\n}", modelStart);
    const profileBlock = schema.slice(modelStart, modelEnd).toLowerCase();

    const forbiddenFields = ["surname", "sobrenome", "birthdate", "datanascimento", "photo", "foto", "xptotal"];
    for (const field of forbiddenFields) {
      expect(profileBlock).not.toContain(field);
    }
  });
});
