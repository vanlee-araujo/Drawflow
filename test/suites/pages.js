// Example pages: open from the disk, without requests outside the project and without script errors
const path = require('path');
const { check, ROOT } = require('../helpers');

const PAGES = ['index.html', 'docs/index.html', 'docs/playground.html'];

module.exports = async function (browser, B) {
  for (const name of PAGES) {
    try {
      const p = await browser.newPage({ viewport: { width: 1200, height: 800 } });
      const external = [];
      const errors = [];
      p.on('request', request => {
        const url = request.url();
        if (!url.startsWith('file://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          external.push(url);
        }
      });
      p.on('pageerror', e => errors.push(e.message));
      await p.goto('file://' + path.join(ROOT, name), { waitUntil: 'load' });
      const nodes = await p.evaluate(() => document.querySelectorAll('.drawflow-node').length);
      check(B, `página ${name} sem CDN e sem erros`, external.length === 0 && errors.length === 0 && nodes > 0, { external, errors, nodes });
      await p.close();
    } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }
  }
};
