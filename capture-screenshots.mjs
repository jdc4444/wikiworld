import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'public', 'screenshots');

const LANDMARKS = [
  'Empire State Building',
  'Statue of Liberty',
  'Guggenheim Museum New York',
  'St Peters Basilica Rome',
  'Eiffel Tower',
  'Tokyo Tower',
  'Burj Khalifa',
  'Forbidden City',
  'Zocalo Mexico City',
  'Pyramid of the Sun Teotihuacan',
  'Great Pyramid of Giza',
  'Louvre',
  'CentralWorld Bangkok',
];

const VARIANTS = [
  { name: 'maplibre', url: '/providers/wikipedia.html' },
  { name: 'mapbox', url: '/providers/wikipedia-mapbox.html' },
  { name: 'arcgis', url: '/providers/wikipedia-arcgis.html' },
];

const PORT = 4174;
const BASE = `http://localhost:${PORT}`;

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
}

async function captureVariant(browser, variant) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log(`\n=== ${variant.name.toUpperCase()} ===`);
  await page.goto(`${BASE}${variant.url}`, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for map to render
  await sleep(8000);

  for (const landmark of LANDMARKS) {
    const slug = slugify(landmark);
    const filename = `${variant.name}-${slug}.jpg`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    console.log(`  Searching: ${landmark}...`);

    // Type into search and click Go
    await page.evaluate((q) => {
      const input = document.querySelector('input[type="text"]');
      const btn = document.querySelector('.search-row button') || document.querySelector('button');
      if (input) {
        input.value = q;
        input.dispatchEvent(new Event('input'));
      }
      if (btn) btn.click();
    }, landmark);

    // Wait for fly animation + tile loading
    await sleep(10000);

    await page.screenshot({ path: filepath, type: 'jpeg', quality: 85 });
    console.log(`  Saved: ${filename}`);
  }

  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--window-size=1400,1000',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
    ],
  });

  try {
    for (const variant of VARIANTS) {
      await captureVariant(browser, variant);
    }
    console.log('\nAll screenshots captured!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
