import { EditorService } from "../../editor/common/EditorService.js";
import {
  chevronDownIcon,
  chevronRightIcon,
  classIcon,
  functionIcon,
  variableIcon,
} from "../common/svgIcons.js";
import { StructureController } from "./common/controller/StructureController.js";
import { ElementCore } from "./elementCore.js";

export class StructureLayout extends ElementCore {
  structureController: StructureController;
  private structureUpdateListener: (event: Event) => void;

  constructor(
    private editorService: EditorService,
    structureController: StructureController
  ) {
    super();
    this.structureController = structureController;

    this.structureUpdateListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      this.refreshStructureFromEvent(customEvent.detail);
    };

    this.render();
    this.setupEventListeners();
    this.setupStructureUpdateListener();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.className = "structure-wrapper scrollbar-container";

    const header = document.createElement("div");
    header.className = "structure-header";

    const title = document.createElement("h3");
    title.textContent = "Structure";

    const controls = document.createElement("div");
    controls.className = "structure-controls";

    header.appendChild(title);
    header.appendChild(controls);

    const content = document.createElement("div");
    content.className = "structure-content";

    const tree = document.createElement("div");
    tree.className = "structure-tree";

    content.appendChild(tree);
    this.elementEl.appendChild(header);
    this.elementEl.appendChild(content);

    this.updateStructureTree();
  }

  private setupStructureUpdateListener() {
    window.addEventListener(
      "python-structure-updated",
      this.structureUpdateListener
    );
  }

  private refreshStructureFromEvent(data: any) {
    const treeContainer = this.elementEl?.querySelector(".structure-tree");
    if (!treeContainer) return;

    treeContainer.innerHTML = "";

    const hasVariables = data.variables && data.variables.length > 0;
    const hasFunctions = data.functions && data.functions.length > 0;
    const hasClasses = data.classes && data.classes.length > 0;

    if (!hasVariables && !hasFunctions && !hasClasses) {
      const emptyState = document.createElement("div");
      emptyState.className = "structure-empty";
      emptyState.textContent = "No Python structure found";
      treeContainer.appendChild(emptyState);
      return;
    }

    if (hasVariables) {
      data.variables.forEach(([name, line]: [string, number]) => {
        const variableItem = this.createVariableItem(name, line);
        treeContainer.appendChild(variableItem);
      });
    }

    if (hasFunctions) {
      data.functions.forEach(([name, line]: [string, number]) => {
        const functionItem = this.createFunctionItem(name, line);
        treeContainer.appendChild(functionItem);
      });
    }

    if (hasClasses) {
      data.classes.forEach(([className, line]: [string, number]) => {
        const classItem = this.createClassItemWithMethods(
          className,
          line,
          data.classFunctions
        );
        treeContainer.appendChild(classItem);
      });
    }
  }

  private createClassItemWithMethods(
    className: string,
    line: number,
    classFunctions?: any[]
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = "structure-class-container";

    const classHeader = document.createElement("div");
    classHeader.className = "structure-item class-item";
    classHeader.setAttribute("data-line", line.toString());
    classHeader.setAttribute("data-collapsible", "true");

    const collapseIcon = document.createElement("span");
    collapseIcon.className = "collapse-icon";
    collapseIcon.innerHTML = chevronDownIcon;

    const classIconEl = document.createElement("span");
    classIconEl.className = "item-icon";
    classIconEl.innerHTML = classIcon;

    const className_ = document.createElement("span");
    className_.className = "item-name";
    className_.textContent = className;

    classHeader.appendChild(collapseIcon);
    classHeader.appendChild(classIconEl);
    classHeader.appendChild(className_);

    container.appendChild(classHeader);

    const methodsContainer = document.createElement("div");
    methodsContainer.className = "class-methods";

    if (classFunctions) {
      const classMethodsData = classFunctions.find(
        ([name]: [string, any]) => name === className
      );
      if (classMethodsData && classMethodsData[1].length > 0) {
        classMethodsData[1].forEach(
          ([methodName, methodLine]: [string, number]) => {
            const methodItem = document.createElement("div");
            methodItem.className = "structure-item method-item";
            methodItem.setAttribute("data-line", methodLine.toString());

            const methodIcon = document.createElement("span");
            methodIcon.className = "item-icon";
            methodIcon.innerHTML = functionIcon;

            const methodName_ = document.createElement("span");
            methodName_.className = "item-name";
            methodName_.textContent = methodName;

            methodItem.appendChild(methodIcon);
            methodItem.appendChild(methodName_);
            methodsContainer.appendChild(methodItem);
          }
        );
      }
    }

    container.appendChild(methodsContainer);
    return container;
  }

  private updateStructureTree() {
    const treeContainer = this.elementEl?.querySelector(".structure-tree");
    if (!treeContainer) return;

    treeContainer.innerHTML = "";

    const hasContent =
      this.structureController.getVariables().size > 0 ||
      this.structureController.getFunctions().size > 0 ||
      this.structureController.getClasses().size > 0;

    if (!hasContent) {
      const emptyState = document.createElement("div");
      emptyState.className = "structure-empty";
      emptyState.textContent = "No structure available";
      treeContainer.appendChild(emptyState);
      return;
    }

    this.structureController.getVariables().forEach((lineRef, name) => {
      const variableItem = this.createVariableItem(name, lineRef);
      treeContainer.appendChild(variableItem);
    });

    this.structureController.getFunctions().forEach((lineRef, name) => {
      const functionItem = this.createFunctionItem(name, lineRef);
      treeContainer.appendChild(functionItem);
    });

    this.structureController.getClasses().forEach((lineRef, className) => {
      const classSection = this.createClassSection(className, lineRef);
      treeContainer.appendChild(classSection);
    });
  }

  private createVariableItem(name: string, lineRef: number): HTMLElement {
    const item = document.createElement("div");
    item.className = "structure-item variable-item";
    item.setAttribute("data-line", lineRef.toString());

    const itemIcon = document.createElement("span");
    itemIcon.className = "item-icon";
    itemIcon.innerHTML = variableIcon;

    const itemName = document.createElement("span");
    itemName.className = "item-name";
    itemName.textContent = name;

    item.appendChild(itemIcon);
    item.appendChild(itemName);

    return item;
  }

  private createFunctionItem(name: string, lineRef: number): HTMLElement {
    const item = document.createElement("div");
    item.className = "structure-item function-item";
    item.setAttribute("data-line", lineRef.toString());

    const itemIcon = document.createElement("span");
    itemIcon.className = "item-icon";
    itemIcon.innerHTML = functionIcon;

    const itemName = document.createElement("span");
    itemName.className = "item-name";
    itemName.textContent = name;

    item.appendChild(itemIcon);
    item.appendChild(itemName);

    return item;
  }

  private createClassSection(className: string, lineRef: number): HTMLElement {
    const classFunctions = this.structureController.getClassFunctions();
    const methods = classFunctions.get(className);

    const container = document.createElement("div");
    container.className = "structure-class-container";

    const header = document.createElement("div");
    header.className = "structure-item class-item";
    header.setAttribute("data-collapsible", "true");
    header.setAttribute("data-line", lineRef.toString());

    const collapseIcon = document.createElement("span");
    collapseIcon.className = "collapse-icon";
    collapseIcon.innerHTML = chevronDownIcon;

    const sectionIcon = document.createElement("span");
    sectionIcon.className = "item-icon";
    sectionIcon.innerHTML = classIcon;

    const sectionTitle = document.createElement("span");
    sectionTitle.className = "item-name";
    sectionTitle.textContent = className;

    header.appendChild(collapseIcon);
    header.appendChild(sectionIcon);
    header.appendChild(sectionTitle);

    const content = document.createElement("div");
    content.className = "class-methods";

    if (methods && methods.size > 0) {
      methods.forEach((methodLine, methodName) => {
        const methodItem = document.createElement("div");
        methodItem.className = "structure-item method-item";
        methodItem.setAttribute("data-line", methodLine.toString());

        const methodIcon = document.createElement("span");
        methodIcon.className = "item-icon";
        methodIcon.innerHTML = functionIcon;

        const methodName_ = document.createElement("span");
        methodName_.className = "item-name";
        methodName_.textContent = methodName;

        methodItem.appendChild(methodIcon);
        methodItem.appendChild(methodName_);
        content.appendChild(methodItem);
      });
    }

    container.appendChild(header);
    container.appendChild(content);

    return container;
  }

  private setupEventListeners() {
    if (!this.elementEl) return;

    this.elementEl.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.closest('[data-collapsible="true"]')) {
        const header = target.closest(
          '[data-collapsible="true"]'
        ) as HTMLElement;
        const container = header.parentElement;
        const content = container?.querySelector(
          ".class-methods"
        ) as HTMLElement;
        const icon = header.querySelector(".collapse-icon") as HTMLElement;

        if (content && icon) {
          const isCollapsed = content.style.display === "none";
          content.style.display = isCollapsed ? "block" : "none";
          icon.innerHTML = isCollapsed ? chevronDownIcon : chevronRightIcon;
        }

        const line = header?.dataset.line;
        if (line) {
          this.navigateToLine(parseInt(line));
        }
        return;
      }

      if (target.closest(".structure-item")) {
        const clickedElement = target.closest(".structure-item") as HTMLElement;
        const line = clickedElement?.dataset.line;
        if (line) {
          this.navigateToLine(parseInt(line));
        }
      }
    });
  }

  private navigateToLine(line: number) {
    const editor = this.editorService.editor;
    if (!editor) return;

    editor.setPosition({ lineNumber: line, column: 1 });

    editor.focus();
  }

  public refreshStructure() {
    this.updateStructureTree();
  }

  public forceRefresh() {
    const eventData = {
      variables: Array.from(this.structureController.getVariables().entries()),
      functions: Array.from(this.structureController.getFunctions().entries()),
      classes: Array.from(this.structureController.getClasses().entries()),
      classFunctions: Array.from(
        this.structureController.getClassFunctions().entries()
      ).map(([className, methods]) => [
        className,
        Array.from(methods.entries()),
      ]),
    };

    this.refreshStructureFromEvent(eventData);
  }

  public destroy() {
    window.removeEventListener(
      "python-structure-updated",
      this.structureUpdateListener
    );
  }
}
