const fs = require('fs');
const path = 'dist-web/index.html';

if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  if (content.includes('src="/assets/') || content.includes('href="/assets/')) {
    console.error('❌ Absolute /assets/ found in dist-web/index.html');
    process.exit(1);
  }
}
console.log('✅ Relative assets OK');