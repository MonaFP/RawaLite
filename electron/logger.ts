import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';

export function createLogger() {
  const logDir = path.join(app.getPath('appData'), 'RaWaLite');
  fs.ensureDirSync(logDir);
  const logFile = path.join(logDir, 'rawalite.log');

  function write(level: string, msg: string) {
    const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
    fs.appendFileSync(logFile, line, 'utf8');
    if (process.env.NODE_ENV !== 'production') console.log(line.trim());
  }

  return {
    info: (m: string) => write('INFO', m),
    error: (m: string) => write('ERROR', m),
    debug: (m: string) => write('DEBUG', m),
    path: logFile,
  };
}