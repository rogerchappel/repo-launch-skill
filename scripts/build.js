import { createLaunchPlan } from '../src/index.js';
const plan = createLaunchPlan({ name: 'smoke', description: 'A local launch planner.', features: ['Plans', 'Checks'], verification: ['npm test'], safety: ['Dry run only'] }, '# Usage\nExample\nSafety\nnpm test');
if (plan.readiness.score < 80) throw new Error('Expected passing readiness');
console.log('build ok');
