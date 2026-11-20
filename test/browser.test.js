// Browser tests in Chromium, Firefox and WebKit: npm run build && npm test
// Each suite in test/suites/ receives the browser and its name; ONLY=1 skips the blocks marked with it
const pw = require('playwright');
const { results, check } = require('./helpers');

const SUITES = ['drawing', 'upstream', 'features', 'pull-requests', 'node-tools', 'pages'].map(name => require('./suites/' + name));

async function run(name) {
  const browser = await pw[name].launch();
  for (const suite of SUITES) {
    await suite(browser, name);
  }
  await browser.close();
}

(async () => {
  for (const b of ['chromium', 'firefox', 'webkit']) {
    try { await run(b); } catch (e) { check(b, 'execução', false, e.message.split('\n')[0]); }
  }
  const bad = results.filter(r => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FALHA'} [${r.browser}] ${r.name} ${r.info}`);
  console.log(`\n${results.length - bad.length}/${results.length} ok`);
  process.exit(bad.length ? 1 : 0);
})();
