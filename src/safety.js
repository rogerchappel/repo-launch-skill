const RISKY_CLAIMS = [/best[- ]in[- ]class/i, /guarantee/i, /production[- ]ready/i, /secure by default/i, /fully automated/i];
const EXTERNAL_ACTIONS = /\b(publish|tag release|tweet|post to|send announcement|create release)\b/i;

export function inspectLaunchSafety(manifest, readme = '') {
  const text = [manifest.description, ...manifest.features, readme].join('\n');
  const findings = [];
  for (const pattern of RISKY_CLAIMS) {
    if (pattern.test(text)) findings.push({ level: 'warn', code: 'unverified-claim', message: 'Launch copy contains a claim that should be grounded or softened.' });
  }
  if (EXTERNAL_ACTIONS.test(text)) findings.push({ level: 'approval', code: 'external-publishing', message: 'Publishing or release actions require explicit approval.' });
  if (!manifest.verification.length) findings.push({ level: 'warn', code: 'missing-verification', message: 'No exact verification commands are listed.' });
  return findings;
}
