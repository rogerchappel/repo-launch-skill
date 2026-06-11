export function normalizeManifest(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : { ...input };
  return {
    name: data.name || 'unnamed-repo',
    description: data.description || '',
    audience: data.audience || 'agent builders',
    features: Array.isArray(data.features) ? data.features : [],
    verification: Array.isArray(data.verification) ? data.verification : [],
    links: data.links || {},
    limitations: Array.isArray(data.limitations) ? data.limitations : [],
    safety: Array.isArray(data.safety) ? data.safety : []
  };
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
