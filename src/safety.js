const RISKY_CLAIMS = [/best[- ]in[- ]class/i, /guarantee/i, /production[- ]ready/i, /secure by default/i, /fully automated/i];
const EXTERNAL_ACTIONS = /\b(publish this|publish (?:the |a )?(?:package|release)|tag (?:the )?release|tweet|post to|send (?:an )?announcement|create (?:a )?release)\b/gi;
const DIRECT_NEGATION = /\b(?:(?:do|does|did|must|should|will|can)\s+not|never|don't|doesn't|didn't)\s+(?:automatically\s+)?$/i;

export function inspectLaunchSafety(manifest, readme = '') {
  const features = Array.isArray(manifest.features) ? manifest.features : [];
  const verification = Array.isArray(manifest.verification) ? manifest.verification : [];
  const text = [manifest.description || '', ...features, readme].join('\n');
  const findings = [];
  for (const pattern of RISKY_CLAIMS) {
    if (pattern.test(text)) findings.push({ level: 'warn', code: 'unverified-claim', message: 'Launch copy contains a claim that should be grounded or softened.' });
  }
  if (hasAffirmativeExternalAction(text)) findings.push({ level: 'approval', code: 'external-publishing', message: 'Publishing or release actions require explicit approval.' });
  const hasExactVerification = hasExecutableVerificationCommand(verification);
  if (!hasExactVerification) findings.push({ level: 'warn', code: 'missing-verification', message: 'No exact verification commands are listed.' });
  return findings;
}

function hasAffirmativeExternalAction(text) {
  return [...text.matchAll(EXTERNAL_ACTIONS)].some(match => {
    const prefix = text.slice(Math.max(0, match.index - 40), match.index);
    return !DIRECT_NEGATION.test(prefix);
  });
}
import { hasExecutableVerificationCommand } from './verification.js';
