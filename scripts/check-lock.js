import { readFileSync, existsSync } from 'node:fs';

const path = 'package-lock.json';
if (!existsSync(path)) {
  console.error('Missing package-lock.json. Run npm install locally and commit package-lock.json.');
  process.exit(1);
}
let manifest, lock;
try {
  manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  lock = JSON.parse(readFileSync(path, 'utf8'));
} catch (error) {
  console.error(`Cannot read package manifests: ${error.message}`);
  process.exit(1);
}
const locked = lock.packages?.['']?.dependencies || {};
let mismatch = false;
for (const [name, version] of Object.entries(manifest.dependencies || {})) {
  if (locked[name] !== version) {
    console.error(`Dependency not synchronized: ${name} package.json=${version} lock=${locked[name] ?? '(missing)'}`);
    mismatch = true;
  }
}
if (mismatch) {
  console.error('Run npm install and commit the updated package-lock.json.');
  process.exit(1);
}
console.log('PASS: package-lock.json matches direct production dependencies');
