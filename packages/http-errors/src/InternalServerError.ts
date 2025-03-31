import { BaseError } from './BaseError';

export class InternalServerError extends BaseError {
  statusCode = 500;
}
