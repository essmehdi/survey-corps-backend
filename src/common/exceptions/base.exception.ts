/**
 * This class is used to create custom exceptions
 */
export class BaseException extends Error {
  /**
   * Creates a new instance of BaseException
   * @param message Error message
   * @param statusCode Appropriate HTTP status code to return in response in case of HTTP context
   * @param publicMessage Exposed user friendly error message (if not provided, message will be used)
   */
  constructor(
    public readonly message: string,
    public readonly statusCode?: number,
    public readonly publicMessage?: string
  ) {
    super(message);
  }
}
