export function normalizeManifest(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : { ...input };
  return {
    name: nonEmptyText(data.name) || 'unnamed-repo',
    description: nonEmptyText(data.description),
    audience: nonEmptyText(data.audience) || 'agent builders',
    features: textEntries(data.features),
    verification: textEntries(data.verification),
    links: data.links || {},
    limitations: textEntries(data.limitations),
    safety: textEntries(data.safety)
  };
}

function nonEmptyText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function textEntries(value) {
  return Array.isArray(value) ? value.map(nonEmptyText).filter(Boolean) : [];
}

export function readmeSignals(readme = '') {
  const text = String(readme);
  return {
    hasQuickstart: /quickstart|usage/i.test(text),
    hasInstall: /install|npm|pip|cargo|go install/i.test(text),
    hasExamples: /example|fixtures|demo/i.test(text),
    hasSafety: /safety|limitations|security/i.test(text),
    hasTests: /npm test|pytest|go test|cargo test|verification/i.test(text)
  };
}
