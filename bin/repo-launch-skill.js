#!/usr/bin/env node
import fs from 'node:fs';
import { createLaunchPlan } from '../src/index.js';

const args = process.argv.slice(2);
const command = args[0] || 'plan';
const getArg = (name, fallback = null) => { const index = args.indexOf(name); return index === -1 ? fallback : args[index + 1]; };

if (command === 'help' || args.includes('--help')) {
  console.log('Usage: repo-launch-skill plan --manifest manifest.json [--readme README.md] [--format json|md]');
  process.exit(0);
}
if (command !== 'plan' && command !== 'validate') { console.error('Unknown command: ' + command); process.exit(2); }
const manifestPath = getArg('--manifest');
if (!manifestPath) { console.error('Missing --manifest'); process.exit(2); }
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const readmePath = getArg('--readme');
const readme = readmePath ? fs.readFileSync(readmePath, 'utf8') : '';
const plan = createLaunchPlan(manifest, readme);
if (command === 'validate') { console.log(JSON.stringify({ readiness: plan.readiness, safety: plan.safety }, null, 2)); process.exit(plan.readiness.score >= 80 ? 0 : 1); }
if (getArg('--format', 'json') === 'md') {
  process.stdout.write(['# Launch Plan: ' + plan.name, '', 'Classification: ' + plan.classification, 'Readiness: ' + plan.readiness.score, '', '## Release Notes', plan.releaseNotes, '', '## Demo Script', ...plan.demoScript.map(step => '- ' + step), '', '## Short Post', plan.posts.short, '', '## Gaps', ...(plan.gaps.length ? plan.gaps : ['No blocking gaps detected.']).map(gap => '- ' + gap), ''].join('\n'));
} else { process.stdout.write(JSON.stringify(plan, null, 2) + '\n'); }
