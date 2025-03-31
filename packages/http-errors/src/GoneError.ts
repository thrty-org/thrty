import { BaseError } from './BaseError';

export class GoneError extends BaseError {
  statusCode = 410;
}
