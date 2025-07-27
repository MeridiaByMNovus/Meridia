import * as pty from "node-pty";

export const ptyInstances = new Map<number, pty.IPty>();
