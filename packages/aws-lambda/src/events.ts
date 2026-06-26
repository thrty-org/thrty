import type { EventBridgeEvent as _EventBridgeEvent } from 'aws-lambda';

/**
 * Same as `aws-lambda`'s `EventBridgeEvent` but with sensible defaults on
 * both generics. Useful when you want to type-anchor a rule that delivers
 * arbitrary detail shapes.
 */
export type EventBridgeEvent<
  TDetailType extends string = string,
  TDetail = unknown,
> = _EventBridgeEvent<TDetailType, TDetail>;
