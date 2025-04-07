import { RecursivePartial } from './RecursivePartial';

export const fromPartial = <T>(data: RecursivePartial<T>): T => data as unknown as T;
