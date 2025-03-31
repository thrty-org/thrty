import { BaseError } from './BaseError';

export class UnauthorizedError extends BaseError {
  statusCode = 401;
}
