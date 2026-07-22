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

test('creates a shippable launch plan from grounded fixture', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  const readme = fs.readFileSync('fixtures/README.sample.md', 'utf8');
  const plan = createLaunchPlan(manifest, readme, { now: '2026-06-11T00:00:00.000Z' });
  assert.equal(plan.classification, 'ship');
  assert.ok(plan.releaseNotes.includes('Fixture-backed evidence summaries'));
  assert.equal(plan.gaps.length, 0);
});

test('flags unverified launch claims and publishing language', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/thin-manifest.json', 'utf8'));
  const findings = inspectLaunchSafety(manifest, 'publish this release');
  assert.ok(findings.some(f => f.code === 'unverified-claim'));
  assert.ok(findings.some(f => f.code === 'external-publishing'));
});

test('validate fails a readiness-passing plan that requires approval', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.description += ' Please publish this production-ready tool.';
  const result = validateManifest(manifest);

  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).readiness.score, 100);
  assert.ok(JSON.parse(result.stdout).safety.some(finding => finding.level === 'approval'));
});

test('validate passes a readiness-passing plan without approval findings', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  const result = validateManifest(manifest);

  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).readiness.score, 100);
  assert.ok(JSON.parse(result.stdout).safety.every(finding => finding.level !== 'approval'));
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
