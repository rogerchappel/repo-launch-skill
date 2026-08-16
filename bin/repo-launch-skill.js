#!/usr/bin/env node
import fs from 'node:fs';
import { createLaunchPlan } from '../src/index.js';

const args = process.argv.slice(2);
const command = args[0] || 'plan';
const usage = 'Usage: repo-launch-skill <plan|validate> --manifest manifest.json [--readme README.md] [--format json|md]';

if (command === 'help' || args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
if (command !== 'plan' && command !== 'validate') fail('Unknown command: ' + command);

const allowedOptions = command === 'plan'
  ? new Set(['--manifest', '--readme', '--format'])
  : new Set(['--manifest', '--readme']);
const options = new Map();
for (let index = 1; index < args.length; index += 2) {
  const option = args[index];
  if (!option.startsWith('--')) fail('Unexpected positional argument: ' + option);
  if (!allowedOptions.has(option)) fail('Unknown option: ' + option);
  if (options.has(option)) fail('Duplicate option: ' + option);

  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail('Option ' + option + ' requires a value');
  options.set(option, value);
}

const manifestPath = options.get('--manifest');
if (!manifestPath) fail('Missing required option: --manifest');
const format = options.get('--format') || 'json';
if (format !== 'json' && format !== 'md') fail('Unsupported --format value: ' + format);

const manifestSource = readInput(manifestPath, 'manifest');
let manifest;
try {
  manifest = JSON.parse(manifestSource);
} catch {
  fail('Invalid manifest JSON: ' + manifestPath);
}
const readmePath = options.get('--readme');
const readme = readmePath ? readInput(readmePath, 'README') : '';
const plan = createLaunchPlan(manifest, readme);
if (command === 'validate') {
  console.log(JSON.stringify({
    valid: plan.classification === 'ship',
    classification: plan.classification,
    readiness: plan.readiness,
    safety: plan.safety,
    blockingFindings: plan.blockingFindings
  }, null, 2));
  process.exit(plan.classification === 'ship' ? 0 : 1);
}
if (format === 'md') {
  process.stdout.write(['# Launch Plan: ' + plan.name, '', 'Classification: ' + plan.classification, 'Readiness: ' + plan.readiness.score, '', '## Release Notes', plan.releaseNotes, '', '## Demo Script', ...plan.demoScript.map(step => '- ' + step), '', '## Short Post', plan.posts.short, '', '## Gaps', ...(plan.gaps.length ? plan.gaps : ['No blocking gaps detected.']).map(gap => '- ' + gap), ''].join('\n'));
} else { process.stdout.write(JSON.stringify(plan, null, 2) + '\n'); }

function fail(message) {
  console.error(message + '\n' + usage);
  process.exit(2);
}

function readInput(filePath, label) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    fail('Unable to read ' + label + ': ' + filePath);
  }
}
