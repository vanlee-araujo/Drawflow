import Drawflow from "./drawflow";

export default class DrawflowMinimap {
    constructor(editor: Drawflow, options?: { width?: number; height?: number });
    refresh(): void;
    destroy(): void;
}
