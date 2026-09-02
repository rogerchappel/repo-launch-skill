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

test('README readiness requires affirmative structured guidance', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  const plan = createLaunchPlan(manifest, 'No quickstart exists. No examples exist.');

  assert.equal(plan.classification, 'incubate');
  assert.ok(plan.readiness.checks.some(check => check.id === 'quickstart' && !check.pass));
  assert.ok(plan.readiness.checks.some(check => check.id === 'examples' && !check.pass));
});

test('README verification readiness rejects negated and unrelated prose', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = [];

  for (const readme of [
    '# Verification\n\nVerification is unavailable.',
    '# Status\n\nVerification evidence is reviewed before launch.',
    '# Verification\n\nDo not run npm test in this repository.'
  ]) {
    const plan = createLaunchPlan(manifest, readme);
    assert.ok(plan.readiness.checks.some(check => check.id === 'verification' && !check.pass));
    assert.ok(plan.gaps.includes('Add exact verification commands.'));
    assert.equal(plan.classification, 'incubate');
    assert.ok(plan.safety.some(finding => finding.code === 'missing-verification'));
  }
});

test('README verification readiness accepts executable command examples', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = [];

  for (const readme of ['# Verification\n\n```bash\nnpm test\n```', '# Checks\n\nRun `pytest -q`.']) {
    const plan = createLaunchPlan(manifest, readme);
    assert.ok(plan.readiness.checks.some(check => check.id === 'verification' && check.pass));
  }
});

test('manifest exact verification commands satisfy readiness without README evidence', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = ['npm run release:check'];

  const plan = createLaunchPlan(manifest, '# Verification\n\nVerification is unavailable.');

  assert.ok(plan.readiness.checks.some(check => check.id === 'verification' && check.pass));
  assert.ok(!plan.safety.some(finding => finding.code === 'missing-verification'));
});

test('manifest verification rejects prose-only entries', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = ['looks good'];
  const readme = fs.readFileSync('fixtures/README.sample.md', 'utf8');
  const plan = createLaunchPlan(manifest, readme);

  assert.ok(plan.readiness.checks.some(check => check.id === 'verification' && !check.pass));
  assert.ok(plan.safety.some(finding => finding.code === 'missing-verification'));
  assert.equal(plan.classification, 'incubate');
});

test('manifest verification preserves supported executable commands', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  const commands = ['npm test', 'npm run release:check', 'npx eslint .', 'pytest -q', 'python -m pytest', 'go test ./...', 'cargo test'];

  for (const command of commands) {
    manifest.verification = [command];
    const plan = createLaunchPlan(manifest, '# Quickstart\n\nRun the tool.\n\n# Examples\n\nExample.\n\n# Safety\n\nReview output.');
    assert.ok(plan.readiness.checks.some(check => check.id === 'verification' && check.pass), command);
    assert.ok(!plan.safety.some(finding => finding.code === 'missing-verification'), command);
  }
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

test('common automatic package publishing language requires approval', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.description += ' Publish the package automatically.';

  const plan = createLaunchPlan(manifest, fs.readFileSync('fixtures/README.sample.md', 'utf8'));

  assert.equal(plan.classification, 'incubate');
  assert.ok(plan.safety.some(finding => finding.level === 'approval' && finding.code === 'external-publishing'));
});

test('clear publishing prohibitions do not require approval', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));

  for (const readme of [
    'Do not publish the package.',
    'Never tag the release.',
    'The tool does not create a release.'
  ]) {
    const findings = inspectLaunchSafety(manifest, readme);
    assert.ok(!findings.some(finding => finding.code === 'external-publishing'), readme);
  }
});

test('CLI distinguishes prohibited publishing from affirmative directions', () => {
  const prohibited = validateManifestWithReadme('Do not publish the package.');
  assert.equal(prohibited.status, 0);
  assert.ok(!JSON.parse(prohibited.stdout).blockingFindings.some(finding => finding.code === 'external-publishing'));

  const affirmative = validateManifestWithReadme('Publish the package after validation.');
  assert.equal(affirmative.status, 1);
  assert.ok(JSON.parse(affirmative.stdout).blockingFindings.some(finding => finding.code === 'external-publishing'));
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

test('validate rejects a prose-only manifest verification entry', () => {
  const manifest = JSON.parse(fs.readFileSync('fixtures/manifest.json', 'utf8'));
  manifest.verification = ['looks good'];
  const result = validateManifest(manifest);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, false);
  assert.equal(output.classification, 'incubate');
  assert.ok(output.readiness.checks.some(check => check.id === 'verification' && !check.pass));
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

test('CLI rejects malformed arguments with usage guidance', () => {
  const invalidArguments = [
    { args: ['plan', '--manifest'], error: 'Option --manifest requires a value' },
    { args: ['plan', '--manifest', 'fixtures/manifest.json', '--bogus'], error: 'Unknown option: --bogus' },
    { args: ['plan', '--manifest', 'fixtures/manifest.json', '--format', 'yaml'], error: 'Unsupported --format value: yaml' },
    { args: ['plan', '--manifest', 'fixtures/manifest.json', '--manifest', 'fixtures/thin-manifest.json'], error: 'Duplicate option: --manifest' },
    { args: ['validate', '--manifest', 'fixtures/manifest.json', 'extra'], error: 'Unexpected positional argument: extra' }
  ];

  for (const { args, error } of invalidArguments) {
    const result = runCli(args);
    assert.equal(result.status, 2, args.join(' '));
    assert.match(result.stderr, new RegExp(error.replaceAll('-', '\\-')));
    assert.match(result.stderr, /Usage: repo-launch-skill/);
  }
});

test('CLI reports malformed and unreadable input files without a stack trace', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-launch-skill-input-'));
  const malformedManifest = path.join(directory, 'malformed.json');
  fs.writeFileSync(malformedManifest, '{');

  try {
    const cases = [
      {
        args: ['plan', '--manifest', malformedManifest],
        error: 'Invalid manifest JSON: ' + malformedManifest
      },
      {
        args: ['plan', '--manifest', path.join(directory, 'missing.json')],
        error: 'Unable to read manifest: ' + path.join(directory, 'missing.json')
      },
      {
        args: ['plan', '--manifest', 'fixtures/manifest.json', '--readme', path.join(directory, 'missing.md')],
        error: 'Unable to read README: ' + path.join(directory, 'missing.md')
      }
    ];

    for (const { args, error } of cases) {
      const result = runCli(args);
      assert.equal(result.status, 2, args.join(' '));
      assert.match(result.stderr, new RegExp(escapeRegExp(error)));
      assert.match(result.stderr, /Usage: repo-launch-skill/);
      assert.doesNotMatch(result.stderr, /\n\s+at |SyntaxError:/);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI accepts documented options in any order for plan and validate', () => {
  const plan = runCli(['plan', '--format', 'json', '--readme', 'fixtures/README.sample.md', '--manifest', 'fixtures/manifest.json']);
  assert.equal(plan.status, 0);
  assert.equal(JSON.parse(plan.stdout).classification, 'ship');

  const validate = runCli(['validate', '--readme', 'fixtures/README.sample.md', '--manifest', 'fixtures/manifest.json']);
  assert.equal(validate.status, 0);
  assert.equal(JSON.parse(validate.stdout).valid, true);
});

test('CLI help remains available without required options', () => {
  for (const args of [['--help'], ['plan', '--help'], ['validate', '--help'], ['help']]) {
    const result = runCli(args);
    assert.equal(result.status, 0, args.join(' '));
    assert.match(result.stdout, /Usage: repo-launch-skill/);
    assert.equal(result.stderr, '');
  }
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

function validateManifestWithReadme(readme) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-launch-skill-readme-'));
  const readmePath = path.join(directory, 'README.md');
  fs.writeFileSync(readmePath, fs.readFileSync('fixtures/README.sample.md', 'utf8') + '\n' + readme + '\n');
  try {
    return runCli(['validate', '--manifest', 'fixtures/manifest.json', '--readme', readmePath]);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function runCli(args) {
  return spawnSync(process.execPath, ['bin/repo-launch-skill.js', ...args], { encoding: 'utf8' });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
