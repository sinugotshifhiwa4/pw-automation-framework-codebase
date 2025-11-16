export interface ResponseOptions {
  expectedStatuses?: number[];
  additionalUrlCheck?: (url: string) => boolean;
  timeout?: number;
  logResponseBody?: boolean;
}

export interface ModeOptions {
  mode?: "continuous" | "once" | "off";
  filter?: (url: string) => boolean;
}
