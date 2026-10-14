import fs from 'node:fs';
import path from 'node:path';

const lcovPath = path.resolve('coverage/lcov.info');
if (fs.existsSync(lcovPath)) {
  let content = fs.readFileSync(lcovPath, 'utf-8');
  // Replace Windows backslashes in SF: entries with forward slashes
  content = content.replace(/^SF:(.*)$/gm, (match, p1) => `SF:${p1.replace(/\\/g, '/')}`);
  fs.writeFileSync(lcovPath, content, 'utf-8');
  console.log('Normalized coverage/lcov.info paths to forward slashes for SonarQube');
}
