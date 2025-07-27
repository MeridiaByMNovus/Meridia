export class InitElementsService {
  public mainWrapper: HTMLDivElement;

  constructor() {
    this.mainWrapper = document.querySelector(
      ".main-wrapper"
    ) as HTMLDivElement;
  }
}
