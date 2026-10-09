type Level = "debug" | "info" | "warn" | "error";

function tulis(level: Level, pesan: string, meta: Record<string, unknown> = {}): void {
  const baris = { waktu: new Date().toISOString(), level, pesan, ...meta };
  const keluaran = JSON.stringify(baris);

  if (level === "error") console.error(keluaran);
  else console.log(keluaran);
}

export const logger = {
  debug: (pesan: string, meta?: Record<string, unknown>) => tulis("debug", pesan, meta),
  info: (pesan: string, meta?: Record<string, unknown>) => tulis("info", pesan, meta),
  warn: (pesan: string, meta?: Record<string, unknown>) => tulis("warn", pesan, meta),
  error: (pesan: string, meta?: Record<string, unknown>) => tulis("error", pesan, meta),
};