
import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "/tmp/error.log", level: "error" }),
    new transports.File({ filename: "/tmp/combined.log" }),
  ],
});

