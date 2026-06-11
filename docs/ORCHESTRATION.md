# Orchestration

1. Prepare a local manifest describing repository facts.
2. Optionally pass a README path for signal detection.
3. Run `repo-launch-skill validate --manifest manifest.json --readme README.md`.
4. Run `repo-launch-skill plan --manifest manifest.json --readme README.md --format md`.
5. Review gaps and safety findings before using any launch copy.

The tool is dry-run only. Publishing, posting, release tagging, and package release steps require explicit user approval outside this skill.
