import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createLaunchPlan, inspectLaunchSafety, normalizeManifest } from '../src/index.js';

test('normalizes manifest defaults', () => {
  const manifest = normalizeManifest({ name: 'x' });
  assert.equal(manifest.audience, 'agent builders');
  assert.deepEqual(manifest.features, []);
});

test('normalizes whitespace-only manifest content as missing', () => {
  const manifest = normalizeManifest({
    name: '  example  ',
    description: '   ',
    audience: '\t',
    features: ['', '   '],
    verification: ['\n'],
    limitations: ['  '],
    safety: ['\t']
  });

  assert.equal(manifest.name, 'example');
  assert.equal(manifest.description, '');
  assert.equal(manifest.audience, 'agent builders');
  assert.deepEqual(manifest.features, []);
  assert.deepEqual(manifest.verification, []);
  assert.deepEqual(manifest.limitations, []);
  assert.deepEqual(manifest.safety, []);
});

test('trims valid manifest content and removes blank array entries', () => {
  const manifest = normalizeManifest({
    description: '  Grounded description.  ',
    audience: '  maintainers  ',
    features: ['  Local CLI  ', '', '  Fixture-backed tests '],
    verification: ['  npm test  ', ' '],
    limitations: [' ', '  Local analysis only  '],
    safety: ['  Review generated copy  ', '\t']
  });

  assert.equal(manifest.description, 'Grounded description.');
  assert.equal(manifest.audience, 'maintainers');
  assert.deepEqual(manifest.features, ['Local CLI', 'Fixture-backed tests']);
  assert.deepEqual(manifest.verification, ['npm test']);
  assert.deepEqual(manifest.limitations, ['Local analysis only']);
  assert.deepEqual(manifest.safety, ['Review generated copy']);
});

test('creates a shippable launch plan from grounded fixture', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  const readme = fs.readFileSync('fixtures/README.sample.md', 'utf8');
  const plan = createLaunchPlan(manifest, readme, { now: '2026-06-11T00:00:00.000Z' });
  assert.equal(plan.classification, 'ship');
  assert.ok(plan.releaseNotes.includes('Fixture-backed evidence summaries'));
  assert.equal(plan.gaps.length, 0);
});

test('missing manifest verification blocks an otherwise ready launch plan', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = [];
  const readme = fs.readFileSync('fixtures/README.sample.md', 'utf8');
  const plan = createLaunchPlan(manifest, readme, { now: '2026-06-11T00:00:00.000Z' });

  assert.equal(plan.readiness.score, 100);
  assert.equal(plan.classification, 'incubate');
  assert.ok(plan.safety.some(finding => finding.code === 'missing-verification'));
});

test('an unverified claim blocks an otherwise ready launch plan', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.description += ' This production-ready tool is fully automated.';
  const readme = fs.readFileSync('fixtures/README.sample.md', 'utf8');
  const plan = createLaunchPlan(manifest, readme, { now: '2026-06-11T00:00:00.000Z' });

  assert.equal(plan.readiness.score, 100);
  assert.equal(plan.classification, 'incubate');
  assert.ok(plan.safety.some(finding => finding.code === 'unverified-claim'));
});

test('flags unverified launch claims and publishing language', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/thin-manifest.json', 'utf8'));
  const findings = inspectLaunchSafety(manifest, 'publish this release');
  assert.ok(findings.some(f => f.code === 'unverified-claim'));
  assert.ok(findings.some(f => f.code === 'external-publishing'));
});

test('does not treat a blank verification entry as an exact command', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = ['  '];

  const findings = inspectLaunchSafety(manifest);

  assert.ok(findings.some(finding => finding.code === 'missing-verification'));
});

test('validate fails a readiness-passing plan that requires approval', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.description += ' Please publish this production-ready tool.';
  const result = validateManifest(manifest);

  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).readiness.score, 100);
  assert.ok(JSON.parse(result.stdout).safety.some(finding => finding.level === 'approval'));
});

test('validate fails a readiness-passing plan with missing manifest verification', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = [];
  const result = validateManifest(manifest);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, false);
  assert.equal(output.classification, 'incubate');
  assert.equal(output.readiness.score, 100);
  assert.ok(output.blockingFindings.some(finding => finding.code === 'missing-verification'));
});

test('validate rejects whitespace-only launch content with concrete gaps', () => {
  const manifest = {
    name: 'blank-content',
    description: '   ',
    audience: '\t',
    features: ['', '   '],
    verification: [' npm test '],
    limitations: ['  '],
    safety: ['\n']
  };
  const result = validateManifest(manifest);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, false);
  assert.equal(output.classification, 'incubate');
  assert.ok(output.readiness.checks.some(check => check.id === 'description' && !check.pass));
  assert.ok(output.readiness.checks.some(check => check.id === 'features' && !check.pass));
});

test('validate fails a readiness-passing plan with an unverified claim', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.description += ' This production-ready tool is fully automated.';
  const result = validateManifest(manifest);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, false);
  assert.equal(output.classification, 'incubate');
  assert.equal(output.readiness.score, 100);
  assert.ok(output.blockingFindings.some(finding => finding.code === 'unverified-claim'));
});

test('validate passes a grounded readiness-passing plan without safety findings', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  const result = validateManifest(manifest);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, true);
  assert.equal(output.classification, 'ship');
  assert.equal(output.readiness.score, 100);
  assert.deepEqual(output.blockingFindings, []);
});

function validateManifest(manifest) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-launch-skill-test-'));
  const manifestPath = path.join(directory, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  try {
    return spawnSync(process.execPath, ['bin/repo-launch-skill.js', 'validate', '--manifest', manifestPath, '--readme', 'fixtures/README.sample.md'], { encoding: 'utf8' });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
