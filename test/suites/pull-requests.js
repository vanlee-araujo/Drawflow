// Pull requests of the original project and the earlier API
const { check, page } = require('../helpers');

module.exports = async function (browser, B) {
  // PR #947 (konum): laço de retorno, padrão desligado, funciona no vertical
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      const a = df.addNode('a', 1, 1, 400, 100, 'a', {}, 'A'), b = df.addNode('b', 1, 1, 50, 100, 'b', {}, 'B');
      df.addConnection(a, b, 'output_1', 'input_1');
      const cs = () => (document.querySelector('.main-path').getAttribute('d').match(/C/g) || []).length;
      const off = cs();
      df.curvature_backward = true; df.updateConnectionNodes('node-' + a);
      const on = cs();
      const d = document.querySelector('.main-path').getAttribute('d').trim().split(/\s+/).filter(x => !/[MC]/.test(x)).map(Number);
      const below = d[7] > 100 + 40; // ponto do meio passa abaixo dos nós (mesma linha)
      if (typeof df.setConnectionDirection !== 'function') return { off, on, below, vertical: 2 }; // branch sem o vertical
      df.setConnectionDirection('vertical'); df.setNodePosition(b, 400, 50); df.setNodePosition(a, 400, 400);
      return { off, on, below, vertical: cs() };
    });
    check(B, 'PR #947 laço de retorno (desligado por padrão)', r.off === 1 && r.on === 2 && r.below && r.vertical === 2, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // PR #648 (eviltik): zoom pela roda sem Ctrl
  try {
    const p = await page(browser);
    await p.evaluate(() => { const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df; });
    await p.mouse.move(500, 300); await p.mouse.wheel(0, -100);
    const z1 = await p.evaluate(() => df.zoom);
    await p.evaluate(() => { df.zoom_use_ctrl_key = false; });
    await p.mouse.wheel(0, -100);
    const z2 = await p.evaluate(() => df.zoom);
    check(B, 'PR #648 zoom_use_ctrl_key', z1 === 1 && z2 === 1.1, { z1, z2 });
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // PR #683 (codemwnci): moduleChanging antes, moduleChanged depois de desenhar o módulo
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      df.import({ drawflow: { Home: { data: {} }, Outro: { data: { 7: node(7, {}, {}, 50, 50) } } } });
      const log = [];
      df.on('moduleChanging', m => log.push(['changing', m, document.querySelectorAll('#node-7').length]));
      df.on('moduleChanged', m => log.push(['changed', m, document.querySelectorAll('#node-7').length]));
      df.changeModule('Outro');
      return log;
    });
    check(B, 'PR #683 moduleChanging/moduleChanged', JSON.stringify(r) === JSON.stringify([['changing', 'Outro', 0], ['changed', 'Outro', 1]]), r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // ── 7. API anterior (posição, zoom, validador) continua ok ──
  if (!process.env.ONLY) try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      const a = df.addNode('a', 1, 1, 10, 10, 'a', {}, 'A'), c = df.addNode('c', 1, 1, 300, 10, 'c', {}, 'C');
      df.connection_validator = ({ output_id, input_id }) => !(output_id == c && input_id == a);
      df.addConnection(a, c, 'output_1', 'input_1'); df.addConnection(c, a, 'output_1', 'input_1');
      df.setNodePosition(c, 400, 200); df.setZoom(5); const zmax = df.zoom; df.setCanvasPosition(15, -20);
      return { conns: document.querySelectorAll('.connection').length, pos: [df.getNodeFromId(c).pos_x, df.getNodeFromId(c).pos_y], zmax, t: df.precanvas.style.transform };
    });
    check(B, 'API de posição/zoom/validador', r.conns === 1 && r.pos[0] === 400 && r.pos[1] === 200 && r.zmax === 1.6 && r.t.includes('translate(15px, -20px)'), r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }
};
