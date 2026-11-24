import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it, expect } from "vitest";

const root = resolve(process.cwd());
const KEY_NAME = "SUPABASE_SERVICE" + "_ROLE_KEY";
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./;

function filesUnder(dir: string, extensions: string[]): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return filesUnder(full, extensions);
    return extensions.some((ext) => full.endsWith(ext)) ? [full] : [];
  });
}

describe("T-SEC-20b service-role key never reaches the client or CI", () => {
  it("is absent from all client and server application source", () => {
    const files = filesUnder(join(root, "src"), [".ts", ".tsx"]).filter(
      (file) => !file.includes("__tests__") && !file.includes(".test."),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toContain(KEY_NAME);
      expect(source, file).not.toMatch(JWT);
    }
  });

  it("is absent from GitHub Actions configuration", () => {
    const files = filesUnder(join(root, ".github"), [".yml", ".yaml"]);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toContain(KEY_NAME);
      expect(source, file).not.toMatch(JWT);
    }
  });

  it(".env.example documents the variable name but never a value", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    expect(example).toContain(`${KEY_NAME}=`);
    expect(example).not.toMatch(JWT);
  });
});
