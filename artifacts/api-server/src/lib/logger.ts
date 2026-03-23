export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  source?: string;
  requestId?: string;
  userId?: string;
  durationMs?: number;
  path?: string;
  method?: string;
  statusCode?: number;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function writeLog(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const output: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level: entry.level.toUpperCase(),
    message: entry.message,
  };

  if (entry.source) output.source = entry.source;
  if (entry.requestId) output.requestId = entry.requestId;
  if (entry.userId) output.userId = entry.userId;
  if (entry.durationMs !== undefined) output.durationMs = entry.durationMs;
  if (entry.path) output.path = entry.path;
  if (entry.method) output.method = entry.method;
  if (entry.statusCode !== undefined) output.statusCode = entry.statusCode;
  if (entry.error) output.error = entry.error;
  if (entry.stack) output.stack = entry.stack;

  for (const [k, v] of Object.entries(entry)) {
    if (!(k in output) && k !== "level" && k !== "message") {
      output[k] = v;
    }
  }

  const line = JSON.stringify(output);

  if (entry.level === "error" || entry.level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  debug(message: string, meta?: Omit<LogEntry, "level" | "message">): void {
    writeLog({ level: "debug", message, ...meta });
  },
  info(message: string, meta?: Omit<LogEntry, "level" | "message">): void {
    writeLog({ level: "info", message, ...meta });
  },
  warn(message: string, meta?: Omit<LogEntry, "level" | "message">): void {
    writeLog({ level: "warn", message, ...meta });
  },
  error(message: string, meta?: Omit<LogEntry, "level" | "message">): void {
    writeLog({ level: "error", message, ...meta });
  },
};
