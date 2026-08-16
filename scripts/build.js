import { createLaunchPlan } from '../src/index.js';
const readme = '# Usage\n\nRun the local check:\n\n```bash\nnpm test\n```\n\n## Examples\n\nThe fixture demonstrates a local plan.\n\n## Safety\n\nDry run only.';
const plan = createLaunchPlan({ name: 'smoke', description: 'A local launch planner.', features: ['Plans', 'Checks'], verification: ['npm test'], safety: ['Dry run only'] }, readme);
if (plan.readiness.score < 80) throw new Error('Expected passing readiness');
console.log('build ok');
