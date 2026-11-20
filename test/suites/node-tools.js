// Small additions to nodes, ports, connections and dragging (group 1 of the proposals)
const { check, page } = require('../helpers');

module.exports = async function (browser, B) {
  // Ports, node queries and the new HTML of a node
  try {
    const p = await page(browser);
    const r = await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d'));
      df.sanitize_html = html => html.replace(/ on\w+="[^"]*"/g, '');
      df.start();
      const a = df.addNode('a', 1, 1, 50, 50, 'a', { name: 'x' }, '<input df-name>');
      const b = df.addNode('b', 1, 1, 300, 50, 'b', {}, 'B');
      const c = df.addNode('c', 1, 1, 300, 250, 'c', {}, 'C');
      const input = df.addNodeInput(b), output = df.addNodeOutput(a);
      df.addConnection(a, b, 'output_1', 'input_1');
      df.addConnection(a, c, 'output_2', 'input_1');
      const events = [];
      df.on('nodeHtmlChanged', id => events.push(id));
      const updated = df.updateNodeHtmlFromId(a, '<b onclick="x()">New</b> <input df-name>');
      const content = document.querySelector('#node-' + a + ' .drawflow_content_node');
      return {
        input, output, ports: Object.keys(df.getNodeFromId(b).inputs),
        all: df.getAllNodes(), none: df.getAllNodes('Missing'),
        fromA: df.getConnectedNodes(a), fromOut1: df.getConnectedNodes('node-' + a, 'output_1'), toC: df.getConnectedNodes(c, 'input_1'),
        unknown: df.getConnectedNodes(99),
        updated, html: content.innerHTML, field: content.querySelector('input').value, saved: df.getNodeFromId(a).html, events,
        missing: df.updateNodeHtmlFromId(99, 'x'),
      };
    });
    check(B, 'addNodeInput/addNodeOutput devolvem a porta criada', r.input === 'input_2' && r.output === 'output_2' && r.ports.join() === 'input_1,input_2', r);
    check(B, 'getAllNodes e getConnectedNodes', r.all.join() === '1,2,3' && r.none.length === 0 && r.fromA.join() === '2,3' && r.fromOut1.join() === '2' && r.toC.join() === '1' && r.unknown.length === 0, r);
    check(B, 'updateNodeHtmlFromId troca o HTML, refaz os campos e passa pelo sanitize_html', r.updated && r.html.includes('<b>New</b>') && !r.html.includes('onclick') && r.field === 'x' && r.saved.includes('onclick') && r.events.join() === '1' && r.missing === false, r);
    check(B, 'sem erros (nós)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // nodePositionChanged, cursor while dragging and the end of a drag when the window loses the focus
  try {
    const p = await page(browser);
    await p.evaluate(() => {
      const df = new Drawflow(document.getElementById('d')); df.start(); window.df = df;
      df.addNode('a', 1, 1, 100, 100, 'a', {}, 'A');
      df.addNode('b', 1, 1, 500, 100, 'b', {}, 'B');
      window.moves = [];
      window.cancels = 0;
      df.on('nodePositionChanged', event => window.moves.push(event));
      df.on('connectionCancel', () => window.cancels++);
      df.setNodePosition(2, 520, 140);
    });
    const box = await p.locator('#node-1').boundingBox();
    await p.mouse.move(box.x + 20, box.y + 10); await p.mouse.down();
    await p.mouse.move(box.x + 80, box.y + 60, { steps: 5 });
    const dragging = await p.evaluate(() => ({ cls: df.container.classList.contains('drawflow-dragging'), cursor: getComputedStyle(df.container).cursor }));
    await p.mouse.up();
    const after = await p.evaluate(() => ({ cls: df.container.className, moves: window.moves, pos: [df.getNodeFromId(1).pos_x, df.getNodeFromId(1).pos_y] }));
    check(B, 'nodePositionChanged com a posição (setNodePosition e arrasto)', after.moves.length === 2 && after.moves[0].id === '2' && after.moves[0].pos_x === 520 && after.moves[1].id === '1' && after.moves[1].pos_x === after.pos[0] && after.moves[1].pos_y === after.pos[1], after);
    check(B, 'cursor de mover durante o arrasto e limpo ao soltar', dragging.cls && dragging.cursor === 'move' && !after.cls.includes('drawflow-dragging'), { dragging, after });

    // Pan of the canvas: grabbing cursor
    await p.mouse.move(700, 500); await p.mouse.down();
    await p.mouse.move(650, 450, { steps: 4 });
    const panning = await p.evaluate(() => ({ cls: df.container.classList.contains('drawflow-panning'), cursor: getComputedStyle(df.container).cursor }));
    await p.mouse.up();
    check(B, 'cursor de arrastar o canvas', panning.cls && panning.cursor === 'grabbing', panning);

    // Window blur while drawing a connection and while dragging a node
    const out = await p.locator('#node-1 .output_1').boundingBox();
    await p.mouse.move(out.x + out.width / 2, out.y + out.height / 2); await p.mouse.down();
    await p.mouse.move(out.x + 120, out.y + 40, { steps: 4 });
    const blurConnection = await p.evaluate(() => {
      const drawing = df.connection;
      window.dispatchEvent(new Event('blur'));
      return { drawing, connection: df.connection, cancels: window.cancels, lines: document.querySelectorAll('.connection').length };
    });
    await p.mouse.up();
    const node = await p.locator('#node-2').boundingBox();
    await p.mouse.move(node.x + 20, node.y + 10); await p.mouse.down();
    await p.mouse.move(node.x + 60, node.y + 30, { steps: 4 });
    const blurDrag = await p.evaluate(() => {
      const before = window.moves.length;
      window.dispatchEvent(new Event('blur'));
      return { drag: df.drag, moved: window.moves.length - before, cls: df.container.classList.contains('drawflow-dragging') };
    });
    await p.mouse.move(node.x + 200, node.y + 200, { steps: 4 });
    const still = await p.evaluate(() => df.getNodeFromId(2).pos_x);
    await p.mouse.up();
    check(B, 'perder o foco cancela a ligação em desenho', blurConnection.drawing && !blurConnection.connection && blurConnection.cancels === 1 && blurConnection.lines === 0, blurConnection);
    check(B, 'perder o foco termina o arrasto do nó', !blurDrag.drag && blurDrag.moved === 1 && !blurDrag.cls && still < node.x + 200, { blurDrag, still });
    check(B, 'sem erros (arrasto)', p.errors.length === 0, p.errors);
    await p.close();
  } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }

  // Double click on a connection and reroute points from code
  for (const fix of [false, true]) {
    try {
      const p = await page(browser);
      await p.evaluate(fix => {
        const df = new Drawflow(document.getElementById('d'));
        df.reroute_fix_curvature = fix;
        df.start(); window.df = df;
        df.addNode('a', 1, 1, 50, 100, 'a', {}, 'A');
        df.addNode('b', 1, 1, 500, 100, 'b', {}, 'B');
        df.addConnection(1, 2, 'output_1', 'input_1');
        window.clicks = [];
        df.on('connectionDblClick', event => window.clicks.push(event));
      }, fix);
      await p.locator('.connection .main-path').dblclick({ force: true });
      const r = await p.evaluate(() => {
        df.reroute = true;
        const reroutes = [];
        df.on('addReroute', id => reroutes.push(id));
        const ok1 = df.addReroutePoint(1, 2, 'output_1', 'input_1', 300, 300);
        const ok2 = df.addReroutePoint('node-1', '2', 'output_1', 'input_1', 200, 250, 0);
        const svg = document.querySelector('.connection');
        const result = {
          clicks: window.clicks, ok1, ok2, reroutes: reroutes.slice(),
          missing: df.addReroutePoint(1, 2, 'output_1', 'input_9', 1, 1),
          points: df.export().drawflow.Home.data[1].outputs.output_1.connections[0].points,
          circles: svg.querySelectorAll('.point').length, paths: svg.querySelectorAll('.main-path').length,
          first: [svg.querySelector('.point').getAttribute('cx'), svg.querySelector('.point').getAttribute('cy')],
        };
        df.import(df.export());
        const again = document.querySelector('.connection');
        result.importedCircles = again.querySelectorAll('.point').length;
        result.importedPaths = again.querySelectorAll('.main-path').length;
        df.reroute = false;
        df.clear();
        const na = df.addNode('a', 1, 1, 50, 100, 'a', {}, 'A');
        const nb = df.addNode('b', 1, 1, 500, 100, 'b', {}, 'B');
        df.addConnection(na, nb, 'output_1', 'input_1');
        result.off = df.addReroutePoint(na, nb, 'output_1', 'input_1', 300, 300);
        result.offPoints = df.export().drawflow.Home.data[na].outputs.output_1.connections[0].points.length;
        result.offCircles = document.querySelectorAll('.connection .point').length;
        return result;
      });
      const paths = fix ? 3 : 1;
      check(B, `connectionDblClick com os dados da ligação (fix=${fix})`, r.clicks.length === 1 && r.clicks[0].output_id === '1' && r.clicks[0].input_id === '2' && r.clicks[0].output_class === 'output_1' && r.clicks[0].input_class === 'input_1', r.clicks);
      check(B, `addReroutePoint no fim e no índice (fix=${fix})`, r.ok1 && r.ok2 && r.missing === false && r.reroutes.join() === '1,1' && r.points.length === 2 && r.points[0].pos_x === 200 && r.points[1].pos_x === 300 && r.first.join() === '200,250', r);
      check(B, `addReroutePoint desenha como o import (fix=${fix})`, r.circles === 2 && r.paths === paths && r.importedCircles === 2 && r.importedPaths === paths, r);
      check(B, `addReroutePoint sem reroute: só nos dados, como o import (fix=${fix})`, r.off && r.offPoints === 1 && r.offCircles === 0, r);
      check(B, `sem erros (reroute por código, fix=${fix})`, p.errors.length === 0, p.errors);
      await p.close();
    } catch (e) { check(B, 'execução', false, e.message.split('\n')[0]); }
  }
};
