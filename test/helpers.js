// Shared helpers of the browser tests: results, page with Drawflow loaded, pixels and drag
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.env.DIST || path.join(ROOT, 'dist');

const results = [];
const check = (browser, name, ok, info = '') => results.push({ browser, name, ok: !!ok, info: ok ? '' : JSON.stringify(info) });

async function page(browser, html = '<div id="d" style="width:1000px;height:700px;position:relative"></div>') {
  const p = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  p.setDefaultTimeout(5000); // nos branches parciais, recursos ausentes falham rápido
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await p.goto('file://' + path.join(ROOT, 'test/blank.html'));
  await p.evaluate(h => { document.body.innerHTML = h; }, html);
  await p.addStyleTag({ path: DIST + '/drawflow.min.css' });
  await p.addScriptTag({ path: DIST + '/drawflow.min.js' });
  await p.evaluate(() => {
    window.node = (id, inputs, outputs, x, y, extra = {}) => ({ id, name: 'n' + id, data: {}, class: 'n', html: 'N' + id, typenode: false, inputs, outputs, pos_x: x, pos_y: y, ...extra });
  });
  return p;
}

// cor do pixel na tela (via screenshot), em coordenadas da página
async function pixel(p, x, y) {
  const png = await p.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: 1, height: 1 } });
  return await p.evaluate(async b64 => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 1;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    return Array.from(g.getImageData(0, 0, 1, 1).data.slice(0, 3));
  }, png.toString('base64'));
}
const near = (a, b, tol = 40) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
const STEEL = [70, 130, 180], SELECTED = [67, 185, 147];

async function drag(p, from, to) {
  const o = await p.locator(from).boundingBox(), i = await p.locator(to).boundingBox();
  await p.mouse.move(o.x + o.width / 2, o.y + o.height / 2); await p.mouse.down();
  await p.mouse.move(i.x + i.width / 2, i.y + i.height / 2, { steps: 8 });
  return async () => { await p.mouse.up(); };
}

module.exports = { results, check, page, pixel, near, drag, STEEL, SELECTED, ROOT, DIST };
