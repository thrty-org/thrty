import { BaseError } from './BaseError';

export class MethodNotAllowedError extends BaseError {
  statusCode = 405;
}
