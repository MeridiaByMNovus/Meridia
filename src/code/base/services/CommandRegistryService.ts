import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from "electron";
import { mainWindow } from "../../../main";

type CommandHandler = (
  event: IpcMainInvokeEvent | IpcMainEvent,
  ...args: any[]
) => any;

export class CommandRegistry {
  private window = mainWindow;
  private commands: Map<string, CommandHandler> = new Map();

  send = (command: string, data?: any) => {
    this.window.webContents.send(command, data);
  };

  register = (command: string, handler: CommandHandler) => {
    if (typeof handler !== "function") return;

    this.commands.set(command, handler);

    if (
      command.startsWith("get-") ||
      command.startsWith("run-") ||
      command.startsWith("open-")
    ) {
      ipcMain.handle(command, async (event, ...args) => {
        try {
          return await handler(event, ...args);
        } catch (err) {
          console.error(
            `[CommandRegistry] Failed to handle '${command}':`,
            err
          );
          throw err;
        }
      });
    } else {
      ipcMain.on(command, async (event, ...args) => {
        try {
          await handler(event, ...args);
        } catch (err) {
          console.error(
            `[CommandRegistry] Failed to handle '${command}':`,
            err
          );
        }
      });
    }

    console.log(`[CommandRegistry] Registered command '${command}'`);
  };

  execute = async (command: string, ...args: any[]) => {
    const handler = this.commands.get(command);

    if (!handler) {
      console.warn(
        `[CommandRegistry] No handler found for command '${command}'`
      );
      return;
    }

    try {
      await handler({} as any, ...args);
    } catch (err) {
      console.error(`[CommandRegistry] Error executing '${command}':`, err);
    }
  };
}
