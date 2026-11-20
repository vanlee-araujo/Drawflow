// Issues of the original project
const fs = require('fs');
const path = require('path');
const { check, page, ROOT } = require('../helpers');

module.exports = async function (browser, B) {
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
};
