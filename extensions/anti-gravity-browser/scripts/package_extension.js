const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
const zipName = `anti-gravity-web-v${manifest.version}.zip`;
const zipPath = path.join(distDir, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`Packaging Anti-Gravity Web v${manifest.version} for Chrome Web Store...`);

// Files and folders to include in production CWS bundle
const includes = [
  'manifest.json',
  'background',
  'content',
  'lib',
  'popup',
  'assets/icon16.png',
  'assets/icon32.png',
  'assets/icon48.png',
  'assets/icon128.png',
  'PRIVACY_POLICY.md',
  'README.md'
];

try {
  // Use zip command with exclusion filters
  const cmd = `cd "${rootDir}" && zip -r "${zipPath}" ${includes.join(' ')} -x "*.DS_Store" "*__MACOSX*"`;
  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`\n🎉 Production Chrome Web Store Package Created!`);
  console.log(`📦 File: ${zipPath}`);
  console.log(`📊 Size: ${sizeKB} KB`);
  console.log(`✨ Status: Ready to upload to Chrome Web Store Developer Console!`);
} catch (err) {
  console.error('Packaging failed:', err);
  process.exit(1);
}
