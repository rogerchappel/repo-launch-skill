import { normalizeManifest } from './manifest.js';
import { scoreReadiness } from './readiness.js';
import { inspectLaunchSafety } from './safety.js';

export function createLaunchPlan(rawManifest, readme = '', options = {}) {
  const manifest = normalizeManifest(rawManifest);
  const readiness = scoreReadiness(manifest, readme);
  const safety = inspectLaunchSafety(manifest, readme);
  return {
    name: manifest.name,
    generatedAt: options.now || new Date().toISOString(),
    classification: readiness.score >= 80 && !safety.some(f => f.level === 'approval') ? 'ship' : 'incubate',
    readiness,
    safety,
    releaseNotes: releaseNotes(manifest),
    demoScript: demoScript(manifest),
    posts: posts(manifest),
    gaps: readiness.checks.filter(check => !check.pass).map(check => check.recommendation)
  };
}

function releaseNotes(manifest) {
  return ['# Release candidate: ' + manifest.name, '', manifest.description, '', '## Highlights', ...manifest.features.map(f => '- ' + f), '', '## Verification', ...(manifest.verification.length ? manifest.verification : ['Add verification commands before launch.']).map(v => '- ' + v), '', '## Limitations', ...(manifest.limitations.length ? manifest.limitations : ['No limitations listed yet.']).map(v => '- ' + v)].join('\n');
}

function demoScript(manifest) {
  return ['Open with the problem for ' + manifest.audience + '.', 'Show the quickest local command.', 'Run one fixture-backed example.', 'Point to safety or limitation notes.', 'Close with the next contribution path.'];
}

function posts(manifest) {
  return {
    short: manifest.name + ' is a local-first helper for ' + manifest.audience + ': ' + manifest.description,
    long: [manifest.name, manifest.description, 'Highlights: ' + manifest.features.join('; '), 'Try it locally and verify with: ' + (manifest.verification.join(', ') || 'the documented smoke command')].join('\n\n')
  };
}
