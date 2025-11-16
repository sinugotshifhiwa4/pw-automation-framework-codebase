import os from "os";

export default class SystemInfo {
  /**
   * Gets the current system user's username.
   * @returns Username or "system" if unavailable
   */
  public static getCurrentUsername(): string {
    return os.userInfo?.().username ?? "system";
  }
}
