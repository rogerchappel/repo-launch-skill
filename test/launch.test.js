import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
