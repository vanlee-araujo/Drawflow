// Undo and redo with snapshots of the data. Changes close together (a node and its connections,
// a whole layout, typing in a field) become one step
const HISTORY_EVENTS = ['nodeCreated', 'nodeRemoved', 'nodeMoved', 'nodeDataChanged', 'nodeLocked', 'connectionCreated', 'connectionRemoved',
  'connectionLabelChanged', 'addReroute', 'removeReroute', 'rerouteMoved', 'moduleCreated', 'moduleRemoved', 'import'];

export default {
  startHistory() {
    HISTORY_EVENTS.forEach(name => this.on(name, () => this.scheduleHistory()));
    this.recordHistory();
  },

  scheduleHistory() {
    if(this.history_restoring) {
      return;
    }
    clearTimeout(this.history_timer);
    this.history_timer = setTimeout(() => this.recordHistory(), 150);
  },

  recordHistory() {
    clearTimeout(this.history_timer);
    this.history_timer = null;
    const snapshot = JSON.stringify(this.drawflow);
    if(snapshot === this.history_stack[this.history_index]) {
      return;
    }
    this.history_stack.length = this.history_index + 1;
    this.history_stack.push(snapshot);
    if(this.history_stack.length > this.history_limit) {
      this.history_stack.shift();
    }
    this.history_index = this.history_stack.length - 1;
    this.dispatch('historyChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  },

  flushHistory() {
    if(this.history_timer !== null) {
      this.recordHistory();
    }
  },

  canUndo() {
    return this.history_index > 0;
  },

  canRedo() {
    return this.history_index < this.history_stack.length - 1;
  },

  undo() {
    this.flushHistory();
    return this.canUndo() ? this.restoreHistory(this.history_index - 1) : false;
  },

  redo() {
    this.flushHistory();
    return this.canRedo() ? this.restoreHistory(this.history_index + 1) : false;
  },

  restoreHistory(index) {
    this.history_restoring = true;
    this.clearSelection();
    this.history_index = index;
    this.import(JSON.parse(this.history_stack[index]), false);
    this.history_restoring = false;
    this.dispatch('historyChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    return true;
  },
};
