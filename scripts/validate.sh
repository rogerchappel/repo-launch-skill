#!/usr/bin/env bash
set -euo pipefail
npm test
npm run check
npm run build
npm run smoke >/tmp/repo-launch-skill-smoke.md
test -s /tmp/repo-launch-skill-smoke.md
npm run package:smoke
