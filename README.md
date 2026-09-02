# repo-launch-skill

Local-first CLI and library for preparing repository launch material from grounded repo facts. It generates release notes, demo scripts, post drafts, readiness gaps, and safety findings without publishing anything.

## Quickstart

```bash
npm install
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
Manifest verification entries must start with a supported executable command:
`npm test`, `npm run <script>`, `npx <tool>`, `pytest`, `python -m pytest`,
`go test`, or `cargo test`. Arguments may follow the command. Blank entries and
prose such as `looks good` do not clear readiness or the missing-verification
safety finding. Readiness recognizes the same commands when they appear as
fenced or inline code in the README; prose that merely mentions verification or
says a command is unavailable does not count as executable evidence.
README quickstart/usage readiness requires a matching Markdown section with an
actionable command or instruction. Example and safety readiness likewise use
non-empty matching sections, so mentions such as `No examples exist` are not
treated as evidence that documentation exists.

Options may appear in any order after the command. `--manifest`, `--readme`,
and `--format` accept one value each; `--format` supports `json` or `md` for
`plan`. Unknown options, missing values, duplicate options, unsupported formats,
and positional arguments produce a concise error and usage text with exit code
2. Use `repo-launch-skill --help` for usage without validating inputs.
Unreadable manifest or README files and malformed manifest JSON use the same
concise exit-code-2 diagnostic without exposing a runtime stack trace.

## Safety Notes
Generated copy is draft material. The tool never tags releases, creates GitHub releases, publishes packages, posts to social channels, or updates external systems.
Every safety finding blocks a `ship` classification until the manifest or
launch copy is corrected, including warning-level findings for unverified
claims and missing exact verification commands.
Affirmative language directing package publication, release creation or
tagging, announcements, or external posts is an approval-level finding and
also blocks shipment. Clear direct prohibitions such as `Do not publish the
package`, `Never tag the release`, and `The tool does not create a release`
document a boundary and are not treated as publishing instructions.

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

The package is not published to the npm registry yet. From a source checkout,
create the same tarball that will be published, install it into a temporary
local prefix, and run the packaged executable:

```bash
npm pack
npm install --prefix /tmp/repo-launch-skill-install ./repo-launch-skill-0.1.0.tgz
/tmp/repo-launch-skill-install/node_modules/.bin/repo-launch-skill --help
```

After a future npm release, the registry installation will be
`npm install repo-launch-skill`; it will not work until the package is
published.
