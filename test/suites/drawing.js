// Drawing: default curve, arrows, vertical direction, reroute, small fixes, connection classes
const { check, page, pixel, near, drag, STEEL, SELECTED } = require('../helpers');

module.exports = async function (browser, B) {
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
};
