import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

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

const packOutput = execFileSync("npm", ["pack", "--json"], { encoding: "utf8" });
const [{ filename }] = JSON.parse(packOutput);
const installRoot = mkdtempSync(join(tmpdir(), "repo-launch-skill-install-"));

try {
  execFileSync("npm", ["install", "--prefix", installRoot, resolve(filename)], {
    stdio: "inherit"
  });
  const executable = process.platform === "win32"
    ? join(installRoot, "node_modules", ".bin", "repo-launch-skill.cmd")
    : join(installRoot, "node_modules", ".bin", "repo-launch-skill");
  const help = execFileSync(executable, ["--help"], { encoding: "utf8" });
  assert.match(help, /Usage: repo-launch-skill/);
} finally {
  rmSync(resolve(filename), { force: true });
  rmSync(installRoot, { recursive: true, force: true });
}
