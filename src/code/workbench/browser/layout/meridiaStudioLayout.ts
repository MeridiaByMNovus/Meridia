export class MeridiaStudioLayout {
  private wrapperEl: HTMLDivElement | null = null;

  constructor() {
    this.render();
  }

  private render() {
    this.wrapperEl = document.createElement("div");
  }

  getDomElement() {
    return this.wrapperEl as HTMLDivElement;
  }
}
