type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const SENSITIVE_KEYS = [
  "authorization",
  "access_token",
  "refresh_token",
  "token",
  "password",
  "cookie",
  "secret",
];

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV !== "production" ? value.stack : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as LogFields).reduce<LogFields>((acc, [key, item]) => {
      const normalizedKey = key.toLowerCase();
      acc[key] = SENSITIVE_KEYS.some((sensitive) => normalizedKey.includes(sensitive))
        ? "[REDACTED]"
        : sanitize(item);
      return acc;
    }, {});
  }

  return value;
}

function writeLog(level: LogLevel, event: string, fields: LogFields = {}) {
  const sanitizedFields = sanitize(fields) as LogFields;
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...sanitizedFields,
  };

  if (process.env.NODE_ENV === "production") {
    const line = JSON.stringify(payload);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return;
  }

  const message = `[${level.toUpperCase()}] ${event}`;
  if (level === "error") console.error(message, payload);
  else if (level === "warn") console.warn(message, payload);
  else console.log(message, payload);
}

export const logger = {
  debug(event: string, fields?: LogFields) {
    if (process.env.NODE_ENV !== "production") writeLog("debug", event, fields);
  },
  info(event: string, fields?: LogFields) {
    writeLog("info", event, fields);
  },
  warn(event: string, fields?: LogFields) {
    writeLog("warn", event, fields);
  },
  error(event: string, fields?: LogFields) {
    writeLog("error", event, fields);
  },
};
