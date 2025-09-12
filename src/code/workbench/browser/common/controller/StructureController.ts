export class StructureController {
  private variables = new Map<string, number>();
  private functions = new Map<string, number>();
  private classes = new Map<string, number>();
  private classFunctions = new Map<string, Map<string, number>>();
  private lastUpdateHash = "";

  constructor() {}

  public addVariable(name: string, lineRef: number) {
    this.variables.set(name, lineRef);
    this.notifyUIUpdate();
  }

  public addFunction(name: string, lineRef: number) {
    this.functions.set(name, lineRef);
    this.notifyUIUpdate();
  }

  public addClass(name: string, lineRef: number) {
    this.classes.set(name, lineRef);
    this.notifyUIUpdate();
  }

  public addFunctionToClass(
    className: string,
    functionName: string,
    lineRef: number
  ) {
    if (!this.classFunctions.has(className)) {
      this.classFunctions.set(className, new Map<string, number>());
    }
    this.classFunctions.get(className)?.set(functionName, lineRef);
    this.notifyUIUpdate();
  }

  public getVariables() {
    return this.variables;
  }

  public getFunctions() {
    return this.functions;
  }

  public getClasses() {
    return this.classes;
  }

  public getClassFunctions() {
    return this.classFunctions;
  }

  public reset() {
    this.variables.clear();
    this.functions.clear();
    this.classes.clear();
    this.classFunctions.clear();
  }

  private generateStructureHash(structure: {
    variables: Array<{ name: string; line: number }>;
    functions: Array<{ name: string; line: number }>;
    classes: Array<{
      name: string;
      line: number;
      methods?: Array<{ name: string; line: number }>;
    }>;
  }): string {
    return JSON.stringify({
      variables: structure.variables.sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      functions: structure.functions.sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      classes: structure.classes.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  public updateStructure(structure: {
    variables: Array<{ name: string; line: number }>;
    functions: Array<{ name: string; line: number }>;
    classes: Array<{
      name: string;
      line: number;
      methods?: Array<{ name: string; line: number }>;
    }>;
  }) {
    const totalItems =
      structure.variables.length +
      structure.functions.length +
      structure.classes.length;

    if (totalItems === 0) {
      return;
    }

    const newHash = this.generateStructureHash(structure);
    if (newHash === this.lastUpdateHash) {
      return;
    }

    this.lastUpdateHash = newHash;
    this.reset();

    structure.variables.forEach(({ name, line }) => {
      this.variables.set(name, line);
    });

    structure.functions.forEach(({ name, line }) => {
      this.functions.set(name, line);
    });

    structure.classes.forEach(({ name, line, methods = [] }) => {
      this.classes.set(name, line);
      methods.forEach((method) => {
        if (!this.classFunctions.has(name)) {
          this.classFunctions.set(name, new Map<string, number>());
        }
        this.classFunctions.get(name)?.set(method.name, method.line);
      });
    });

    this.notifyUIUpdate();
  }

  private notifyUIUpdate() {
    window.dispatchEvent(
      new CustomEvent("file-structure-updated", {
        detail: {
          variables: Array.from(this.variables.entries()),
          functions: Array.from(this.functions.entries()),
          classes: Array.from(this.classes.entries()),
          classFunctions: Array.from(this.classFunctions.entries()).map(
            ([className, methods]) => [className, Array.from(methods.entries())]
          ),
        },
      })
    );
  }
}
