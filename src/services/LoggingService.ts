export class LoggingService {
  static log(message: string) {
    // Schreibe in %APPDATA%/logs, ohne PII, rotate bei 1MB
    console.log(message); // Stub
  }
}