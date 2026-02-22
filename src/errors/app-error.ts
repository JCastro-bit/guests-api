export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

// Factory functions para errores comunes (KISS — evitar jerarquías de clases innecesarias)
export const NotFoundError = (entity: string) =>
  new AppError(`${entity} not found`, 404);

export const ConflictError = (message: string) =>
  new AppError(message, 409);

export const UnauthorizedError = (message: string = 'Unauthorized') =>
  new AppError(message, 401);

export const InternalError = (message: string) =>
  new AppError(message, 500);
