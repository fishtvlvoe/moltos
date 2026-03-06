const puppeteer = require('puppeteer');
const path = require('path');

const SCREENS = ['dashboard', 'chat', 'insights', 'settings'];
const IMG_DIR = path.join(__dirname, 'images');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });

  await page.goto('http://localhost:8901/index.html', { waitUntil: 'networkidle0' });

  // Screenshot onboarding
  await page.waitForSelector('.screen.active');
  await page.screenshot({ path: path.join(IMG_DIR, 'screen-onboarding.png'), clip: { x: 0, y: 0, width: 430, height: 932 } });
  console.log('Captured: onboarding');

  // Go to dashboard via JS
  await page.evaluate(() => {
    document.querySelector('.screen.active').style.display = 'none';
    switchScreen('dashboard');
  });
  await new Promise(r => setTimeout(r, 500));

  for (const screen of SCREENS) {
    await page.evaluate((s) => switchTab(s), screen);
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(IMG_DIR, `screen-${screen}.png`), clip: { x: 0, y: 0, width: 430, height: 932 } });
    console.log(`Captured: ${screen}`);
  }

  await browser.close();
  console.log('Done! All screenshots saved to', IMG_DIR);
})();
