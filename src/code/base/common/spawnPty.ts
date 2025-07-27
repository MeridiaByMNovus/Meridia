import type { IpcMain, IpcMainEvent } from "electron";
import * as pty from "node-pty";
import type { IPty } from "node-pty";

export interface ShellOptions {
  shell?: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  defaultCols?: number;
  defaultRows?: number;
}

type SpawnPayload = { id: number };
type KeystrokePayload = { id: number; data: string };
type ResizePayload = { id: number; cols: number; rows: number };

export class SpawnPty {
  private readonly terms = new Map<number, IPty>();
  private readonly listeners: Array<() => void> = [];

  private static CH = {
    spawn: "ptyInstance.spawn",
    keystroke: "ptyInstance.keystroke",
    kill: "ptyInstance.kill",
    resize: "ptyInstance.resize",
    outgoing: (id: number) => `ptyInstance.incomingData.${id}`,
  } as const;

  constructor(
    private readonly ipcMain: IpcMain,
    private readonly options: ShellOptions
  ) {}

  public registerIpcHandlers(): () => void {
    this.addListener(SpawnPty.CH.spawn, this.onSpawn);
    this.addListener(SpawnPty.CH.keystroke, this.onKeystroke);
    this.addListener(SpawnPty.CH.kill, this.onKill);
    this.addListener(SpawnPty.CH.resize, this.onResize);
    return () => this.dispose();
  }

  private addListener<T extends unknown[]>(
    channel: string,
    handler: (...args: T) => void
  ) {
    const bound = handler.bind(this) as any;
    this.ipcMain.on(channel, bound);
    this.listeners.push(() => this.ipcMain.off(channel, bound));
  }

  private onSpawn(event: IpcMainEvent, payload: SpawnPayload | number) {
    const id = typeof payload === "number" ? payload : payload?.id;
    if (!Number.isInteger(id)) return;
    const shell = this.options.shell ?? this.getDefaultShell();
    const cwd = this.options.cwd ?? process.cwd();
    const cols = this.options.defaultCols ?? 80;
    const rows = this.options.defaultRows ?? 30;
    const env = { ...process.env, ...(this.options.env ?? {}) };
    try {
      const term = pty.spawn(shell, this.options.args ?? [], {
        name: "xterm-color",
        cols,
        rows,
        cwd,
        env,
      });
      term.onData((data) => {
        event.sender.send(SpawnPty.CH.outgoing(id), data);
      });
      term.onExit(() => {
        this.terms.delete(id);
      });
      this.terms.set(id, term);
    } catch (e) {
      console.error(`[PTY] Failed to spawn PTY for id=${id}`, e);
    }
  }

  private onKeystroke(_event: IpcMainEvent, payload: KeystrokePayload) {
    if (!payload || !Number.isInteger(payload.id)) return;
    const term = this.terms.get(payload.id);
    if (!term) return;
    try {
      term.write(payload.data);
    } catch (e) {
      console.warn(`[PTY] write failed for id=${payload.id}`, e);
    }
  }

  private onKill(_event: IpcMainEvent, id: number) {
    if (!Number.isInteger(id)) return;
    const term = this.terms.get(id);
    if (!term) return;
    try {
      term.kill();
    } catch (e) {
      console.warn(`[PTY] kill failed for id=${id}`, e);
    } finally {
      this.terms.delete(id);
    }
  }

  private onResize(_event: IpcMainEvent, payload: ResizePayload) {
    if (
      !payload ||
      !Number.isInteger(payload.id) ||
      !Number.isInteger(payload.cols) ||
      !Number.isInteger(payload.rows)
    )
      return;
    const term = this.terms.get(payload.id);
    if (!term) return;
    try {
      term.resize(payload.cols, payload.rows);
    } catch (e) {
      console.warn(
        `[PTY] resize failed for id=${payload.id} -> ${payload.cols}x${payload.rows}`,
        e
      );
    }
  }

  private getDefaultShell(): string {
    if (process.platform === "win32")
      return process.env.COMSPEC ?? "powershell.exe";
    return process.env.SHELL ?? "/bin/bash";
  }

  public dispose() {
    this.listeners.forEach((off) => off());
    this.listeners.length = 0;
    for (const [id, term] of this.terms) {
      try {
        term.kill();
      } catch {}
      this.terms.delete(id);
    }
  }
}
