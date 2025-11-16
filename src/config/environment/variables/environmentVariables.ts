export default class EnvironmentVariables {
  // URLS
  public static readonly PORTAL_BASE_URL = process.env.PORTAL_BASE_URL!;

  // Users
  public static readonly PORTAL_USERNAME = process.env.PORTAL_USERNAME!;
  public static readonly PORTAL_PASSWORD = process.env.PORTAL_PASSWORD!;
}
