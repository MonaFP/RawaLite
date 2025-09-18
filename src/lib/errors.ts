export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DATABASE_ERROR', originalError);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class SettingsError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'SETTINGS_ERROR', originalError);
    this.name = 'SettingsError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', error);
  }
  
  return new AppError(String(error), 'UNKNOWN_ERROR', error);
}

export function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case 'DATABASE_ERROR':
      return 'Es gab ein Problem mit der Datenbank. Bitte versuchen Sie es erneut.';
    case 'VALIDATION_ERROR':
      return error.message; // Validation messages are already user-friendly
    case 'SETTINGS_ERROR':
      return 'Fehler beim Laden oder Speichern der Einstellungen.';
    default:
      return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
  }
}
