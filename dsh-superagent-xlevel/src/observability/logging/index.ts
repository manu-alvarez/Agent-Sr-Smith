export interface LogRecord {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  fields: Record<string, string | number | boolean>;
}

const SECRET = /(api[_-]?key|secret|password|token)=\S+/gi;

export function log(level: LogRecord["level"], message: string, fields: LogRecord["fields"] = {}): LogRecord {
  return { level, message: message.replace(SECRET, "$1=[redacted]"), fields };
}
