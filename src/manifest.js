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
  const quickstart = sectionBody(text, ['quickstart', 'usage']);
  const examples = sectionBody(text, ['examples?', 'fixtures?', 'demo']);
  const safety = sectionBody(text, ['safety', 'limitations?', 'security']);
  return {
    hasQuickstart: hasActionableGuidance(quickstart),
    hasInstall: /install|npm|pip|cargo|go install/i.test(text),
    hasExamples: hasAffirmativeContent(examples),
    hasSafety: hasAffirmativeContent(safety),
    hasTests: hasVerificationCommand(text)
  };
}

function hasVerificationCommand(markdown) {
  const command = String.raw`(?:npm\s+(?:test|run\s+[\w:.-]+)|npx\s+[\w@/.-]+|pytest\b|python\s+-m\s+pytest\b|go\s+test\b|cargo\s+test\b)`;
  const fencedCommands = [...markdown.matchAll(/```(?:\w+)?\s*\n([\s\S]*?)```/g)].map(match => match[1]).join('\n');
  const inlineCommands = [...markdown.matchAll(/`([^`\n]+)`/g)].map(match => match[1]).join('\n');
  const commandLine = new RegExp(`^(?:\\s*(?:[$>]\\s*)?)${command}`, 'im');
  return commandLine.test(fencedCommands) || commandLine.test(inlineCommands);
}

function sectionBody(markdown, headingNames) {
  const name = headingNames.join('|');
  const pattern = new RegExp(`^#{1,6}\\s+(?:${name})\\s*$([\\s\\S]*?)(?=^#{1,6}\\s|(?![\\s\\S]))`, 'im');
  return markdown.match(pattern)?.[1].trim() || '';
}

function hasActionableGuidance(body) {
  return hasAffirmativeContent(body) && (/```[\s\S]*?\S[\s\S]*?```/.test(body) || /^(?:run|install|use|execute|invoke|open|start|try)\b/im.test(body));
}

function hasAffirmativeContent(body) {
  if (!body) return false;
  const prose = body.replace(/```[\s\S]*?```/g, '').trim();
  return !/^(?:no|not|none|missing|unavailable)\b/i.test(prose || body.trim());
}
