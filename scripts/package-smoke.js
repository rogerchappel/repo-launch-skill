import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const requiredFiles = [
  "bin/repo-launch-skill.js",
  "src/index.js",
  "src/generator.js",
  "fixtures/manifest.json",
  "fixtures/README.sample.md",
  "examples/launch-manifest.md",
  "SKILL.md",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md"
];

for (const file of requiredFiles) {
  assert.ok(existsSync(file), `expected ${file} to exist`);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const files = new Set(packageJson.files ?? []);

for (const entry of ["src", "bin", "fixtures", "examples", "docs", "SKILL.md", "README.md", "CHANGELOG.md", "LICENSE", "SECURITY.md", "CONTRIBUTING.md"]) {
  assert.ok(files.has(entry), `package files should include ${entry}`);
}

assert.equal(packageJson.bin["repo-launch-skill"], "./bin/repo-launch-skill.js");

execFileSync("npm", ["pack", "--dry-run"], { stdio: "inherit" });
