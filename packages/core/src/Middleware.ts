import type { Context as LambdaContext } from 'aws-lambda';
import { Next } from './Next';

export type Middleware<
  TRequiredEvent,
  TNextEvent,
  TExpectedResult,
  TTransformedResult,
  TRequiredContext = LambdaContext,
  TNextContext = TRequiredContext,
  TExtendedNext = {},
> = (
  next: Next<TNextEvent, TNextContext, TTransformedResult>,
) => Next<TRequiredEvent, TRequiredContext, TExpectedResult> & TExtendedNext;
