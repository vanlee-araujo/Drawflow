// Data format, event payloads and option values of Drawflow

export type ConnectionArrow = "none" | "end" | "start" | "both";
export type ConnectionDirection = "horizontal" | "vertical";

export interface NodeBounds {
    min_x?: number;
    min_y?: number;
    max_x?: number;
    max_y?: number;
}

export interface ZoomFitOptions {
    padding?: number;
    minZoom?: number;
    maxZoom?: number;
}

export interface AutoLayoutOptions {
    direction?: "LR" | "RL" | "TB" | "BT";
    nodesep?: number;
    ranksep?: number;
    edgesep?: number;
    fit?: boolean;
    fitOptions?: ZoomFitOptions;
}

export interface PreviewOptions {
    /** An export(), a module ({ data }) or its nodes. Default: the current module */
    data?: any;
    module?: string;
    direction?: ConnectionDirection;
    padding?: number;
    nodeWidth?: number;
    nodeHeight?: number;
    color?: (node: DrawflowNode) => string | null | undefined;
}

export interface ConnectionEvent {
    /**
     * outputNodeId
     */
    output_id: string;

    /**
     * inputNodeId
     */
    input_id: string;

    /**
     * name of the output
     */
    output_class: string;

    /**
     * name of the input
     */
    input_class: string;
}

export interface ConnectionStartEvent {
    /**
     * outputNodeId
     */
    output_id: string;

    /**
     * name of the output
     */
    output_class: string;
}

export interface MousePositionEvent {
    x: number;
    y: number;
}

export interface DrawflowExport {
    drawflow: {
        Home: DrawflowModuleData; // always present
        [customModuleName: string]: DrawflowModuleData;
    };
}

export interface DrawflowModuleData {
    data: {
        [nodeKey: string]: DrawflowNode;
    };
}

export interface DrawflowNode {
    class: string;
    data: any;
    html: string;
    id: number;
    inputs: Record<string, DrawflowConnection>;
    name: string;
    outputs: Record<string, DrawflowConnection>;
    pos_x: number;
    pos_y: number;
    typenode: boolean;
}

export interface DrawflowConnection {
    connections: DrawflowConnectionDetail[];
}

export interface DrawflowConnectionDetail {
    output: string;
    input: string;
    node: string;
}

export type DrawFlowEditorMode = "edit" | "fixed" | "view";
