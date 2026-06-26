import type { EventBridgeHandler as _EventBridgeHandler } from 'aws-lambda';

/**
 * Same as `aws-lambda`'s `EventBridgeHandler` but with sensible defaults on
 * every generic so you can specify only what you care about.
 *
 * @example
 * typesOf<EventBridgeHandler>();                                  // unknown detail, void result
 * typesOf<EventBridgeHandler<'OrderPlaced'>>();                   // typed detail-type literal
 * typesOf<EventBridgeHandler<'OrderPlaced', Order>>();            // typed detail payload
 * typesOf<EventBridgeHandler<'OrderPlaced', Order, FulfilmentResult>>();
 */
export type EventBridgeHandler<
  TDetailType extends string = string,
  TDetail = unknown,
  TResult = void,
> = _EventBridgeHandler<TDetailType, TDetail, TResult>;
