type LogLevel = "info" | "warn" | "error" | "debug";

function formatMessage(
  level: LogLevel,
  category: string,
  message: string,
  ...args: unknown[]
): string {
  const extra =
    args.length > 0
      ? ` ${JSON.stringify(args.length === 1 ? args[0] : args, null, 2)}`
      : "";
  return `[${category}] ${message}${extra}`;
}

export const logger = {
  info: (category: string, message: string, ...args: unknown[]) => {
    console.log(formatMessage("info", category, message, ...args));
  },
  warn: (category: string, message: string, ...args: unknown[]) => {
    console.warn(formatMessage("warn", category, message, ...args));
  },
  error: (category: string, message: string, ...args: unknown[]) => {
    console.error(formatMessage("error", category, message, ...args));
  },
  debug: (category: string, message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG === "true") {
      console.log(formatMessage("debug", category, message, ...args));
    }
  },
};
