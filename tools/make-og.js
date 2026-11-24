// Genera assets/og-image.png a partir de tools/og-image.html (requiere Playwright).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.join(__dirname, 'og-image.html'), { waitUntil: 'networkidle' });
  await p.screenshot({ path: path.join(__dirname, '..', 'assets', 'og-image.png'), type: 'png' });
  await b.close();
  console.log('OK → assets/og-image.png');
})();
