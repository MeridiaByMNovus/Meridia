import {
  handleNewFile,
  handleOpenFile,
  handleOpenFolder,
  handleSaveCurrentFile,
  handleOpenSettings,
  handleOpenSidebar,
  handleOpenRightPanel,
  handleOpenBottomPanel,
  handleOpenTerminal,
  handleRun,
  log,
} from "../common/functions.js";
import { CommandRegistry } from "./CommandRegistryService.js";

// Command wrapper for logging
function wrapHandler(commandName: string, handler: Function) {
  return async (...args: any[]) => {
    const startTime = Date.now();
    log("debug", `Executing command: ${commandName}`, {
      argsCount: args.length,
      argsTypes: args.map((arg) => typeof arg),
    });

    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;

      log("info", `Command completed: ${commandName}`, {
        duration: `${duration}ms`,
        success: true,
        resultType: typeof result,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      log("error", `Command failed: ${commandName}`, {
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
        args: args.map((arg, index) => ({
          index,
          type: typeof arg,
          value: arg,
        })),
      });

      throw error;
    }
  };
}

export class CommandService {
  private commandRegistry: CommandRegistry;
  private registeredCommands: Set<string> = new Set();

  constructor() {
    log("info", "CommandService initializing...");

    try {
      this.commandRegistry = new CommandRegistry();
      log("debug", "CommandRegistry instance created");

      this.registerDefaultCommands();

      log("info", "CommandService initialized successfully", {
        totalCommands: this.registeredCommands.size,
        commands: Array.from(this.registeredCommands),
      });
    } catch (error) {
      log("error", "Failed to initialize CommandService", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private registerDefaultCommands() {
    log("info", "Registering default commands...");

    const commandMappings = [
      {
        command: "new",
        handler: handleNewFile,
        description: "Create new file",
      },
      {
        command: "open",
        handler: handleOpenFile,
        description: "Open existing file",
      },
      {
        command: "open-folder",
        handler: () => handleOpenFolder(),
        description: "Open folder dialog",
      },
      {
        command: "save",
        handler: handleSaveCurrentFile,
        description: "Save current file",
      },
      {
        command: "settings",
        handler: handleOpenSettings,
        description: "Open settings dialog",
      },
      {
        command: "toggle-sidebar",
        handler: handleOpenSidebar,
        description: "Toggle sidebar visibility",
      },
      {
        command: "toggle-right-panel",
        handler: handleOpenRightPanel,
        description: "Toggle right panel visibility",
      },
      {
        command: "toggle-bottom-panel",
        handler: handleOpenBottomPanel,
        description: "Toggle bottom panel visibility",
      },
      {
        command: "open-terminal",
        handler: handleOpenTerminal,
        description: "Open integrated terminal",
      },
      {
        command: "run",
        handler: handleRun,
        description: "Execute/run current file",
      },
    ];

    const registrationResults = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ command: string; error: string }>,
    };

    commandMappings.forEach(({ command, handler, description }) => {
      try {
        log("debug", `Registering command: ${command}`, { description });

        // Validate handler
        if (typeof handler !== "function") {
          throw new Error(
            `Handler for '${command}' is not a function: ${typeof handler}`
          );
        }

        // Wrap handler with logging
        const wrappedHandler = wrapHandler(command, handler);

        // Register with CommandRegistry
        this.commandRegistry.register(command, wrappedHandler);

        // Track registered commands
        this.registeredCommands.add(command);
        registrationResults.successful++;

        log("info", `Command registered successfully: ${command}`, {
          description,
          totalRegistered: this.registeredCommands.size,
        });
      } catch (error) {
        registrationResults.failed++;
        registrationResults.errors.push({
          command,
          error: error.message,
        });

        log("error", `Failed to register command: ${command}`, {
          error: error.message,
          description,
          handlerType: typeof handler,
        });
      }
    });

    // Summary logging
    if (registrationResults.successful > 0) {
      log("info", "Default commands registration completed", {
        successful: registrationResults.successful,
        failed: registrationResults.failed,
        successRate: `${Math.round((registrationResults.successful / commandMappings.length) * 100)}%`,
        registeredCommands: Array.from(this.registeredCommands),
      });
    }

    if (registrationResults.failed > 0) {
      log("warn", "Some commands failed to register", {
        failedCount: registrationResults.failed,
        errors: registrationResults.errors,
      });
    }
  }
}
