// Contract of the TypeScript declarations: this file must compile with tsc --strict
import Drawflow, { ConnectionEvent, DrawflowExport, DrawflowNode } from '../types/drawflow';
import DrawflowMinimap from '../types/drawflow-minimap';

declare const element: HTMLElement;
const editor = new Drawflow(element);

// Options of the original and of the fork
editor.reroute = true;
editor.connection_arrow = 'end';
editor.connection_direction = 'vertical';
editor.sanitize_html = (html: string) => html.replace(/<script/gi, '');
editor.connection_validator = ({ output_id, input_id }: ConnectionEvent) => output_id !== input_id;
editor.node_bounds = { min_x: 0, min_y: 0 };
editor.start();

// Methods
const id: number | string = editor.addNode('a', 1, 1, 10, 10, 'a', {}, '<b>A</b>', false);
editor.addConnection(id, id, 'output_1', 'input_1');
const data: DrawflowExport = editor.export();
const node: DrawflowNode = data.drawflow.Home.data['1'];
editor.import(data);
editor.zoomFit({ padding: 20 });
editor.setConnectionLabel(1, 2, 'output_1', 'input_1', 'yes');
const canUndo: boolean = editor.canUndo();
const input: string = editor.addNodeInput(id);
const ids: string[] = editor.getConnectedNodes(id, 'output_1').concat(editor.getAllNodes());
const changed: boolean = editor.updateNodeHtmlFromId(id, '<i>B</i>') && editor.addReroutePoint(1, 2, 'output_1', 'input_1', 10, 20);

// Events: typed arguments for known names, any for the others
editor.on('nodeCreated', (created: number) => created + 1);
editor.on('connectionCreated', (connection: ConnectionEvent) => connection.input_class);
editor.on('historyChanged', state => state.canRedo);
editor.on('myEvent', (anything: any) => anything);
editor.on('nodePositionChanged', ({ id: moved, pos_x, pos_y }) => moved + pos_x + pos_y);
editor.on('connectionDblClick', (connection: ConnectionEvent) => connection.output_id);

const minimap = new DrawflowMinimap(editor, { width: 200 });
minimap.destroy();

export { node, canUndo, input, ids, changed };
