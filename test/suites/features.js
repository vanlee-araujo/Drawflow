// Features of the fork: zoomFit, autoLayout, editing tools, labels, history, previews, minimap
const { check, page, DIST } = require('../helpers');

module.exports = async function (browser, B) {
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

  // Editor sem tamanho no momento do desenho (aba ou painel oculto)
  try {
    const p = await page(browser, '<div id="w" style="height:0;overflow:hidden"><div id="d" style="width:800px;height:100%;position:relative"></div></div>');
    const r = await p.evaluate(async () => {
      const df = new Drawflow(document.getElementById('d')); df.start();
      df.addNode('a', 1, 1, 50, 100, 'a', {}, 'A'); df.addNode('b', 1, 1, 400, 100, 'b', {}, 'B'); df.addConnection(1, 2, 'output_1', 'input_1');
      const fit = df.zoomFit();
      document.getElementById('w').style.height = '500px';
      await new Promise(f => setTimeout(f, 150));
      const d = document.querySelector('.main-path').getAttribute('d').trim().split(/\s+/), c = document.querySelector('#node-1 .output_1').getBoundingClientRect(), pc = df.precanvas.getBoundingClientRect();
      df.clear(); df.addNode('x', 1, 1, 10, 10, 'x', {}, 'X');
      return { fit, y: Number(d[2]), port: c.top + c.height / 2 - pc.top, zoom: df.zoom };
    });
    check(B, 'editor sem tamanho: zoomFit não age e as linhas se ajustam ao aparecer', r.fit === null && r.zoom === 1 && Math.abs(r.y - r.port) < 1, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }
  // sanitize_html: the HTML of nodes passes through the function given by the application (addNode and import)
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d'));
      const calls = [];
      df.sanitize_html = html => { calls.push(html); return html.replace(/ on\w+="[^"]*"/g, ''); };
      df.start();
      const bad = '<img src="x" onerror="window.hit = 1"><b>ok</b>';
      const id = df.addNode('a', 1, 1, 50, 50, 'a', {}, bad);
      const added = document.querySelector('#node-' + id + ' .drawflow_content_node').innerHTML;
      const data = df.export();
      df.import(data);
      const imported = document.querySelector('#node-' + id + ' .drawflow_content_node').innerHTML;
      const plain = new Drawflow(document.createElement('div'));
      return { added, imported, calls: calls.length, kept: df.getNodeFromId(id).html === bad, plainDefault: plain.sanitize_html };
    });
    check(B, 'sanitize_html no addNode e no import', !r.added.includes('onerror') && !r.imported.includes('onerror') && r.added.includes('<b>ok</b>') && r.calls === 2, r);
    check(B, 'sanitize_html desligado por padrão; export guarda o HTML original', r.plainDefault === null && r.kept, r);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }
};
