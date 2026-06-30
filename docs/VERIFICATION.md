# Verification Record

Run at: 2026-06-11 10:03 Australia/Brisbane cron lane

Commands passed locally:

- npm test
- npm run check
- npm run build
- npm run smoke
- npm run package:smoke
- npm run release:check
- bash scripts/validate.sh

Smoke output was written to /tmp/repo-launch-skill-smoke.md during validation.
Package smoke verifies the CLI entrypoint, reusable skill file, fixtures,
examples, support docs, changelog, package allowlist, bin metadata, and
`npm pack --dry-run`.
