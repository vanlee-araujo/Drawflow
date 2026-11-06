// Browser tests in Chromium, Firefox and WebKit: npm run build && npm test
const fs = require('fs');
const path = require('path');
const pw = require('playwright');

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

async function run(name) {
  const browser = await pw[name].launch();
  const B = name;

  // ── 1. padrão: sem setas, curva horizontal igual à original ──
  if (!process.env.ONLY) try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      const a = df.addNode('a', 1, 1, 50, 100, 'a', {}, 'A'), b = df.addNode('b', 1, 1, 400, 100, 'b', {}, 'B');
      df.addConnection(a, b, 'output_1', 'input_1');
      const path = document.querySelector('.connection .main-path');
      return { markers: path.getAttribute('marker-end') || path.getAttribute('marker-start'), d: path.getAttribute('d'),
        expected: df.createCurvatureHorizontal(1, 2, 3, 4, 0.5, 'openclose') === df.createCurvature(1, 2, 3, 4, 0.5, 'openclose') };
    });
    check(B, 'padrão sem setas', r.markers === null, r);
    check(B, 'padrão: curva horizontal inalterada', r.expected, r);
    check(B, 'sem erros na página (padrão)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // ── 2. setas: fim, início, ambas; cor segue a linha (normal e selecionada) ──
  if (!process.env.ONLY) try {
    const p = await page(browser);
    await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d'));
      df.connection_arrow = 'end'; df.start(); window.df = df;
      window.a = df.addNode('a', 1, 1, 50, 100, 'a', {}, 'A'); window.b = df.addNode('b', 1, 1, 400, 100, 'b', {}, 'B');
      df.addConnection(a, b, 'output_1', 'input_1');
    });
    const geo = await p.evaluate(() => {
      const c = el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
      return { inp: c(document.querySelector('#node-2 .input_1')), out: c(document.querySelector('#node-1 .output_1')) };
    });
    const attrs = await p.evaluate(() => { const x = document.querySelector('.main-path'); return [x.getAttribute('marker-start'), x.getAttribute('marker-end')]; });
    check(B, "seta 'end': só marker-end", !attrs[0] && attrs[1] && attrs[1].startsWith('url(#drawflow-arrow-'), attrs);
    // ponta fica 12px antes do centro da entrada; seta de 14px entre 12 e 26px; amostra a 21px, fora da linha (y±3.5)
    const body = await pixel(p, geo.inp.x - 21, geo.inp.y - 3.5);
    check(B, 'seta desenhada antes da porta, cor da linha', near(body, STEEL), body);
    await p.evaluate(() => document.querySelector('.main-path').classList.add('selected'));
    const sel = await pixel(p, geo.inp.x - 21, geo.inp.y - 3.5);
    // WebKit não tem context-stroke: a seta fica na cor de reserva do CSS (.drawflow-arrow { fill })
    const ctx = await p.evaluate(() => CSS.supports('fill', 'context-stroke'));
    check(B, ctx ? 'seta muda junto com a linha selecionada' : 'sem context-stroke: seta na cor de reserva', near(sel, ctx ? SELECTED : STEEL), sel);
    await p.evaluate(() => document.querySelector('.main-path').classList.remove('selected'));

    await p.evaluate(() => df.setConnectionArrow('start'));
    const s = await p.evaluate(() => { const x = document.querySelector('.main-path'); return [x.getAttribute('marker-start'), x.getAttribute('marker-end')]; });
    check(B, "seta 'start': só marker-start", s[0] && !s[1], s);
    const startBody = await pixel(p, geo.out.x + 21, geo.out.y - 3.5);
    check(B, "seta 'start' desenhada junto da saída", near(startBody, STEEL), startBody);
    const noEnd = await pixel(p, geo.inp.x - 21, geo.inp.y - 3.5);
    check(B, "seta 'start': nada junto da entrada", !near(noEnd, STEEL, 25), noEnd);

    await p.evaluate(() => df.setConnectionArrow('both', 18, 12));
    const both = await p.evaluate(() => { const x = document.querySelector('.main-path'); return [x.getAttribute('marker-start'), x.getAttribute('marker-end'), document.querySelector('marker').getAttribute('markerWidth')]; });
    check(B, "seta 'both' e tamanho novo", both[0] && both[1] && both[2] === '18', both);
    await p.evaluate(() => df.setConnectionArrow('none'));
    const none = await p.evaluate(() => { const x = document.querySelector('.main-path'); return [x.getAttribute('marker-start'), x.getAttribute('marker-end')]; });
    check(B, "seta 'none' remove", !none[0] && !none[1], none);

    // linha sendo arrastada também tem seta
    await p.evaluate(() => df.setConnectionArrow('end'));
    const release = await drag(p, '#node-2 .output_1', '#node-1 .drawflow_content_node');
    const dragging = await p.evaluate(() => [...document.querySelectorAll('.connection')].pop().querySelector('.main-path').getAttribute('marker-end'));
    check(B, 'seta na linha durante o arrasto', !!dragging, dragging);
    await release();
    check(B, 'sem erros na página (setas)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // ── 3. direção vertical ──
  if (!process.env.ONLY) try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d'));
      df.connection_direction = 'vertical'; df.connection_arrow = 'end'; df.start(); window.df = df;
      const a = df.addNode('a', 1, 2, 300, 60, 'a', {}, 'A'), b = df.addNode('b', 2, 1, 250, 330, 'b', {}, 'B');
      df.addConnection(a, b, 'output_1', 'input_1');
      const c = el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
      const nb = document.getElementById('node-' + b).getBoundingClientRect(), na = document.getElementById('node-' + a).getBoundingClientRect();
      const inp = c(document.querySelector(`#node-${b} .input_1`)), out = c(document.querySelector(`#node-${a} .output_1`));
      const inp2 = c(document.querySelector(`#node-${b} .input_2`)), out2 = c(document.querySelector(`#node-${a} .output_2`));
      const n = document.querySelector('.main-path').getAttribute('d').trim().split(/[\sMC]+/).filter(Boolean).map(Number);
      return { vertical: document.getElementById('d').classList.contains('drawflow-vertical'),
        inTop: inp.y - nb.top, outBottom: out.y - na.bottom, inRow: Math.abs(inp.y - inp2.y), outRow: Math.abs(out.y - out2.y),
        inInside: inp.x > nb.left && inp.x < nb.right, d: n };
    });
    check(B, 'vertical: classe no container', r.vertical, r);
    check(B, 'vertical: entradas na borda de cima', Math.abs(r.inTop) <= 2 && r.inRow < 1 && r.inInside, r);
    check(B, 'vertical: saídas na borda de baixo', Math.abs(r.outBottom) <= 2 && r.outRow < 1, r);
    // M x0 y0 C c1x c1y c2x c2y x y: sai e chega na vertical (x do controle = x da ponta)
    const [x0, , c1x, c1y, c2x, c2y, x1] = r.d;
    check(B, 'vertical: curva sai e chega na vertical', x0 === c1x && c2x === x1 && c1y > r.d[1] && c2y < r.d[7], r.d);
    await p.evaluate(() => df.setConnectionDirection('horizontal'));
    const h = await p.evaluate(() => [document.getElementById('d').classList.contains('drawflow-vertical'), document.querySelector('.main-path').getAttribute('d')]);
    const hn = h[1].trim().split(/[\sMC]+/).filter(Boolean).map(Number);
    check(B, 'volta para horizontal', !h[0] && hn[1] === hn[3] && hn[5] === hn[7], h);
    check(B, 'sem erros na página (vertical)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // ── 4. reroute: o primeiro trecho sai da saída e o último entra na entrada, nos dois lados ──
  if (!process.env.ONLY) try {
  for (const fix of [false, true]) {
    const p = await page(browser);
    const r = await p.evaluate(fix => {
      const df = new Drawflow(document.getElementById('d'));
      df.reroute = true; df.reroute_fix_curvature = fix; df.connection_arrow = 'both'; df.start(); window.df = df;
      df.import({ drawflow: { Home: { data: {
        1: { id: 1, name: 'a', data: {}, class: 'a', html: 'A', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1', points: [{ pos_x: 300, pos_y: 300 }] }] } }, pos_x: 50, pos_y: 100 },
        2: { id: 2, name: 'b', data: {}, class: 'b', html: 'B', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: {}, pos_x: 500, pos_y: 100 } } } } });
      const out = [];
      for (const moved of ['node-1', 'node-2']) {
        df.updateConnectionNodes(moved);
        const paths = [...document.querySelectorAll('.connection .main-path')];
        const first = paths[0].getAttribute('d').trim().split(/\s+/), last = paths[paths.length - 1].getAttribute('d').trim().split(/\s+/);
        const c = el => { const r = el.getBoundingClientRect(), pr = document.querySelector('.drawflow').getBoundingClientRect(); return [r.x + r.width / 2 - pr.x, r.y + r.height / 2 - pr.y]; };
        const o = c(document.querySelector('#node-1 .output_1')), i = c(document.querySelector('#node-2 .input_1'));
        const start = [Number(first[1]), Number(first[2])], end = [Number(last[last.length - 2]), Number(last[last.length - 1])];
        out.push({ moved, paths: paths.length, startOk: Math.hypot(start[0] - o[0], start[1] - o[1]) < 1, endOk: Math.hypot(end[0] - i[0], end[1] - i[1]) < 1,
          ms: paths[0].getAttribute('marker-start'), me: paths[paths.length - 1].getAttribute('marker-end') });
      }
      return out;
    }, fix);
    for (const x of r) check(B, `reroute fix=${fix} (${x.moved}): começo na saída, fim na entrada, setas nas pontas`, x.startOk && x.endOk && x.ms && x.me, x);
    check(B, `sem erros na página (reroute fix=${fix})`, p.errors.length === 0, p.errors);
    await p.close();
    }
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // ── 5. correções pontuais: CSS.escape (rni-l) e ✕ (urre) ──
  if (!process.env.ONLY) try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      let err = null;
      try {
        df.import({ drawflow: { Home: { data: { 1: { id: 1, name: 'w', data: { test: { 'aaa,a': 'v1', 'aaa|a': 'v2' }, 'x y': 'v3' }, class: 'w',
          html: '<input df-test-aaa,a><input df-test-aaa|a><input df-x y>', typenode: false, inputs: {}, outputs: {}, pos_x: 50, pos_y: 50 } } } } });
      } catch (e) { err = e.message; }
      const ins = document.querySelectorAll('#node-1 input');
      return { err, v: [...ins].map(i => i.value) };
    });
    check(B, 'chaves com , e | no import (rni-l)', !r.err && r.v[0] === 'v1' && r.v[1] === 'v2', r);
    // nó próprio: sem a correção do rni-l o import acima falha e não cria o nó
    await p.evaluate(() => { if (!document.getElementById('node-1')) df.addNode('x', 1, 1, 50, 50, 'x', {}, 'X'); });
    await p.click('#node-1', { button: 'right' });
    const x = await p.evaluate(() => document.querySelector('.drawflow-delete')?.textContent);
    check(B, 'botão de apagar com ✕ (urre)', x === '✕', x);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // ── 6. mofolo: destaque do destino, encaixe com force_first_input, classes por tipo de nó ──
  if (!process.env.ONLY) try {
    const p = await page(browser);
    await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.force_first_input = true; df.start(); window.df = df;
      window.a = df.addNode('a', 0, 1, 50, 100, 'query  main', {}, 'A');
      window.c = df.addNode('c', 0, 1, 50, 400, '', {}, 'C');
      // nó importado só com input_3: o encaixe usa a primeira entrada que existe, não input_1
      const data = df.export();
      data.drawflow.Home.data[3] = { id: 3, name: 'b', data: {}, class: 'cond', html: 'B', typenode: false,
        inputs: { input_3: { connections: [] } }, outputs: { output_1: { connections: [] } }, pos_x: 450, pos_y: 100 };
      df.import(data);
      window.b = 3;
    });
    const release = await drag(p, '#node-1 .output_1', '#node-3 .drawflow_content_node');
    const during = await p.evaluate(() => document.getElementById('node-3').classList.contains('connection-target'));
    await release();
    const r = await p.evaluate(() => ({
      after: document.querySelectorAll('.connection-target').length,
      conns: df.getNodeFromId(a).outputs.output_1.connections,
      svgClasses: [...document.querySelector('.connection').classList],
      outClasses: [...document.querySelector('#node-1 .output_1').classList],
      emptyClassOut: [...document.querySelector('#node-2 .output_1').classList],
    }));
    check(B, 'destaque no nó de destino durante o arrasto', during, r);
    check(B, 'destaque some ao soltar', r.after === 0, r);
    check(B, 'encaixa na primeira entrada existente (input_3)', r.conns.length === 1 && r.conns[0].output === 'input_3', r.conns);
    check(B, 'ligação recebe classes do nó de origem', r.svgClasses.includes('connection-query') && r.svgClasses.includes('connection-main') && r.svgClasses[1].startsWith('node_in_') && r.svgClasses[4] === 'input_3', r.svgClasses);
    check(B, 'porta de saída recebe as classes', r.outClasses.join(' ') === 'output output_1 connection-query connection-main', r.outClasses);
    check(B, 'nó sem classe não ganha classe vazia', r.emptyClassOut.join(' ') === 'output output_1', r.emptyClassOut);
    const imp = await p.evaluate(() => { const data = df.export(); df.clear(); df.import(data); return [...document.querySelector('.connection').classList]; });
    check(B, 'classes mantidas no export/import', imp.includes('connection-query') && imp.includes('connection-main'), imp);

    // sem force_first_input: soltar no corpo cancela e não destaca
    await p.evaluate(() => { df.force_first_input = false; });
    const rel2 = await drag(p, '#node-2 .output_1', '#node-3 .drawflow_content_node');
    const d2 = await p.evaluate(() => document.querySelectorAll('.connection-target').length);
    await rel2();
    const c2 = await p.evaluate(() => df.getNodeFromId(c).outputs.output_1.connections.length);
    check(B, 'sem force_first_input: sem destaque e sem ligação no corpo', d2 === 0 && c2 === 0, { d2, c2 });
    // sobre a entrada: destaca e liga
    const rel3 = await drag(p, '#node-2 .output_1', '#node-3 .input_3');
    const d3 = await p.evaluate(() => document.getElementById('node-3').classList.contains('connection-target'));
    await rel3();
    const c3 = await p.evaluate(() => df.getNodeFromId(c).outputs.output_1.connections.length);
    check(B, 'sobre a entrada: destaca e liga', d3 && c3 === 1, { d3, c3 });
    check(B, 'sem erros na página (mofolo)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // ── 8. issues do upstream ──

  // #535 / #512: ids numéricos no JSON → apagar um nó removia a ligação errada
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      const out = o => ({ output_1: { connections: o } });
      df.import({ drawflow: { Home: { data: {
        2: node(2, {}, out([{ node: 5, output: 'input_1' }]), 50, 50),
        3: node(3, {}, out([{ node: 5, output: 'input_1' }]), 50, 200),
        4: node(4, {}, out([{ node: 5, output: 'input_1' }]), 50, 350),
        5: node(5, { input_1: { connections: [{ node: 2, input: 'output_1' }, { node: 3, input: 'output_1' }, { node: 4, input: 'output_1' }] } }, {}, 400, 200) } } } });
      df.removeNodeId('node-3');
      const e = df.export().drawflow.Home.data;
      const viaImport = e[5].inputs.input_1.connections.map(c => c.node);
      // mesmo sem passar pelo import: id numérico gravado direto nos dados
      df.drawflow.drawflow.Home.data[5].inputs.input_1.connections.forEach(c => { c.node = Number(c.node); });
      df.drawflow.drawflow.Home.data[2].outputs.output_1.connections.forEach(c => { c.node = Number(c.node); });
      df.removeNodeId('node-4');
      const direct = df.export().drawflow.Home.data[5].inputs.input_1.connections.map(c => String(c.node));
      return { viaImport, direct, out2: df.export().drawflow.Home.data[2].outputs.output_1.connections.length };
    }).catch(e => ({ err: e.message }));
    check(B, '#535 apagar nó remove só as ligações dele (import)', r.viaImport && r.viaImport.join() === '2,4', r);
    check(B, '#535 ids numéricos nos dados: remove a ligação certa', r.direct && r.direct.join() === '2' && r.out2 === 1, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #946: ligação duplicada no JSON → evento em dobro e export perdendo outra ligação
  try {
    const p = await page(browser);
    const data = fs.readFileSync(path.join(ROOT, 'test/issue946.json'), 'utf8');
    const r1 = await p.evaluate(json => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df; window.removed = 0;
      df.on('connectionRemoved', () => window.removed++);
      df.import(JSON.parse(json));
      const d = df.export().drawflow.Home.data;
      return { out1: d[1].outputs.output_1.connections.length, svgs: document.querySelectorAll('.connection').length };
    }, data);
    check(B, '#946 import remove ligações duplicadas', r1.out1 === 1 && r1.svgs === 2, r1);
    await p.locator('.connection.node_out_node-4 .main-path').click({ force: true });
    await p.keyboard.press('Delete');
    const r2 = await p.evaluate(() => {
      const d = df.export().drawflow.Home.data;
      return { removed, in12: d[12].inputs.input_1.connections.map(c => c.node), out1: d[1].outputs.output_1.connections.length, out4: d[4].outputs.output_1.connections.length };
    });
    check(B, '#946 apagar a 2ª ligação: evento uma vez, a 1ª continua no export', r2.removed === 1 && r2.in12.join() === '1' && r2.out1 === 1 && r2.out4 === 0, r2);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #469 / PR #141: classe extra no container não quebra o arrasto do canvas
  try {
    const p = await page(browser, '<div id="d" class="minha-classe" style="width:1000px;height:700px;position:relative"></div>');
    await p.evaluate(() => { const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df; df.addNode('a', 1, 1, 50, 50, 'a', {}, 'A'); });
    // move o canvas para a direita e arrasta de novo pela área do container que ficou exposta
    await p.mouse.move(600, 500); await p.mouse.down(); await p.mouse.move(900, 500, { steps: 4 }); await p.mouse.up();
    await p.mouse.move(100, 500); await p.mouse.down(); await p.mouse.move(150, 540, { steps: 4 }); await p.mouse.up();
    const t = await p.evaluate(() => df.precanvas.style.transform);
    check(B, '#469 container com classe própria: canvas arrasta', t.includes('translate(350px, 40px)'), t);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #899 / #442: ids como 5, '5' ou 'node-5' em todos os métodos
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      const a = df.addNode('a', 1, 1, 50, 50, 'a', {}, 'A'), b = df.addNode('b', 1, 1, 300, 50, 'b', {}, 'B');
      const errs = [];
      const t = f => { try { f(); } catch (e) { errs.push(e.message); } };
      t(() => df.addNodeInput('node-' + a));
      t(() => df.addNodeOutput(String(a)));
      t(() => df.addConnection('node-' + a, b, 'output_1', 'input_1'));
      const name = df.getNodeFromId('node-' + a).name;
      t(() => df.removeSingleConnection(a, 'node-' + b, 'output_1', 'input_1'));
      t(() => df.removeNodeId(b));
      return { errs, name, inputs: Object.keys(df.getNodeFromId(a).inputs).length, outputs: Object.keys(df.getNodeFromId(a).outputs).length,
        left: Object.keys(df.export().drawflow.Home.data), dom: document.querySelectorAll('.drawflow-node').length };
    });
    check(B, '#899/#442 ids aceitos nos três formatos', r.errs.length === 0 && r.name === 'a' && r.inputs === 2 && r.outputs === 2 && r.left.join() === '1' && r.dom === 1, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #883: zoom não passa dos limites
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      for (let i = 0; i < 15; i++) df.zoom_in();
      const max = df.zoom;
      for (let i = 0; i < 30; i++) df.zoom_out();
      return { max, min: df.zoom };
    });
    check(B, '#883 zoom fica exatamente em zoom_max e zoom_min', r.max === 1.6 && r.min === 0.5, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #808 / PR #260: saídas não sequenciais no import
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      let err = null;
      try {
        df.import({ drawflow: { Home: { data: {
          1: node(1, {}, { output_2: { connections: [] }, output_4: { connections: [{ node: '2', output: 'input_1' }] } }, 50, 50),
          2: node(2, { input_1: { connections: [{ node: '1', input: 'output_4' }] } }, {}, 400, 50) } } } });
      } catch (e) { err = e.message; }
      return { err, outs: [...document.querySelectorAll('#node-1 .output')].map(o => o.classList[1]), d: document.querySelector('.connection .main-path')?.getAttribute('d') };
    }).catch(e => ({ err: e.message }));
    check(B, '#808 import com output_2/output_4', !r.err && r.outs && r.outs.join() === 'output_2,output_4' && r.d && r.d.trim().startsWith('M'), r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #783: checkbox e radio no import e na edição
  try {
    const p = await page(browser);
    await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      df.import({ drawflow: { Home: { data: { 1: node(1, {}, {}, 50, 50, { data: { ativo: true, cor: 'b' },
        html: '<input type="checkbox" df-ativo><input type="radio" name="c" value="a" df-cor><input type="radio" name="c" value="b" df-cor>' }) } } } });
    });
    const r1 = await p.evaluate(() => [...document.querySelectorAll('#node-1 input')].map(i => i.checked));
    await p.click('#node-1 input[type=checkbox]');
    const r2 = await p.evaluate(() => df.export().drawflow.Home.data[1].data.ativo);
    check(B, '#783 checkbox/radio marcados no import', r1.join() === 'true,false,true', r1);
    check(B, '#783 desmarcar grava false (booleano)', r2 === false, r2);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #443 / #857: arrasto continua fora do container e solta fora
  try {
    const p = await page(browser, '<div id="d" style="width:500px;height:400px;position:relative"></div>');
    await p.evaluate(() => { const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df; });
    await p.mouse.move(300, 300); await p.mouse.down();
    await p.mouse.move(800, 600, { steps: 6 });
    const during = await p.evaluate(() => df.precanvas.style.transform);
    await p.mouse.up();
    await p.mouse.move(350, 350, { steps: 4 }); // volta sem botão: não pode arrastar
    const after = await p.evaluate(() => [df.precanvas.style.transform, df.editor_selected]);
    check(B, '#443 canvas segue o mouse fora do container', during.includes('translate(500px, 300px)'), during);
    check(B, '#857 soltar fora encerra o arrasto', after[0].includes('translate(500px, 300px)') && after[1] === false, after);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #914 / #938: nó muda de tamanho depois do import → ligação acompanha
  try {
    const p = await page(browser);
    await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      df.import({ drawflow: { Home: { data: {
        1: node(1, {}, { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, 50, 50),
        2: node(2, { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, {}, 400, 50, { html: '<div id="grow">B</div>' }) } } } });
    });
    // conteúdo chega depois (fonte, imagem, framework): a entrada desce junto com o centro do nó
    await p.evaluate(() => { document.getElementById('grow').style.height = '300px'; document.querySelector('#node-2 .inputs').style.marginTop = '200px'; });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const d = document.querySelector('.connection .main-path').getAttribute('d').trim().split(/\s+/);
      const ir = document.querySelector('#node-2 .input_1').getBoundingClientRect(), pr = df.precanvas.getBoundingClientRect();
      return { endY: Number(d[d.length - 1]), inputY: ir.y + ir.height / 2 - pr.y };
    });
    check(B, '#914 ligação acompanha nó que mudou de tamanho', Math.abs(r.endY - r.inputY) < 1, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #813: start() duas vezes não duplica canvas nem eventos
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start(); df.clear(); df.start();
      let n = 0; df.on('nodeCreated', () => n++);
      df.addNode('a', 1, 1, 50, 50, 'a', {}, 'A');
      return { canvases: document.querySelectorAll('.drawflow').length, created: n };
    });
    check(B, '#813 start() de novo não duplica', r.canvases === 1 && r.created === 1, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #446: Delete apaga a ligação já no primeiro clique
  try {
    const p = await page(browser);
    await p.evaluate(() => { const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      df.addNode('a', 1, 1, 50, 100, 'a', {}, 'A'); df.addNode('b', 1, 1, 400, 100, 'b', {}, 'B'); df.addConnection(1, 2, 'output_1', 'input_1'); });
    await p.locator('.connection .main-path').click({ force: true });
    await p.keyboard.press('Delete');
    const n = await p.evaluate(() => document.querySelectorAll('.connection').length);
    check(B, '#446 Delete no primeiro clique', n === 0, n);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // #222 / #516: import sem 'Home'; remover o módulo em tela
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      let err = null;
      try { df.import({ drawflow: { Principal: { data: { 1: node(1, {}, {}, 50, 50) } }, Outro: { data: { 2: node(2, {}, {}, 50, 50) } } } }); } catch (e) { err = e.message; }
      const first = [df.module, document.querySelectorAll('.drawflow-node').length];
      df.removeModule('Principal');
      return { err, first, after: [df.module, document.querySelector('.drawflow-node')?.id, Object.keys(df.export().drawflow)] };
    }).catch(e => ({ err: e.message }));
    check(B, '#222 import sem Home mostra o primeiro módulo', !r.err && r.first && r.first[0] === 'Principal' && r.first[1] === 1, r);
    check(B, '#516 remover o módulo em tela troca para outro', r.after && r.after[0] === 'Outro' && r.after[1] === 'node-2' && r.after[2].join() === 'Outro', r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // clear() em outro módulo: volta para 'Home' e o editor continua utilizável
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      df.addModule('Outro'); df.changeModule('Outro');
      df.addNode('a', 1, 1, 50, 50, 'a', {}, 'A');
      df.clear();
      let err = null;
      try { df.addNode('b', 1, 1, 50, 50, 'b', {}, 'B'); } catch (e) { err = e.message; }
      const res = { err, module: df.module, modules: Object.keys(df.export().drawflow), nodes: Object.keys(df.export().drawflow.Home.data).length };
      // trocar de módulo continua desenhando o módulo escolhido
      df.addModule('Outro'); df.changeModule('Outro'); df.addNode('c', 1, 1, 50, 50, 'c', {}, 'C');
      df.changeModule('Home'); df.changeModule('Outro');
      res.outro = [df.module, [...document.querySelectorAll('.drawflow-node')].map(n => n.textContent.trim()).join()];
      return res;
    });
    check(B, 'clear() em outro módulo volta para Home', !r.err && r.module === 'Home' && r.modules.join() === 'Home' && r.nodes === 1, r);
    check(B, 'clear(): changeModule continua mostrando o módulo escolhido', r.outro && r.outro.join() === 'Outro,C', r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // zoomFit (#863, #821): tudo visível, inclusive posições negativas e fluxos maiores que zoom_min
  try {
    for (const origin of ['', '0 0']) {
      const p = await page(browser, '<div id="d" style="width:800px;height:500px;position:relative;margin:30px"></div>');
      const r = await p.evaluate(origin => {
        const df = new Drawflow(document.getElementById('d')); df.start();
        if (origin) df.precanvas.style.transformOrigin = origin; // como o hubDataGateway faz
        const ids = [df.addNode('a', 1, 1, -600, -300, 'a', {}, 'A'), df.addNode('b', 1, 1, 400, 200, 'b', {}, 'B'), df.addNode('c', 1, 1, 2600, 1700, 'c', {}, 'C')];
        df.addConnection(ids[0], ids[1], 'output_1', 'input_1'); df.addConnection(ids[1], ids[2], 'output_1', 'input_1');
        const res = df.zoomFit({ padding: 20, minZoom: 0.05 });
        const c = df.container.getBoundingClientRect();
        const inside = [...document.querySelectorAll('.drawflow-node, .input, .output')].every(e => { const b = e.getBoundingClientRect(); return b.left >= c.left + 19 && b.top >= c.top + 19 && b.right <= c.right - 19 && b.bottom <= c.bottom - 19; });
        // centrado: sobra igual dos dois lados no eixo que limita
        const nodes = [...document.querySelectorAll('.drawflow-node, .input, .output')].map(e => e.getBoundingClientRect());
        const l = Math.min(...nodes.map(b => b.left)) - c.left, rgt = c.right - Math.max(...nodes.map(b => b.right));
        const t = Math.min(...nodes.map(b => b.top)) - c.top, btm = c.bottom - Math.max(...nodes.map(b => b.bottom));
        const single = (() => { df.clear(); df.addNode('x', 1, 1, 100, 100, 'x', {}, 'X'); return df.zoomFit(); })();
        return { zoom: res.zoom, belowMin: res.zoom < df.zoom_min, inside, centered: Math.abs(l - rgt) < 2 || Math.abs(t - btm) < 2, single: single.zoom };
      }, origin);
      check(B, 'zoomFit mostra tudo' + (origin ? ' (transform-origin 0 0)' : ''), r.inside && r.belowMin && r.centered && r.single === 1, r);
      await p.close();
    }
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // autoLayout (#781, #685, #759): camadas sem sobreposição, direção, reroute limpo, enquadrado
  try {
    const p = await page(browser);
    await p.addScriptTag({ path: require.resolve('@dagrejs/dagre/dist/dagre.min.js') });
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.reroute = true; df.start();
      // tudo empilhado no mesmo lugar, como num import sem posições
      const a = df.addNode('a', 1, 2, 0, 0, 'a', {}, 'A'), b = df.addNode('b', 1, 1, 0, 0, 'b', {}, 'B');
      const c = df.addNode('c', 1, 1, 0, 0, 'c', {}, 'C'), d = df.addNode('d', 2, 1, 0, 0, 'd', {}, 'D');
      df.addConnection(a, b, 'output_1', 'input_1'); df.addConnection(a, c, 'output_2', 'input_1');
      df.addConnection(b, d, 'output_1', 'input_1'); df.addConnection(c, d, 'output_1', 'input_2');
      df.drawflow.drawflow.Home.data[a].outputs.output_1.connections[0].points = [{ pos_x: 999, pos_y: 999 }];
      let err = null; try { df.autoLayout(null); } catch (e) { err = e.message; }
      const pos = df.autoLayout(dagre, { fit: false });
      const rects = [...document.querySelectorAll('.drawflow-node')].map(e => e.getBoundingClientRect());
      const overlap = rects.some((x, i) => rects.some((y, j) => i < j && x.left < y.right && y.left < x.right && x.top < y.bottom && y.top < x.bottom));
      const lr = pos[a].pos_x < pos[b].pos_x && pos[b].pos_x < pos[d].pos_x && pos[b].pos_y < pos[c].pos_y; // saída 1 acima da saída 2
      const points = document.querySelectorAll('.point').length + (df.export().drawflow.Home.data[a].outputs.output_1.connections[0].points ? 1 : 0);
      const data = df.getNodeFromId(d).pos_x === pos[d].pos_x;
      df.connection_direction = 'vertical';
      const v = df.autoLayout(dagre);
      const c2 = df.container.getBoundingClientRect();
      const visible = [...document.querySelectorAll('.drawflow-node')].every(e => { const x = e.getBoundingClientRect(); return x.left >= c2.left && x.right <= c2.right && x.top >= c2.top && x.bottom <= c2.bottom; });
      return { err, overlap, lr, points, data, tb: v[a].pos_y < v[b].pos_y && v[b].pos_y < v[d].pos_y, visible };
    });
    check(B, 'autoLayout exige o dagre', r.err && r.err.includes('needs dagre'), r);
    check(B, 'autoLayout em camadas, sem sobreposição, na ordem das saídas', !r.overlap && r.lr && r.data, r);
    check(B, 'autoLayout remove pontos de reroute', r.points === 0, r);
    check(B, 'autoLayout vertical e enquadrado', r.tb && r.visible, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // Proteção, travar, selecionar, grade, limites, multisseleção
  try {
    const p = await page(browser);
    await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.multiselect = true; df.start(); window.df = df;
      df.addNode('a', 1, 1, 50, 50, 'a', {}, 'A'); df.addNode('b', 1, 1, 350, 50, 'b', {}, 'B'); df.addNode('c', 1, 1, 50, 300, 'c', {}, 'C');
      df.addConnection(1, 2, 'output_1', 'input_1'); df.addConnection(1, 3, 'output_1', 'input_1');
    });
    const r = await p.evaluate(() => {
      const res = {};
      df.node_remove_validator = id => id !== '2';
      df.connection_remove_validator = c => c.input_id !== '3';
      res.blockedNode = df.removeNodeId(2) === false && !!document.getElementById('node-2');
      res.blockedConn = df.removeSingleConnection(1, 3, 'output_1', 'input_1') === false && document.querySelectorAll('.connection').length === 2;
      df.setNodeLocked(3); res.locked = [df.isNodeLocked('node-3'), document.getElementById('node-3').classList.contains('locked'), df.removeNodeId(3)];
      res.exported = df.export().drawflow.Home.data[3].locked === true;
      const data = df.export(); df.import(data); res.lockedImport = document.getElementById('node-3').classList.contains('locked');
      df.setNodeLocked(3, false);
      res.select = [df.selectNode(2), document.getElementById('node-2').classList.contains('selected'), df.getSelectedNodes().join()];
      df.centerNode(2); const c = df.container.getBoundingClientRect(), b = document.getElementById('node-2').getBoundingClientRect();
      res.center = [Math.abs(b.left + b.width / 2 - c.left - c.width / 2) < 2, Math.abs(b.top + b.height / 2 - c.top - c.height / 2) < 2];
      df.setCanvasPosition(0, 0); df.clearSelection(); df.node_remove_validator = null; df.connection_remove_validator = null;
      return res;
    });
    check(B, 'node_remove_validator', r.blockedNode, r);
    check(B, 'connection_remove_validator', r.blockedConn, r);
    check(B, 'travar nó', r.locked[0] && r.locked[1] && r.locked[2] === false && r.exported && r.lockedImport, r);
    check(B, 'selectNode', r.select.join() === 'true,true,2', r);
    check(B, 'centerNode', r.center.join() === 'true,true', r);
    // arrasto: travado não move; grade; limites
    const dragBy = async (sel, dx, dy) => { const b = await p.locator(sel).boundingBox(); await p.mouse.move(b.x + 60, b.y + 15); await p.mouse.down(); await p.mouse.move(b.x + 60 + dx, b.y + 15 + dy, { steps: 6 }); await p.mouse.up(); };
    await p.evaluate(() => df.setNodeLocked(3));
    await dragBy('#node-3', 40, 40);
    const lockedPos = await p.evaluate(() => [df.getNodeFromId(3).pos_x, df.getNodeFromId(3).pos_y]);
    await p.evaluate(() => { df.setNodeLocked(3, false); df.snap_grid = 25; });
    await dragBy('#node-3', 33, 41);
    const snapped = await p.evaluate(() => [df.getNodeFromId(3).pos_x % 25, df.getNodeFromId(3).pos_y % 25]);
    await p.evaluate(() => { df.snap_grid = 0; df.node_bounds = { min_x: 30, min_y: 30 }; });
    await dragBy('#node-1', -30, -30);
    const bounded = await p.evaluate(() => { const n = df.getNodeFromId(1); df.node_bounds = null; return [n.pos_x, n.pos_y]; });
    check(B, 'nó travado não arrasta', lockedPos.join() === '50,300', lockedPos);
    check(B, 'encaixe em grade', snapped.join() === '0,0', snapped);
    check(B, 'limite de área', bounded.join() === '30,30', bounded);
    // multisseleção: ctrl+clique, arrastar o grupo, Delete, caixa com shift
    await p.evaluate(() => { df.setNodePosition(1, 50, 50); df.setNodePosition(2, 350, 50); df.setNodePosition(3, 50, 300); df.clearSelection(); });
    for (const sel of ['#node-1', '#node-2']) { const b = await p.locator(sel).boundingBox(); await p.keyboard.down('Control'); await p.mouse.click(b.x + 60, b.y + 15); await p.keyboard.up('Control'); }
    const sel1 = await p.evaluate(() => df.getSelectedNodes().join());
    await dragBy('#node-1', 30, 20);
    const group = await p.evaluate(() => [df.getNodeFromId(1).pos_x, df.getNodeFromId(2).pos_x, df.getNodeFromId(3).pos_x]);
    await p.mouse.click(700, 600);
    const cleared = await p.evaluate(() => df.getSelectedNodes().length);
    await p.keyboard.down('Shift'); await p.mouse.move(20, 200); await p.mouse.down(); await p.mouse.move(300, 500, { steps: 5 }); await p.mouse.up(); await p.keyboard.up('Shift');
    const boxed = await p.evaluate(() => [df.getSelectedNodes().join(), document.querySelectorAll('.drawflow-selection-box').length, df.canvas_x]);
    await p.keyboard.press('Delete');
    const deleted = await p.evaluate(() => Object.keys(df.export().drawflow.Home.data).join());
    check(B, 'multisseleção com ctrl+clique', sel1 === '1,2', sel1);
    check(B, 'arrastar o grupo', group.join() === '80,380,50', group);
    check(B, 'clique no canvas limpa a seleção', cleared === 0, cleared);
    check(B, 'caixa de seleção com shift', boxed.join() === '3,0,0', boxed);
    check(B, 'Delete apaga a seleção', deleted === '1,2', deleted);
    check(B, 'sem erros (seleção)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // Etiquetas nas ligações e variáveis CSS
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.reroute = true; df.start();
      df.addNode('a', 1, 2, 50, 50, 'a', {}, 'A'); df.addNode('b', 2, 1, 450, 250, 'b', {}, 'B');
      df.addConnection(1, 2, 'output_1', 'input_1'); df.addConnection(1, 2, 'output_2', 'input_2');
      const res = {};
      res.set = df.setConnectionLabel(1, 2, 'output_1', 'input_1', '<b>yes</b>');
      const l = () => document.querySelector('.connection-label');
      res.text = [l().textContent, l().children.length, df.getConnectionLabel(1, 2, 'output_1', 'input_1')];
      const center = () => { const b = l().getBoundingClientRect(), n1 = document.querySelector('#node-1 .output_1').getBoundingClientRect(), n2 = document.querySelector('#node-2 .input_1').getBoundingClientRect(); return Math.abs((b.left + b.width / 2) - (n1.left + n2.right) / 2) < 12; };
      res.middle = center();
      df.setNodePosition(2, 600, 300); res.follows = center();
      const data = df.export(); res.saved = data.drawflow.Home.data[1].outputs.output_1.connections[0].label;
      df.clear(); df.import(data); res.imported = l() ? l().textContent : null;
      df.removeSingleConnection(1, 2, 'output_2', 'input_2'); res.other = document.querySelectorAll('.connection-label').length;
      df.removeNodeId(2); res.removed = document.querySelectorAll('.connection-label').length;
      return res;
    });
    check(B, 'etiqueta: texto seguro, no meio da ligação', r.set && r.text[0] === '<b>yes</b>' && r.text[1] === 0 && r.text[2] === '<b>yes</b>' && r.middle, r);
    check(B, 'etiqueta acompanha o nó', r.follows, r);
    check(B, 'etiqueta salva no export e volta no import', r.saved === '<b>yes</b>' && r.imported === '<b>yes</b>', r);
    check(B, 'etiqueta some com a ligação', r.other === 1 && r.removed === 0, r);
    const v = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); document.getElementById('d').innerHTML = ''; const e = new Drawflow(document.getElementById('d')); e.start();
      e.addNode('a', 1, 1, 50, 50, 'a', {}, 'A'); e.addNode('b', 1, 1, 350, 50, 'b', {}, 'B'); e.addConnection(1, 2, 'output_1', 'input_1');
      const path = document.querySelector('.connection .main-path'), node = document.getElementById('node-1');
      const before = [getComputedStyle(path).stroke, getComputedStyle(node).backgroundColor];
      document.documentElement.style.setProperty('--drawflow-connection-color', 'rgb(1, 2, 3)');
      document.documentElement.style.setProperty('--drawflow-node-background', 'rgb(4, 5, 6)');
      return [before, getComputedStyle(path).stroke, getComputedStyle(node).backgroundColor];
    });
    check(B, 'variáveis CSS: padrão igual e troca de cor', v[0][0] === 'rgb(70, 130, 180)' && v[0][1] === 'rgb(0, 255, 255)' && v[1] === 'rgb(1, 2, 3)' && v[2] === 'rgb(4, 5, 6)', v);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // Desfazer e refazer
  try {
    const p = await page(browser);
    const r = await p.evaluate(async () => {
      const wait = () => new Promise(f => setTimeout(f, 220));
      const df = new Drawflow(document.getElementById('d')); df.history = true; df.start(); window.df = df;
      const n = () => Object.keys(df.export().drawflow.Home.data).length, c = () => document.querySelectorAll('.connection').length;
      const res = { start: [df.canUndo(), df.canRedo()] };
      df.addNode('a', 1, 1, 50, 50, 'a', {}, 'A'); await wait();
      df.addNode('b', 1, 1, 350, 50, 'b', {}, 'B'); df.addConnection(1, 2, 'output_1', 'input_1'); await wait();
      df.removeNodeId(2); await wait();
      res.removed = [n(), c()];
      df.undo(); res.undo1 = [n(), c()];
      df.undo(); res.undo2 = [n(), c()];
      df.redo(); res.redo = [n(), c()];
      df.setNodePosition(1, 200, 200); df.undo(); res.flush = df.getNodeFromId(1).pos_x;
      df.undo(); df.addNode('z', 1, 1, 0, 0, 'z', {}, 'Z'); await wait(); res.branch = df.canRedo();
      return res;
    });
    check(B, 'histórico: desfazer e refazer', r.start.join() === 'false,false' && r.removed.join() === '1,0' && r.undo1.join() === '2,1' && r.undo2.join() === '1,0' && r.redo.join() === '2,1', r);
    check(B, 'histórico: mudança pendente entra no desfazer', r.flush === 50 && r.branch === false, r);
    await p.mouse.click(600, 500); await p.keyboard.press('Control+z');
    const k = await p.evaluate(() => df.canRedo());
    check(B, 'histórico: Ctrl+Z', k === true, k);
    check(B, 'sem erros (histórico)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // Miniatura e minimapa
  try {
    const p = await page(browser);
    await p.addScriptTag({ path: DIST + '/drawflow-minimap.min.js' });
    const r = await p.evaluate(async () => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      df.addNode('a', 1, 1, 50, 50, 'a', {}, 'A'); df.addNode('b', 1, 1, 400, 200, 'b', {}, 'B'); df.addNode('c', 1, 1, 1500, 900, 'c', {}, 'C');
      df.addConnection(1, 2, 'output_1', 'input_1'); df.addConnection(2, 3, 'output_1', 'input_1');
      const box = document.createElement('div'); document.body.appendChild(box);
      const res = {};
      const out = df.renderPreview(box, { color: n => n.name === 'b' ? 'rgb(9, 9, 9)' : null });
      res.preview = [box.querySelectorAll('rect').length, box.querySelectorAll('path').length, box.querySelector('rect.b').style.fill, out.bounds.width > 1400];
      const exported = df.export();
      df.addModule('Sub'); res.other = df.renderPreview(box, { data: exported }) !== null && box.querySelectorAll('rect').length === 3;
      res.empty = df.renderPreview(box, { module: 'Sub' }) === null;
      window.mm = new DrawflowMinimap(df);
      await new Promise(f => setTimeout(f, 60));
      const view = () => { const v = document.querySelector('.drawflow-minimap-view'); return [parseFloat(v.style.left), parseFloat(v.style.width)]; };
      res.mini = [document.querySelectorAll('.drawflow-minimap rect').length, view()[1] > 10];
      const before = view()[0];
      df.setCanvasPosition(-800, -300); await new Promise(f => setTimeout(f, 60));
      res.follows = view()[0] > before;
      df.addNode('d', 1, 1, 700, 100, 'd', {}, 'D'); await new Promise(f => setTimeout(f, 60));
      res.newNode = document.querySelectorAll('.drawflow-minimap rect').length;
      return res;
    });
    check(B, 'renderPreview', r.preview.join() === '3,2,rgb(9, 9, 9),true' && r.other && r.empty, r);
    check(B, 'minimapa mostra o fluxo e a área visível', r.mini.join() === '3,true' && r.follows && r.newNode === 4, r);
    const m = await p.locator('.drawflow-minimap').boundingBox();
    const t0 = await p.evaluate(() => [df.canvas_x, df.node_selected]);
    await p.mouse.click(m.x + 20, m.y + 30);
    const t1 = await p.evaluate(() => [df.canvas_x, document.querySelectorAll('.selected').length]);
    check(B, 'clique no minimapa move a tela', t1[0] !== t0[0] && t1[1] === 0, { t0, t1 });
    const d = await p.evaluate(() => { mm.destroy(); return document.querySelectorAll('.drawflow-minimap').length; });
    check(B, 'minimapa destroy', d === 0, d);
    check(B, 'sem erros (minimapa)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

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
