// Based on @types/drawflow (DefinitelyTyped, MIT License, Copyright (c) Microsoft Corporation),
// extended with the API of this fork.
// Declare the workflow module to be able to used it in typescript
// this file must be defined in the include in tsconfig.json

import { DrawflowEvents } from "./drawflow-events";
import { DrawflowOptions } from "./drawflow-options";
import {
    AutoLayoutOptions, ConnectionArrow, ConnectionDirection, DrawFlowEditorMode, DrawflowExport,
    DrawflowNode, PreviewOptions, ZoomFitOptions,
} from "./drawflow-data";

export * from "./drawflow-data";
export { DrawflowEvents } from "./drawflow-events";
export { DrawflowOptions } from "./drawflow-options";

declare class Drawflow {
    constructor(element: HTMLElement, render?: object, parent?: object);

    /**
     * @default {}
     */
    events: Record<string, { listeners: Array<(args: any) => void> }>;

    /**
     * @required
     */
    container: HTMLElement;

    /**
     * @default 1
     */
    nodeId: number;

    /**
     * @default null
     */
    ele_selected: HTMLElement | null;

    /**
     * @default null
     */
    node_selected: HTMLElement | null;

    /**
     * Drag nodes on click inputs
     * @default false
     */
    drag: boolean;


    /**
     * Active reroute
     * @default false
     */
    reroute: boolean;

    /**
     * Fix adding points
     * @default false
     */
    reroute_fix_curvature: boolean;

    /**
     * Curvature
     * @default 0.5
     */
    curvature: number;

    /**
     * Curvature reroute first point and last point
     * @default 0.5
     */
    reroute_curvature_start_end: number;

    /**
     * Curvature reroute
     * @default 0.5
     */
    reroute_curvature: number;

    /**
     * Width of reroute
     * @default 6
     */
    reroute_width: number;

    /**
     * flag for drawflow drag point
     */
    drag_point: boolean;

    /**
     * flag for drawflow editor canvas selected
     */
    editor_selected: boolean;

    /**
     * flag for drawflow connnection line
     */
    connection: boolean;

    /**
     * connection element
     */
    connection_ele: HTMLElement | null;

    /**
     *  selected connection
     */
    connection_selected: HTMLElement | null;

    /**
     * Width of line
     * @default 5
     */
    line_path: number;

    /**
     * first clicked element
     */
    first_click: HTMLElement | null;

    /**
     * Force the first input to drop the connection on top of the node
     * @default false
     */
    force_first_input: boolean;

    /**
     * edit or fixed mode
     * @default edit
     */
    editor_mode: DrawFlowEditorMode;

    /**
     * Default zoom
     * @default 1
     */
    zoom: number;

    /**
     * Default zoom max
     * @default 1.6
     */
    zoom_max: number;

    /**
     * Default zoom min
     * @default 0.5
     */
    zoom_min: number;

    /**
     * Default zoom value update
     * @default 0.1
     */
    zoom_value: number;

    /**
     * Default zoom last value
     * @default 1
     */
    zoom_last_value: number;

    /**
     * Drag nodes on click inputs
     * @default true
     */
    draggable_inputs: boolean;

    /**
     * Canvas origin x coordinate
     */
    canvas_x: number;

    /**
     * Canvas origin x coordinate
     */
    canvas_y: number;

    /**
     * focused x coordinate
     */
    pos_x: number;

    /**
     * original x coordinate
     */
    pos_x_start: number;

    /**
     * focused x coordinate
     */
    pos_y: number;

    /**
     * original x coordinate
     */
    pos_y_start: number;

    /**
     * mouse x coordinate
     */
    mouse_x: number;
    /**
     * mouse y coordinate
     */
    mouse_y: number;

    /**
     * mobile event cache list
     */
    evCache: any[];

    /**
     * the diff between previous handlers and current
     */
    prevDiff: number;

    /**
     * Graph data object
     */
    drawflow: DrawflowExport;

    /**
     * Nodes should use uuid instead of id
     * @default false
     */
    useuuid: boolean;

    /**
     * The drawflow "canvas" element
     */
    precanvas: HTMLElement;

    /**
     * The drawflow parent element
     */
    parent: object;

    /**
     * registered nodes for reuse.
     */
    noderegister: object;

    /**
     * user defined renderer, for example vue
     */
    render: object;

    /**
     * module name
     */
    module: string;

    start(): void;

    load(): any;

    import(data: any, notifi?: boolean): void;

    export(): DrawflowExport;

    getUuid(): string;

    /**
     * @param name Name of module
     * @param inputs Number of inputs
     * @param outputs Number of outputs
     * @param posx Position on start node left
     * @param posy Position on start node top
     * @param className Added classname to de node
     * @param data Data passed to node
     * @param html HTML drawn on node or name of register node.
     * @param typenode Default false, true for Object HTML, vue for vue
     */
    addNode(
        name: string,
        inputs: number,
        outputs: number,
        posx: number,
        posy: number,
        className: string,
        data: any,
        html: string,
        typenode: boolean | string,
    ): number | string;

    /**
     *  Increment zoom +0.1
     */
    zoom_in(): void;

    /**
     *  Decrement zoom -0.1
     */
    zoom_out(): void;

    /**
     *  Restores zoom to 1
     */
    zoom_reset(): void;

    /**
     * Redraws according to new zoom
     */
    zoom_refresh(): void;

    /**
     * Get Info of node. Ex: id: 5
     * @param id
     */
    getNodeFromId(id: string | number): DrawflowNode;

    /**
     *  Return Array of nodes id. Ex: name: telegram
     *  @param name
     */
    getNodesFromName(name: string): number[];

    /**
     * Remove node. Ex id: node-x
     * @param id
     */
    removeNodeId(id: string | number): boolean;

    /**
     * Update data element. Ex: 5, { name: 'Drawflow' }
     * @param id
     * @param data
     */
    updateNodeDataFromId(id: string | number, data: any): void;

    /**
     * Add input to node. Ex id: 5
     * @param id
     */
    addNodeInput(id: string | number): string;

    /**
     * Add output to node. Ex id: 5
     * @param id
     */
    addNodeOutput(id: string | number): string;

    /**
     * Remove input to node. Ex id: 5, input_2
     * @param id
     * @param input_class
     */
    removeNodeInput(id: string | number, input_class: string): void;

    /**
     * Remove output to node. Ex id: 5, output_2
     * @param id
     * @param output_class
     */
    removeNodeOutput(id: string | number, output_class: string): void;

    /**
     * Add connection. Ex: 15,16,'output_1','input_1'
     * @param outputNodeId
     * @param inputNodeId
     * @param outputName
     * @param inputName
     */
    addConnection(
        outputNodeId: string | number,
        inputNodeId: string | number,
        outputName: string,
        inputName: string,
    ): void;

    /**
     * Remove connection. Ex: 15,16,'output_1','input_1'
     * @param id_output
     * @param id_input
     * @param output_class
     * @param input_class
     */
    removeSingleConnection(
        id_output: string | number,
        id_input: string | number,
        output_class: string,
        input_class: string,
    ): void;

    /**
     * Update connections position from Node Ex id: node-x
     * @param id
     */
    updateConnectionNodes(id: string | number): void;

    /**
     * Remove node connections. Ex id: node-x
     * @param id
     */
    removeConnectionNodeId(id: string | number): void;

    /**
     * Get name of module where is the id. Ex id: 5
     * @param id
     */
    getModuleFromNodeId(id: string | number): string;

    /**
     * Clear data of module selected
     */
    clearModuleSelected(): void;

    /**
     * Clear all data of all modules and modules remove.
     */
    clear(): void;

    addModule(moduleName: string): void;

    removeModule(moduleName: string): void;

    changeModule(moduleName: string): void;

    /**
     * @param name Name of module registered.
     * @param component HTML to drawn or vue component.
     * @param props Only for vue. Props of component. Not Required
     * @param options Only for vue. Options of component. Not Required
     */
    registerNode(name: string, component: any, props: any, options: any): void;

    removeConnection(): boolean | void;
    removeListener(eventName: string, callback: (event: any) => void): boolean | void;
    dispatch(eventName: string, details?: any): boolean | void;
    createCurvature(start_pos_x: number, start_pos_y: number, end_pos_x: number, end_pos_y: number, curvature_value: number, type: string): string;

    /** Set zoom inside zoom_min and zoom_max */
    setZoom(value: number): void;
    /** Pan the canvas */
    setCanvasPosition(x: number, y: number): void;
    /** Move a node and redraw its connections */
    setNodePosition(id: string | number, pos_x: number, pos_y: number): void;
    /** Zoom and pan so that every node fits */
    zoomFit(options?: ZoomFitOptions): { zoom: number; x: number; y: number } | null;
    /** Arrange the nodes of the current module with dagre */
    autoLayout(dagre: any, options?: AutoLayoutOptions): Record<string, { pos_x: number; pos_y: number }>;
    /** Pan so that a point of the canvas is in the center */
    centerCanvasOn(x: number, y: number): void;
    centerNode(id: string | number): void;
    setConnectionArrow(arrow: ConnectionArrow, size?: number, offset?: number): void;
    setConnectionDirection(direction: ConnectionDirection): void;

    setConnectionLabel(id_output: string | number, id_input: string | number, output_class: string, input_class: string, text: string | null): boolean;
    getConnectionLabel(id_output: string | number, id_input: string | number, output_class: string, input_class: string): string;

    setNodeLocked(id: string | number, locked?: boolean): void;
    isNodeLocked(id: string | number): boolean;

    selectNode(id: string | number): boolean;
    selectNodes(ids: Array<string | number>): void;
    clearSelection(): void;
    getSelectedNodes(): string[];

    undo(): boolean;
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;

    /** Draw a flow as a small picture in an element */
    renderPreview(element: HTMLElement, options?: PreviewOptions): { svg: SVGSVGElement; bounds: { x: number; y: number; width: number; height: number } } | null;

    /** Ids of the nodes of a module (the current one by default) */
    getAllNodes(moduleName?: string): string[];
    /** Ids of the nodes connected to a node, on every port or on one ('input_1', 'output_2') */
    getConnectedNodes(id: string | number, port?: string): string[];
    /** New HTML for a node created with HTML (typenode false); false for other nodes */
    updateNodeHtmlFromId(id: string | number, html: string): boolean;
    /** A reroute point from code, at the end of the points or at index */
    addReroutePoint(id_output: string | number, id_input: string | number, output_class: string, input_class: string, pos_x: number, pos_y: number, index?: number): boolean;
    /** Ends a drag in progress (the editor calls it when the window loses the focus) */
    cancelPointer(): boolean;
}

// Options of the fork and the on() overloads, declared in their own files and merged into the class
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Drawflow extends DrawflowOptions, DrawflowEvents {}

export default Drawflow;
