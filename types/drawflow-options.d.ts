// Options added by this fork; set them before start() unless noted
import { ConnectionArrow, ConnectionDirection, ConnectionEvent, NodeBounds } from "./drawflow-data";

export interface DrawflowOptions {
    /** Connection to a node behind the output drawn as a loop. @default false */
    curvature_backward: boolean;
    /** @default 60 */
    backward_offset: number;
    /** @default 80 */
    backward_depth: number;
    /** @default 120 */
    backward_row_gap: number;
    /** Returning false blocks the connection (mouse or addConnection). @default null */
    connection_validator: ((connection: ConnectionEvent) => boolean | void) | null;
    /** @default 'none' */
    connection_arrow: ConnectionArrow;
    /** @default 14 */
    connection_arrow_size: number;
    /** Distance from the port center to the arrow tip. @default 12 */
    connection_arrow_offset: number;
    /** @default 'horizontal' */
    connection_direction: ConnectionDirection;
    /** @default 'connection-target' */
    connection_target_class: string;
    /** Redraw connections when a node changes size. Set before start(). @default true */
    observe_node_resize: boolean;
    /** Mouse wheel zooms only with ctrl. @default true */
    zoom_use_ctrl_key: boolean;
    /** Returning false keeps the node. @default null */
    node_remove_validator: ((id: string) => boolean | void) | null;
    /** Returning false keeps the connection. @default null */
    connection_remove_validator: ((connection: ConnectionEvent) => boolean | void) | null;
    /** Grid size for dragged nodes, 0 for none. @default 0 */
    snap_grid: number;
    /** Limits for dragged nodes. @default null */
    node_bounds: NodeBounds | null;
    /** Ctrl/Shift + click and Shift + drag select several nodes. @default false */
    multiselect: boolean;
    /** Undo and redo. Set before start(). @default false */
    history: boolean;
    /** @default 50 */
    history_limit: number;
    /** Cleans the HTML of nodes before it is written into the page (addNode and import). @default null */
    sanitize_html: ((html: string) => string) | null;
}
