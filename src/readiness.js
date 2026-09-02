import { readmeSignals } from './manifest.js';
import { hasExecutableVerificationCommand } from './verification.js';

export function scoreReadiness(manifest, readme = '') {
  const signals = readmeSignals(readme);
  const verificationPasses = manifest.verification.length > 0
    ? hasExecutableVerificationCommand(manifest.verification)
    : signals.hasTests;
  const checks = [
    check('description', Boolean(manifest.description), 'Add a concrete one-sentence repo description.'),
    check('features', manifest.features.length >= 2, 'List at least two grounded features.'),
    check('verification', verificationPasses, 'Add exact verification commands.'),
    check('quickstart', signals.hasQuickstart, 'Add quickstart or usage guidance.'),
    check('examples', signals.hasExamples, 'Add examples, fixtures, or demo material.'),
    check('safety', manifest.safety.length > 0 || signals.hasSafety, 'Document limitations and safety boundaries.')
  ];
  const passed = checks.filter(item => item.pass).length;
  return { score: Math.round((passed / checks.length) * 100), checks };
}

function check(id, pass, recommendation) {
  return { id, pass, recommendation: pass ? null : recommendation };
}
