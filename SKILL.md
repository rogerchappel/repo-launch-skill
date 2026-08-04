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
3. Treat every unresolved safety finding as blocking; warning-level findings do
   not permit a `ship` classification or successful CLI validation.
4. Require at least one non-empty exact verification command in the manifest.
   README verification text contributes to readiness but does not replace this
   manifest requirement.
5. Generate markdown or JSON launch material.
6. Ground or remove any unverified claim.
7. Ask for approval before any external publication step.

## Examples
```bash
repo-launch-skill validate --manifest fixtures/manifest.json --readme fixtures/README.sample.md
repo-launch-skill plan --manifest fixtures/manifest.json --readme fixtures/README.sample.md --format md
```

Options may be reordered, but each option can appear only once and must have a
value. `plan` accepts `--format json` or `--format md`; malformed arguments exit
with status 2 and print the error plus usage. Run `repo-launch-skill --help` to
show usage without requiring a manifest.

## Verification
Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, or `bash scripts/validate.sh` after changes.
