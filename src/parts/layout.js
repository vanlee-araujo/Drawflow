// Automatic layout
export default {
  // Arrange the nodes of the current module in layers with dagre (https://github.com/dagrejs/dagre),
  // passed by the caller so Drawflow keeps no dependency
  autoLayout(dagre, options = {}) {
    if(!dagre || !dagre.graphlib || typeof dagre.layout !== 'function') {
      throw new Error('autoLayout needs dagre: editor.autoLayout(dagre, options)');
    }
    const data = this.drawflow.drawflow[this.module].data;
    const graph = new dagre.graphlib.Graph({ multigraph: true });
    graph.setGraph({
      rankdir: options.direction || (this.connection_direction === 'vertical' ? 'TB' : 'LR'),
      nodesep: options.nodesep !== undefined ? options.nodesep : 40,
      ranksep: options.ranksep !== undefined ? options.ranksep : 70,
      edgesep: options.edgesep !== undefined ? options.edgesep : 10,
    });
    graph.setDefaultEdgeLabel(() => ({}));
    const ids = Object.keys(data);
    ids.forEach(id => {
      const ele = this.container.querySelector('#node-' + id);
      graph.setNode(id, { width: ele && ele.offsetWidth || 1, height: ele && ele.offsetHeight || 1 });
    });
    // Edges in the order of the outputs (output_1 before output_2), so their targets keep that order
    const portNumber = name => parseInt(name.slice(name.lastIndexOf('_') + 1)) || 0;
    ids.forEach(id => {
      Object.keys(data[id].outputs).sort((a, b) => portNumber(a) - portNumber(b)).forEach(output_class => {
        data[id].outputs[output_class].connections.forEach(connection => {
          if(data[connection.node] !== undefined) {
            graph.setEdge(id, String(connection.node), {}, output_class + ' ' + connection.output);
          }
        });
      });
    });
    dagre.layout(graph);
    // Reroute points belong to the old positions
    ids.forEach(id => {
      Object.keys(data[id].outputs).forEach(output_class => {
        data[id].outputs[output_class].connections.forEach(connection => {
          delete connection.points;
        });
      });
    });
    this.precanvas.querySelectorAll('.connection').forEach(connection => {
      connection.querySelectorAll('.point').forEach(point => point.remove());
      connection.querySelectorAll('.main-path').forEach((path, i) => {
        if(i > 0) {
          path.remove();
        }
      });
    });
    const positions = {};
    ids.forEach(id => {
      const node = graph.node(id);
      positions[id] = { pos_x: Math.round(node.x - node.width / 2), pos_y: Math.round(node.y - node.height / 2) };
      this.setNodePosition(id, positions[id].pos_x, positions[id].pos_y);
    });
    if(options.fit !== false) {
      this.zoomFit(options.fitOptions || {});
    }
    return positions;
  },
};
