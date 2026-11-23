import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['src', 'domain', 'public', 'tests', 'scripts'];
const files = [];
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) scan(path);
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(path);
  }
}
for (const root of roots) scan(root);
if (files.length === 0) throw new Error('No JavaScript files found');
let errors = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    errors++;
    console.error(`FAIL: ${file}`);
    console.error(result.stderr || result.stdout);
  }
}
if (errors) {
  console.error(`Syntax check failed in ${errors}/${files.length} files`);
  process.exit(1);
}
console.log(`PASS: checked syntax of ${files.length} JavaScript files`);
