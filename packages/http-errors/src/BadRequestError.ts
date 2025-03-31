import { BaseError } from './BaseError';

export class BadRequestError extends BaseError {
  statusCode = 400;
}
