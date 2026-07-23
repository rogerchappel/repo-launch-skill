# Example Launch Manifest

Use `fixtures/manifest.json` as the minimum useful shape for a launch planning
run. Keep claims factual and include at least one non-empty exact verification
command in the manifest. A README command alone does not satisfy validation,
and any unresolved safety finding keeps the plan in `incubate`.

```bash
repo-launch-skill plan --manifest fixtures/manifest.json --readme fixtures/README.sample.md --format md
```
