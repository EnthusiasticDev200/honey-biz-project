import { createLogger, format, transports } from "winston";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

// Recreate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log file paths
const infoLogPath = path.join(__dirname, "../logs/app.log");
const errorLogPath = path.join(__dirname, "../logs/error.log");
const combinedLogPath = path.join(__dirname, "../logs/combined.log"); // fixed: should not reuse error.log

// Winston logger setup
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // include stack traces
     format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
        : `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.File({ filename: errorLogPath, level: "error" }),
    new transports.File({ filename: infoLogPath, level: "info" }),
    new transports.File({ filename: combinedLogPath }), // all logs
  ],
});

// Add console logging in non-production
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;
