import * as pty from "node-pty";

export const terminals = new Map<number, pty.IPty>();
