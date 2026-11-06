const output = (library, filename) => ({
  library: library,
  libraryTarget: 'umd',
  libraryExport: 'default',
  filename: filename,
  globalObject: `(typeof self !== 'undefined' ? self : this)`
});

module.exports = [
  { entry: './src/drawflow.js', output: output('Drawflow', 'drawflow.min.js') },
  { entry: './src/drawflow-minimap.js', output: output('DrawflowMinimap', 'drawflow-minimap.min.js') },
];
