import { fromPartial } from './fromPartial';
import { Callback, Context } from 'aws-lambda';
import { RecursivePartial } from './RecursivePartial';

export const args = <T>(
  event: RecursivePartial<T>,
  context: RecursivePartial<Context> = fromPartial<Context>({
    getRemainingTimeInMillis(): number {
      return 10000;
    },
  }),
) => [fromPartial<T>(event), fromPartial<Context>(context), (() => null) as Callback<any>] as const;
