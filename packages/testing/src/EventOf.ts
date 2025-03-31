export type EventOf<T extends { actual: (...args: any[]) => any }> = Parameters<T['actual']>[0];
