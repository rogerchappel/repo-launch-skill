const EXECUTABLE_COMMAND = /^(?:npm\s+(?:test|run\s+[\w:.-]+)|npx\s+[\w@/.-]+|pytest(?:\s|$)|python(?:3)?\s+-m\s+pytest(?:\s|$)|go\s+test(?:\s|$)|cargo\s+test(?:\s|$))/i;

export function isExecutableVerificationCommand(value) {
  return typeof value === 'string' && EXECUTABLE_COMMAND.test(value.trim());
}

export function hasExecutableVerificationCommand(values) {
  return Array.isArray(values) && values.some(isExecutableVerificationCommand);
}
