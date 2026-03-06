const puppeteer = require('puppeteer');
const path = require('path');

const CHARTS = [
  'market-growth',
  'competitive-matrix',
  'architecture',
  'anxiety-cycle',
  'roadmap'
];
const IMG_DIR = path.join(__dirname, 'images');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 600, deviceScaleFactor: 2 });

  for (const chart of CHARTS) {
    const url = `http://localhost:8901/competition/charts/${chart}.html`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
      path: path.join(IMG_DIR, `chart-${chart}.png`),
      fullPage: true
    });
    console.log(`Captured: chart-${chart}`);
  }

  await browser.close();
  console.log('Done! All chart screenshots saved to', IMG_DIR);
})();
