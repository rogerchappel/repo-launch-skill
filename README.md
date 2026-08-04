# repo-launch-skill

Local-first CLI and library for preparing repository launch material from grounded repo facts. It generates release notes, demo scripts, post drafts, readiness gaps, and safety findings without publishing anything.

## Quickstart

```bash
npm test
npm run smoke
node bin/repo-launch-skill.js plan --manifest fixtures/manifest.json --readme fixtures/README.sample.md --format md
```

## Manifest Shape

```json
{
  "name": "my-tool",
  "description": "One factual sentence.",
  "audience": "agent builders",
  "features": ["Local CLI", "Fixture-backed tests"],
  "verification": ["npm test"],
  "limitations": ["Does not publish releases"],
  "safety": ["External publication requires approval"]
}
```

Manifest text values are trimmed. `description` and `audience`, plus every
entry in `features`, `verification`, `limitations`, and `safety`, must be
non-empty strings after trimming. Blank entries are treated as missing and do
not count toward readiness or appear in generated launch copy. A missing or
blank audience uses the `agent builders` default.

## CLI

```bash
repo-launch-skill validate --manifest manifest.json --readme README.md
repo-launch-skill plan --manifest manifest.json --readme README.md --format json
repo-launch-skill plan --manifest manifest.json --readme README.md --format md
```

`validate` exits successfully only when readiness is at least 80 and the plan
has no unresolved safety findings. Its JSON output includes `classification`,
`valid`, and `blockingFindings` so automation can explain a failed validation.
Exact verification commands must be non-empty entries in the manifest;
commands mentioned only in README text do not satisfy that launch requirement.

Options may appear in any order after the command. `--manifest`, `--readme`,
and `--format` accept one value each; `--format` supports `json` or `md` for
`plan`. Unknown options, missing values, duplicate options, unsupported formats,
and positional arguments produce a concise error and usage text with exit code
2. Use `repo-launch-skill --help` for usage without validating inputs.

## Safety Notes
Generated copy is draft material. The tool never tags releases, creates GitHub releases, publishes packages, posts to social channels, or updates external systems.
Every safety finding blocks a `ship` classification until the manifest or
launch copy is corrected, including warning-level findings for unverified
claims and missing exact verification commands.

## Limitations
- Uses simple local heuristics instead of live repository analysis.
- Requires human review for factual accuracy and claim quality.
- Platform-specific post formatting is intentionally minimal in this MVP.

## Verification

```bash
npm run check
npm run build
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

Use `npm run release:check` before publishing or opening a release PR.
`npm run package:smoke` verifies the CLI entrypoint, skill file, fixtures,
examples, support docs, changelog, package allowlist, and npm pack contents
without publishing.

## Install

```bash
npm install repo-launch-skill
npx repo-launch-skill --help
```
