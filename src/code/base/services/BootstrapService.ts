import { spawn, exec } from "child_process";
import { promisify } from "util";
import { log } from "../common/functions.js";
import * as os from "os";
import { bootstrapWindow, mainWindow } from "../../../main.js";
import { StorageService } from "./StorageService.js";

const execAsync = promisify(exec);

class MessageQueue {
  private queue: string[] = [];
  private isProcessing = false;

  async enqueue(message: string) {
    this.queue.push(message);
    if (!this.isProcessing) await this.processQueue();
  }

  private async processQueue() {
    this.isProcessing = true;
    while (this.queue.length) {
      const msg = this.queue.shift();
      if (msg) {
        bootstrapWindow.webContents.send("bootstrap-message-update", msg);
        await new Promise((res) => setTimeout(res, 1500));
      }
    }
    this.isProcessing = false;
  }
}

interface DependencyCheck {
  name: string;
  command: string;
  version?: string;
  installCommand?: string | { [key: string]: string };
  required: boolean;
}

export class BootstrapService {
  private msgQueue = new MessageQueue();
  private dependencies: DependencyCheck[] = [
    {
      name: "Python",
      command: "python --version",
      installCommand: {
        win32: "winget install Python.Python.3 || choco install python",
        darwin: "brew install python",
        linux:
          "sudo apt-get install python3 || sudo yum install python3 || sudo pacman -S python",
        default: "Please install Python from https://python.org",
      },
      required: true,
    },
    {
      name: "pip",
      command: "pip --version",
      installCommand: {
        win32: "python -m ensurepip --upgrade",
        darwin: "python3 -m ensurepip --upgrade || brew install python",
        linux:
          "sudo apt-get install python3-pip || sudo yum install python3-pip || sudo pacman -S python-pip",
        default:
          "curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python get-pip.py",
      },
      required: true,
    },
    {
      name: "IPython",
      command: "python -m IPython --version",
      installCommand: {
        linux: "pip3 install ipython --break-system-packages",
        darwin: "pip3 install ipython --break-system-packages",
        win32: "pip install ipython",
        default: "pip install ipython",
      },
      required: true,
    },
  ];

  private status: Map<string, boolean> = new Map();

  public static getBootstrapStatus() {
    const v = StorageService.get("bootstrap-status");
    if (v) return true;
    else return false;
  }

  constructor() {
    this.setupService();
    log("debug", `Main Window: ${bootstrapWindow.webContents.send}`);
  }

  private async completeEvent() {
    await this.updateMessage("Setup Complete - Meridia is ready to use!");
    StorageService.set("bootstrap-status", true);

    setTimeout(() => {
      bootstrapWindow.destroy();
      mainWindow.show();
    }, 1000);
  }

  private getOSPlatform(): string {
    const platform = os.platform();
    switch (platform) {
      case "win32":
        return "win32";
      case "darwin":
        return "darwin";
      case "linux":
        return "linux";
      default:
        return "default";
    }
  }

  private getInstallCommand(dep: DependencyCheck): string {
    if (typeof dep.installCommand === "string") {
      return dep.installCommand;
    }

    if (typeof dep.installCommand === "object") {
      const platform = this.getOSPlatform();

      return (
        dep.installCommand[platform] || dep.installCommand["default"] || ""
      );
    }

    return "";
  }

  private async setupService() {
    try {
      log("info", "Initializing Bootstrap Service...");
      log("info", `Detected OS: ${this.getOSPlatform()}`);

      await this.updateMessage("Initializing Meridia IDE setup process...");
      await this.updateMessage(
        `Platform detected: ${this.getOSPlatform().toUpperCase()}`
      );

      await this.checkAllDependencies();

      log("info", "Bootstrap service initialized successfully");
      await this.completeEvent();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log("error", `Bootstrap service initialization failed: ${errorMessage}`);
      await this.updateMessage(`Setup failed: ${errorMessage}`);
    }
  }

  private async updateMessage(message: string): Promise<void> {
    await this.msgQueue.enqueue(message);
  }

  private async checkAllDependencies(): Promise<void> {
    try {
      log("info", "Checking dependencies...");
      await this.updateMessage("Scanning system for required dependencies...");

      for (let i = 0; i < this.dependencies.length; i++) {
        const dep = this.dependencies[i];
        const progress = `[${i + 1}/${this.dependencies.length}]`;

        try {
          await this.updateMessage(
            `${progress} Checking ${dep.name} installation status...`
          );

          const result = await this.checkDependency(dep);
          this.status.set(dep.name, result);

          if (result) {
            log(
              "info",
              `${dep.name} - Available${dep.version ? ` (${dep.version})` : ""}`
            );
            await this.updateMessage(
              `${progress} ${dep.name} detected and verified${dep.version ? ` - ${dep.version}` : ""}`
            );
          } else if (dep.required) {
            log("error", `${dep.name} - Missing (Required)`);
            await this.updateMessage(
              `${progress} ${dep.name} not found - Starting installation process...`
            );

            await this.handleMissingDependency(dep);
          } else {
            log("warn", `${dep.name} - Missing (Optional)`);
            await this.updateMessage(
              `${progress} ${dep.name} not found - marked as optional`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          log("error", `${dep.name} - Check failed: ${errorMessage}`);
          this.status.set(dep.name, false);
          await this.updateMessage(
            `${progress} ${dep.name} verification failed: ${errorMessage}`
          );
        }
      }

      await this.updateMessage(
        "All dependency verifications completed successfully"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log("error", `Dependency check process failed: ${errorMessage}`);
      await this.updateMessage(
        `Dependency verification process failed: ${errorMessage}`
      );

      throw error;
    }
  }

  private async checkDependency(dep: DependencyCheck): Promise<boolean> {
    try {
      const { stdout, stderr } = await execAsync(dep.command);

      if (dep.name === "Python" || dep.name === "Python3") {
        dep.version = stdout.trim();
      } else if (dep.name === "IPython") {
        dep.version = stdout.trim();
      } else if (dep.name === "pip") {
        dep.version = stdout.split("\n")[0].trim();
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private async handleMissingDependency(dep: DependencyCheck): Promise<void> {
    try {
      const installCommand = this.getInstallCommand(dep);

      if (!installCommand) {
        const errorMsg = `${dep.name} is required but no install command provided`;
        await this.updateMessage(
          `Cannot install ${dep.name} - No installation method available`
        );
        throw new Error(errorMsg);
      }

      log("info", `Attempting to install ${dep.name}...`);
      await this.updateMessage(
        `Preparing ${dep.name} installation for ${this.getOSPlatform()}...`
      );
      log("info", `Platform: ${this.getOSPlatform()}`);

      if (installCommand.startsWith("pip install")) {
        await this.installPipPackage(
          installCommand.replace("pip install ", ""),
          dep.name
        );
      } else if (installCommand.includes("||")) {
        await this.tryMultipleCommands(installCommand, dep.name);
      } else {
        log("warn", `Manual installation required for ${dep.name}:`);
        await this.updateMessage(
          `Attempting automated installation of ${dep.name}...`
        );
        log("info", `Command: ${installCommand}`);

        if (this.isAutoInstallable(installCommand)) {
          await this.executeInstallCommand(installCommand, dep.name);
        } else {
          await this.updateMessage(`${dep.name} requires manual installation`);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log("error", `Failed to install ${dep.name}: ${errorMessage}`);
      await this.updateMessage(
        `Installation failed for ${dep.name}: ${errorMessage.substring(0, 50)}...`
      );
    }
  }

  private async tryMultipleCommands(
    commandString: string,
    depName: string
  ): Promise<void> {
    const commands = commandString.split(" || ").map((cmd) => cmd.trim());
    const errors: string[] = [];

    await this.updateMessage(
      `Attempting multiple installation methods for ${depName}...`
    );

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];

      try {
        await this.updateMessage(
          `Installation Method ${i + 1} of ${commands.length}: Processing command...`
        );
        await this.executeInstallCommand(cmd, depName);
        log("info", `Successfully installed ${depName} using: ${cmd}`);
        await this.updateMessage(
          `Successfully installed ${depName} using method ${i + 1}`
        );

        return;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        log("warn", `Command failed: ${cmd} - ${errorMessage}`);
        errors.push(`${cmd}: ${errorMessage}`);
        await this.updateMessage(
          `Method ${i + 1} unsuccessful, trying alternative method...`
        );
        continue;
      }
    }

    const allErrors = errors.join("; ");
    await this.updateMessage(`All installation methods failed for ${depName}`);

    throw new Error(
      `All installation commands failed for ${depName}: ${allErrors}`
    );
  }

  private isAutoInstallable(command: string): boolean {
    const autoInstallableCommands = [
      "winget install",
      "choco install",
      "brew install",
      "python -m ensurepip",
      "apt-get install",
      "yum install",
      "pacman -S",
    ];

    return autoInstallableCommands.some((cmd) => command.includes(cmd));
  }

  private async executeInstallCommand(
    command: string,
    depName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      log("info", `Executing: ${command}`);
      this.updateMessage(`Executing installation command for ${depName}...`);

      const process = exec(command, { timeout: 180000 });

      let progressCounter = 25;
      let errorOutput = "";

      const progressInterval = setInterval(() => {
        if (progressCounter < 85) {
          progressCounter += 15;
          this.updateMessage(
            `Installing ${depName}... Progress: ${progressCounter}%`
          );
        }
      }, 4000);

      process.stdout?.on("data", (data) => {
        log("info", data.toString().trim());
      });

      process.stderr?.on("data", (data) => {
        const errorData = data.toString().trim();
        errorOutput += errorData + "\n";
        log("warn", errorData);
      });

      process.on("close", (code) => {
        clearInterval(progressInterval);
        if (code === 0) {
          log("info", `${depName} installation command completed`);
          this.updateMessage(`${depName} installation completed successfully`);
          resolve();
        } else {
          const errorMsg = `Installation failed with exit code ${code}`;
          const fullError = errorOutput
            ? `${errorMsg}\n${errorOutput}`
            : errorMsg;

          this.updateMessage(
            `${depName} installation failed with exit code ${code}`
          );
          reject(new Error(fullError));
        }
      });

      process.on("error", (error) => {
        clearInterval(progressInterval);
        this.updateMessage(
          `Installation process error occurred for ${depName}`
        );
        reject(error);
      });
    });
  }

  private async installPipPackage(
    packageName: string,
    depName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.updateMessage(`Installing Python package: ${packageName}...`);

      const process = spawn("pip", ["install", packageName], {
        stdio: ["inherit", "pipe", "pipe"],
      });

      let output = "";
      let errorOutput = "";
      let progressCounter = 20;

      const progressInterval = setInterval(() => {
        if (progressCounter < 80) {
          progressCounter += 20;
          this.updateMessage(
            `Installing ${packageName}... Progress: ${progressCounter}%`
          );
        }
      }, 2500);

      process.stdout.on("data", (data) => {
        output += data.toString();
        log("info", data.toString().trim());
      });

      process.stderr.on("data", (data) => {
        const errorData = data.toString().trim();
        errorOutput += errorData + "\n";
        log("warn", errorData);
      });

      process.on("close", (code) => {
        clearInterval(progressInterval);
        if (code === 0) {
          log("info", `${packageName} installed successfully`);
          this.updateMessage(`${packageName} installed successfully via pip`);
          resolve();
        } else {
          const errorMsg = `Installation failed with exit code ${code}`;
          const fullError = errorOutput
            ? `${errorMsg}\n${errorOutput}`
            : errorMsg;

          this.updateMessage(`Failed to install ${packageName} via pip`);
          reject(new Error(fullError));
        }
      });

      process.on("error", (error) => {
        clearInterval(progressInterval);
        this.updateMessage(
          `Pip installation error occurred for ${packageName}`
        );
        reject(error);
      });
    });
  }
}
