# repo-launch-skill

Use this skill when an agent needs to prepare repository launch material, release-candidate notes, demo scripts, or public post drafts from local repository facts.

## Required Inputs
- A local JSON manifest with repo name, description, features, verification commands, limitations, and safety notes.
- Optional README text for quickstart, examples, and safety signal checks.

## Tools
- Node.js 20 or newer.
- Local filesystem read access to manifest and README files.

## Side-effect Boundaries
- This skill reads local files and writes generated material to stdout only.
- It must not create tags, GitHub releases, social posts, package publishes, or repository metadata changes.
- Any publish, post, tag, or release action requires explicit user approval later.

## Workflow
1. Normalize the manifest and inspect README signals.
2. Validate readiness and safety findings.
3. Generate markdown or JSON launch material.
4. Ground or remove any unverified claim.
5. Ask for approval before any external publication step.

## Examples
```bash
repo-launch-skill validate --manifest fixtures/manifest.json --readme fixtures/README.sample.md
repo-launch-skill plan --manifest fixtures/manifest.json --readme fixtures/README.sample.md --format md
```

## Verification
Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, or `bash scripts/validate.sh` after changes.
