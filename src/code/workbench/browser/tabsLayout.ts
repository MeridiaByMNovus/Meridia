import { ElementCore } from "./elementCore.js";
import {
  TabsController,
  TabsConfig,
} from "./common/controller/TabsController.js";

export class TabsLayout extends ElementCore {
  private controller: TabsController;

  constructor(
    private parent: HTMLDivElement,
    private props?: HTMLElement[],
    customBg?: string
  ) {
    super();

    this.createContainer(customBg);

    const config: TabsConfig = {
      customBg,
      extraButtons: this.props,
    };

    this.controller = new TabsController(
      this.elementEl as HTMLDivElement,
      config
    );
    this.setupLayout();
    this.parent.appendChild(this.elementEl!);
  }

  private createContainer(customBg?: string) {
    this.elementEl = document.createElement("div");
    this.elementEl.className = "tabs-layout-container";
    this.elementEl.style.cssText = `
      background: ${customBg || "var(--tabs-wrapper-bg)"};
    `;
  }

  private setupLayout() {
    // Add wrapper to container
    this.elementEl!.appendChild(this.controller.getWrapper());

    // Add extra buttons container if it exists
    const extraButtonsContainer = this.controller.getExtraButtonsContainer();
    if (extraButtonsContainer) {
      this.elementEl!.appendChild(extraButtonsContainer);
    }
  }

  public addTab(tab: HTMLDivElement): void {
    this.controller.addTab(tab);
  }

  public removeAllTabs(): void {
    this.controller.removeAllTabs();
  }

  public hide(): void {
    if (this.elementEl) {
      this.elementEl.style.display = "none";
    }
  }

  public show(): void {
    if (this.elementEl) {
      this.elementEl.style.display = "flex";
      this.controller.show();
    }
  }

  public refresh(): void {
    this.controller.updateScrollbar();
  }

  public scrollToEnd(): void {
    this.controller.scrollToEnd();
  }

  public destroy(): void {
    this.controller.destroy();
    this.elementEl?.remove();
  }
}
