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

## CLI

```bash
repo-launch-skill validate --manifest manifest.json --readme README.md
repo-launch-skill plan --manifest manifest.json --readme README.md --format json
repo-launch-skill plan --manifest manifest.json --readme README.md --format md
```

## Safety Notes
Generated copy is draft material. The tool never tags releases, creates GitHub releases, publishes packages, posts to social channels, or updates external systems.

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
