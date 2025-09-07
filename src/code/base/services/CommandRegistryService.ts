import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from "electron";
import { mainWindow } from "../../../main.js";
import { log } from "../common/functions.js";

type CommandHandler = (
  event: IpcMainInvokeEvent | IpcMainEvent,
  ...args: any[]
) => any;

export class CommandRegistry {
  private window = mainWindow;
  private commands: Map<string, CommandHandler> = new Map();

  constructor() {
    log("info", "CommandRegistry instance created");
    log("debug", "Initial state", {
      windowExists: !!this.window,
      commandsCount: this.commands.size,
    });
  }

  send = (command: string, data?: any) => {
    log("debug", "Sending command to renderer", { command, hasData: !!data });

    if (!this.window) {
      log("error", "Cannot send command: window is null", { command });
      return;
    }

    if (!this.window.webContents) {
      log("error", "Cannot send command: webContents is null", { command });
      return;
    }

    try {
      this.window.webContents.send(command, data);
      log("info", "Command sent successfully", {
        command,
        dataType: typeof data,
      });
    } catch (error) {
      log("error", "Failed to send command", {
        command,
        error: error.message,
        windowDestroyed: this.window.isDestroyed(),
      });
    }
  };

  register = (command: string, handler: CommandHandler) => {
    log("info", "Registering command", {
      command,
      handlerType: typeof handler,
    });

    if (typeof handler !== "function") {
      log("error", "Invalid handler type for command", {
        command,
        handlerType: typeof handler,
      });
      return;
    }

    // Check if command already exists
    if (this.commands.has(command)) {
      log("warn", "Overriding existing command handler", { command });
    }

    this.commands.set(command, handler);
    log("debug", "Command added to registry", {
      command,
      totalCommands: this.commands.size,
    });

    // Determine registration type based on command prefix
    const isHandleCommand =
      command.startsWith("get-") ||
      command.startsWith("run-") ||
      command.startsWith("open-");

    if (isHandleCommand) {
      log("debug", "Registering as handle command", { command });

      ipcMain.handle(command, async (event, ...args) => {
        const startTime = Date.now();
        log("debug", "Handle command invoked", {
          command,
          argsCount: args.length,
          argsTypes: args.map((arg) => typeof arg),
        });

        try {
          const result = await handler(event, ...args);
          const duration = Date.now() - startTime;

          log("info", "Handle command completed successfully", {
            command,
            duration: `${duration}ms`,
            resultType: typeof result,
            hasResult: result !== undefined,
          });

          return result;
        } catch (err) {
          const duration = Date.now() - startTime;
          log("error", "Handle command failed", {
            command,
            duration: `${duration}ms`,
            error: err.message,
            stack: err.stack,
            args: args.map((arg) => ({ type: typeof arg, value: arg })),
          });
          throw err;
        }
      });
    } else {
      log("debug", "Registering as event listener command", { command });

      ipcMain.on(command, async (event, ...args) => {
        const startTime = Date.now();
        log("debug", "Event command received", {
          command,
          argsCount: args.length,
          argsTypes: args.map((arg) => typeof arg),
        });

        try {
          await handler(event, ...args);
          const duration = Date.now() - startTime;

          log("info", "Event command completed successfully", {
            command,
            duration: `${duration}ms`,
          });
        } catch (err) {
          const duration = Date.now() - startTime;
          log("error", "Event command failed", {
            command,
            duration: `${duration}ms`,
            error: err.message,
            stack: err.stack,
            args: args.map((arg) => ({ type: typeof arg, value: arg })),
          });
        }
      });
    }

    log("info", "Command registered successfully", {
      command,
      registrationType: isHandleCommand ? "handle" : "event",
      totalRegisteredCommands: this.commands.size,
    });
  };

  execute = async (command: string, ...args: any[]) => {
    const startTime = Date.now();
    log("info", "Executing command locally", {
      command,
      argsCount: args.length,
      argsTypes: args.map((arg) => typeof arg),
    });

    const handler = this.commands.get(command);

    if (!handler) {
      log("warn", "No handler found for command", {
        command,
        availableCommands: Array.from(this.commands.keys()),
        totalCommands: this.commands.size,
      });
      return;
    }

    log("debug", "Handler found, executing", { command });

    try {
      const result = await handler({} as any, ...args);
      const duration = Date.now() - startTime;

      log("info", "Command executed successfully", {
        command,
        duration: `${duration}ms`,
        resultType: typeof result,
        hasResult: result !== undefined,
      });

      return result;
    } catch (err) {
      const duration = Date.now() - startTime;
      log("error", "Command execution failed", {
        command,
        duration: `${duration}ms`,
        error: err.message,
        stack: err.stack,
        args: args.map((arg) => ({ type: typeof arg, value: arg })),
      });
      throw err;
    }
  };

  // Additional utility methods for debugging
  getRegisteredCommands = () => {
    const commands = Array.from(this.commands.keys());
    log("debug", "Retrieved registered commands list", {
      commands,
      count: commands.length,
    });
    return commands;
  };

  hasCommand = (command: string) => {
    const exists = this.commands.has(command);
    log("debug", "Command existence check", { command, exists });
    return exists;
  };

  unregister = (command: string) => {
    log("info", "Unregistering command", { command });

    const existed = this.commands.has(command);
    if (existed) {
      this.commands.delete(command);

      // Remove IPC handlers
      try {
        ipcMain.removeHandler(command);
        log("debug", "IPC handle handler removed", { command });
      } catch (error) {
        // Handler might not exist, try removing listeners
        ipcMain.removeAllListeners(command);
        log("debug", "IPC event listeners removed", { command });
      }

      log("info", "Command unregistered successfully", {
        command,
        remainingCommands: this.commands.size,
      });
    } else {
      log("warn", "Attempted to unregister non-existent command", { command });
    }

    return existed;
  };

  clear = () => {
    log("info", "Clearing all commands", { currentCount: this.commands.size });

    const commands = Array.from(this.commands.keys());
    commands.forEach((command) => this.unregister(command));

    log("info", "All commands cleared", { clearedCount: commands.length });
  };

  getStats = () => {
    const stats = {
      totalCommands: this.commands.size,
      handleCommands: 0,
      eventCommands: 0,
      commandsByPrefix: {} as Record<string, number>,
    };

    Array.from(this.commands.keys()).forEach((command) => {
      if (
        command.startsWith("get-") ||
        command.startsWith("run-") ||
        command.startsWith("open-")
      ) {
        stats.handleCommands++;
      } else {
        stats.eventCommands++;
      }

      const prefix = command.split("-")[0];
      stats.commandsByPrefix[prefix] =
        (stats.commandsByPrefix[prefix] || 0) + 1;
    });

    log("debug", "Command registry statistics", stats);
    return stats;
  };
}
