import { BaseError } from './BaseError';

export class GatewayTimeoutError extends BaseError {
  statusCode = 504;
}
