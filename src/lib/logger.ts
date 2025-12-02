/* eslint-disable no-console */

type LogContext = Record<string, unknown>;

const shouldLog = import.meta.env.MODE !== "production";

export function logError(message: string, context?: LogContext): void {
  if (!shouldLog) return;

  if (context) {
    console.error(message, context);
    return;
  }

  console.error(message);
}
