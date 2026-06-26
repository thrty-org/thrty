import { Callback, CodePipelineHandler } from 'aws-lambda';
import { ContextOf } from './ContextOf';
import { EventOf } from './EventOf';
import { fromPartial } from './fromPartial';
import { RecursivePartial } from './RecursivePartial';

export type ArgsOf<H extends { actual: (...a: any[]) => any }> = readonly [
  EventOf<H>,
  ContextOf<H>,
  Callback<any>,
];

export const fromArgs = <H extends { actual: (...a: any[]) => any }>(
  event: RecursivePartial<EventOf<H>>,
  context: RecursivePartial<ContextOf<H>> = fromPartial<ContextOf<H>>({
    getRemainingTimeInMillis: () => 10000,
  } as unknown as RecursivePartial<ContextOf<H>>),
): ArgsOf<H> => [
  fromPartial<EventOf<H>>(event),
  fromPartial<ContextOf<H>>(context),
  (() => null) as Callback<any>,
];
