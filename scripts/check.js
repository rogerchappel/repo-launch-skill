import fs from 'node:fs';
const required = ['README.md', 'SKILL.md', 'docs/PRD.md', 'docs/TASKS.md', 'docs/ORCHESTRATION.md', 'bin/repo-launch-skill.js'];
const missing = required.filter(file => !fs.existsSync(file));
if (missing.length) { console.error('Missing required files: ' + missing.join(', ')); process.exit(1); }
console.log('check ok');
