interface Command {
  name: string;
  handler: Function;
  description?: string;
  category?: string;
}

export class Commands {
  private commands = new Map<string, Command>();

  public addCommand(
    name: string,
    handler: Function,
    description?: string,
    category?: string
  ): void {
    this.commands.set(name, {
      name,
      handler,
      description,
      category,
    });
  }

  async runCommand(name: string, ...args: any[]): Promise<any> {
    const command = this.commands.get(name);

    if (!command) {
      this.showError(`Command '${name}' does not exist.`);
      return;
    }

    try {
      const result = await command.handler(...args);
      return result;
    } catch (error) {
      console.error(`Error executing command '${name}':`, error);
      this.showError(
        `Failed to execute command '${name}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  public hasCommand(name: string): boolean {
    return this.commands.has(name);
  }

  public removeCommand(name: string): boolean {
    return this.commands.delete(name);
  }

  public getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  public getCommandsByCategory(category: string): Command[] {
    return Array.from(this.commands.values()).filter(
      (cmd) => cmd.category === category
    );
  }

  public clearAllCommands(): void {
    this.commands.clear();
  }

  public getCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  public addCommands(commandMap: Record<string, Function | Command>): void {
    Object.entries(commandMap).forEach(([name, command]) => {
      if (typeof command === "function") {
        this.addCommand(name, command);
      } else {
        this.addCommand(
          name,
          command.handler,
          command.description,
          command.category
        );
      }
    });
  }

  private showError(message: string): void {
    window.ipc.invoke("show-error-message-box", {
      title: "Command Error",
      content: message,
    });
  }
}
