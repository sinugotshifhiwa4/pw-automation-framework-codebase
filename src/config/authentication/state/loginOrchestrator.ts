import type { Page } from "@playwright/test";
import { BasePage } from "../../../layers/ui/base/basePage.js";
import type { RuntimeEnvVariableResolver } from "../../environment/runtimeVariableResolver/runtimeEnvVariableResolver.js";
import type { AuthenticationStatePersister } from "./internal/authenticationStatePersister.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export class LoginOrchestrator extends BasePage {
  private resolver: RuntimeEnvVariableResolver;
  private authStatePersister: AuthenticationStatePersister;

  constructor(
    page: Page,
    resolver: RuntimeEnvVariableResolver,
    authStatePersister: AuthenticationStatePersister,
  ) {
    super(page);
    this.resolver = resolver;
    this.authStatePersister = authStatePersister;
  }

  /**
   * Navigates to the portal base URL.
   * @returns A promise that resolves when navigation is complete.
   */
  public async navigateToPortal(): Promise<void> {
    const portalUrl = this.resolver.getPortalBaseUrl();
    await this.navigation.navigateToUrl(portalUrl, "navigateToPortal");
  }

  /**
   * Logs into the portal with valid credentials, and then verifies the success.
   * Saves the current authentication state to a file after successful login.
   * @param username - The username to log in with.
   * @param password - The password to log in with.
   * @param loginFn - A function that performs the login action.
   * @param validateLoginFn - A function that validates the success of the login attempt.
   * @returns A promise that resolves when the login attempt has been validated.
   * @throws Error if the login attempt fails.
   */
  public async loginWithValidCredentials(
    username: string,
    password: string,
    loginFn: (username: string, password: string) => Promise<void>,
    validateLoginFn: () => Promise<void>,
  ): Promise<void> {
    try {
      await this.navigateToPortal();
      await loginFn(username, password);
      await validateLoginFn();
      await this.authStatePersister.saveAuthenticationState();
    } catch (error) {
      ErrorHandler.captureError(error, "loginWithValidCredentials", "Failed to log into portal");
      throw error;
    }
  }

  /**
   * Logs into the portal with invalid credentials, and then verifies the failure.
   * @param username - The username to log in with.
   * @param password - The password to log in with.
   * @param loginFn - A function that performs the login action.
   * @param validateInvalidLoginFn - A function that validates the failure of the login attempt.
   * @returns A promise that resolves when the login attempt has been validated.
   * @throws Error if the login attempt fails.
   */
  public async loginWithInvalidCredentials(
    username: string,
    password: string,
    loginFn: (username: string, password: string) => Promise<void>,
    validateInvalidLoginFn: () => Promise<void>,
  ): Promise<void> {
    try {
      await this.navigateToPortal();
      await loginFn(username, password);
      await validateInvalidLoginFn();
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "loginWithInvalidCredentials",
        "Failed to verify invalid login",
      );
      throw error;
    }
  }
}
