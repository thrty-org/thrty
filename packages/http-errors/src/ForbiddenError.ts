import { BaseError } from './BaseError';

export class ForbiddenError extends BaseError {
  statusCode = 403;
}
