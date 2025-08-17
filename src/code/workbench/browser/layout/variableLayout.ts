import { ElementCore } from "./elementCore.js";

export class VariableLayout extends ElementCore {
  private variables: Map<string, string> = new Map();
  private tableEl!: HTMLTableElement;
  private tableBodyEl!: HTMLTableSectionElement;
  private headerEl!: HTMLDivElement;

  constructor() {
    super();
    this.render();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.className = "variable-layout";

    this.headerEl = document.createElement("div");
    this.headerEl.className = "variable-layout-header";

    const titleEl = document.createElement("h3");
    titleEl.textContent = "Variables";
    titleEl.className = "variable-layout-title";

    this.headerEl.appendChild(titleEl);

    this.createTable();

    this.elementEl.appendChild(this.headerEl);
    this.elementEl.appendChild(this.tableEl);
  }

  private createTable() {
    this.tableEl = document.createElement("table");
    this.tableEl.className = "variable-table";

    const tableHeaderEl = document.createElement("thead");
    const headerRowEl = document.createElement("tr");

    const nameHeaderEl = document.createElement("th");
    nameHeaderEl.textContent = "Name";
    nameHeaderEl.className = "variable-table-header";

    const valueHeaderEl = document.createElement("th");
    valueHeaderEl.textContent = "Value";
    valueHeaderEl.className = "variable-table-header";

    const actionsHeaderEl = document.createElement("th");
    actionsHeaderEl.textContent = "Actions";
    actionsHeaderEl.className = "variable-table-header";

    headerRowEl.appendChild(nameHeaderEl);
    headerRowEl.appendChild(valueHeaderEl);
    headerRowEl.appendChild(actionsHeaderEl);
    tableHeaderEl.appendChild(headerRowEl);

    this.tableBodyEl = document.createElement("tbody");

    this.tableEl.appendChild(tableHeaderEl);
    this.tableEl.appendChild(this.tableBodyEl);

    this.renderEmptyState();
  }

  private renderEmptyState() {
    if (this.variables.size === 0) {
      const emptyRowEl = document.createElement("tr");
      emptyRowEl.className = "variable-table-empty";

      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 3;
      emptyCell.textContent = "No variables defined";
      emptyCell.className = "variable-table-empty-cell";

      emptyRowEl.appendChild(emptyCell);
      this.tableBodyEl.appendChild(emptyRowEl);
    }
  }

  private renderTableRows() {
    this.tableBodyEl.innerHTML = "";

    if (this.variables.size === 0) {
      this.renderEmptyState();
      return;
    }

    this.variables.forEach((value, name) => {
      const rowEl = document.createElement("tr");
      rowEl.className = "variable-table-row";

      const nameCell = document.createElement("td");
      nameCell.textContent = name;
      nameCell.className = "variable-table-cell variable-name";

      const valueCell = document.createElement("td");
      valueCell.className = "variable-table-cell";

      const valueTxt = document.createElement("p");
      valueTxt.textContent = value;
      valueTxt.className = "variable-value-txt";

      valueCell.appendChild(valueTxt);

      rowEl.appendChild(nameCell);
      rowEl.appendChild(valueCell);

      this.tableBodyEl.appendChild(rowEl);
    });
  }

  public addVariable(name: string, value: string) {
    this.variables.set(name, value);
    this.renderTableRows();
  }

  public removeVariable(name: string) {
    this.variables.delete(name);
    this.renderTableRows();
  }

  public removeAllVariables() {
    this.variables.clear();
    this.renderTableRows();
  }

  public getAllVariables() {
    return this.variables.values();
  }

  public getVariable(name: string): string | undefined {
    return this.variables.get(name);
  }

  public hasVariable(name: string): boolean {
    return this.variables.has(name);
  }

  public getVariableCount(): number {
    return this.variables.size;
  }
}
