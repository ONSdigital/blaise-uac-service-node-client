/**
 * Custom error class for BusClient errors
 */
export class BusClientError extends Error {
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  constructor(message: string, statusCode?: number, originalError?: Error) {
    super(message, { cause: originalError });
    this.name = "BusClientError";
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BusClientError.prototype);
  }
}

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends BusClientError {
  constructor(message: string, originalError?: Error) {
    super(message, undefined, originalError);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
