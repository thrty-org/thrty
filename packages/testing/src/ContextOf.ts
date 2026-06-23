export type ContextOf<T extends { actual: (...args: any[]) => any }> = Parameters<T['actual']>[1];
