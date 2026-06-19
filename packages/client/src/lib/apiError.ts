/** An Error subclass that carries a typed error code from the API's 4xx/5xx response body. */
export class ApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}
