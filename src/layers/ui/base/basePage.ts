import type { Page } from "@playwright/test";
import { PageActionsContainer } from "./internal/pageActionsContainer.js";
import type { IPageActions } from "../base/internal/types/pageActions.js";

export class BasePage {
  public readonly page: Page;
  protected readonly actions: IPageActions;

  constructor(page: Page, actions?: IPageActions) {
    this.page = page;
    this.actions = actions || new PageActionsContainer(page);
  }

  // Expose actions for easy access
  public get navigation() {
    return this.actions.navigation;
  }

  public get element() {
    return this.actions.element;
  }

  public get elementAssertions() {
    return this.actions.elementAssertions;
  }

  public get browser() {
    return this.actions.browser;
  }

  public get frame() {
    return this.actions.frame;
  }

  public get file() {
    return this.actions.file;
  }
}
