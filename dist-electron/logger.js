// electron/logger.ts
import fs from "fs-extra";
import path from "path";
import { app } from "electron";
function createLogger() {
  const logDir = path.join(app.getPath("appData"), "RaWaLite");
  fs.ensureDirSync(logDir);
  const logFile = path.join(logDir, "rawalite.log");
  function write(level, msg) {
    const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] [${level}] ${msg}
`;
    fs.appendFileSync(logFile, line, "utf8");
    if (process.env.NODE_ENV !== "production") console.log(line.trim());
  }
  return {
    info: (m) => write("INFO", m),
    error: (m) => write("ERROR", m),
    debug: (m) => write("DEBUG", m),
    path: logFile
  };
}
export {
  createLogger
};
//# sourceMappingURL=logger.js.map