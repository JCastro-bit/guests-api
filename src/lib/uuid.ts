const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function assertValidUUID(value: string, field = 'id'): void {
  if (!isValidUUID(value)) {
    const error = new Error(`El parametro '${field}' no es un UUID valido.`) as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }
}
