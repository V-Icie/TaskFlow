// Once per local clone: create the correct Actions badge from the Git remote.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
const match = remote.match(/github\.com[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?\/?$/i);
if (!match) {
  console.error(`Cannot find GitHub owner/repo in origin remote: ${remote}`);
  process.exit(1);
}
const [, owner, repo] = match;
const url = `https://github.com/${owner}/${repo}/actions/workflows/ci.yml`;
const badge = `[![TaskFlow CI](${url}/badge.svg)](${url})`;
const path = 'README.md';
const readme = readFileSync(path, 'utf8');
const start = '<!-- CI_BADGE_START -->';
const end = '<!-- CI_BADGE_END -->';
if (!readme.includes(start) || !readme.includes(end)) {
  console.error('Badge markers were not found in README.md');
  process.exit(1);
}
const replacement = `${start}\n${badge}\n${end}`;
const updated = readme.replace(/<!-- CI_BADGE_START -->[\s\S]*?<!-- CI_BADGE_END -->/, replacement);
writeFileSync(path, updated, 'utf8');
console.log(`README badge configured for ${owner}/${repo}`);
