import { NavigationActions } from "../actions/navigationActions.js";
import { ElementActions } from "../actions/elementActions.js";
import { ElementAssertions } from "../actions/elementAssertions.js";
import { BrowserActions } from "../actions/browserActions.js";
import { FrameActions } from "../actions/frameActions.js";
import { FileActions } from "../actions/fileActions.js";
import { Utilities } from "../utilities.js";

/**
 * Interface for page actions
 */
export interface IPageActions {
  navigation: NavigationActions;
  element: ElementActions;
  elementAssertions: ElementAssertions;
  browser: BrowserActions;
  frame: FrameActions;
  file: FileActions;
  utilities: Utilities;
}

/**
 * Interface for random string options
 */
export type RandomStringOptions = {
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSpecial?: boolean;
  prefix?: string;
  suffix?: string;
};
