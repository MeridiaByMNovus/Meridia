export class ElementCore {
  public elementEl: HTMLDivElement | null = null;

  public getDomElement(): HTMLDivElement | null {
    return this.elementEl;
  }
}
