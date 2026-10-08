type LogInfo = Record<string, unknown>;

function format(level: string, message: string, info?: LogInfo): string {
  const waktu = new Date().toISOString();
  const infoStr = info ? ` ${JSON.stringify(info)}` : "";
  return `[${waktu}] [${level}] ${message}${infoStr}`;
}

export const logger = {
  error(message: string, info?: LogInfo): void {
    console.error(format("ERROR", message, info));
  },
  warn(message: string, info?: LogInfo): void {
    console.warn(format("WARN", message, info));
  },
  info(message: string, info?: LogInfo): void {
    console.log(format("INFO", message, info));
  },
};