import { Middleware } from '@thrty/core';

export type Dependencies<T> = { deps: T };
export type Providers<TContainer> = {
  [K in keyof TContainer]: Factory<TContainer>;
};
export type Factory<TContainer> = (container: TContainer) => any;
export type Container<T extends Providers<Container<T>>> = {
  [P in keyof T]: ReturnType<T[P]>;
};

export const inject =
  <TEvent, TContext, TProviders extends Providers<Container<TProviders>>, R>(
    providers: TProviders,
  ): Middleware<
    TEvent,
    TEvent,
    R,
    R,
    TContext,
    TContext & Dependencies<Container<TProviders>>
  > =>
  (handler) => {
    let container: Container<TProviders>;
    return (event, context, ...args) => {
      if (!container) {
        container = createContainer(providers);
      }
      return handler(event, Object.assign((context ?? {}) as any, { deps: container }), ...args);
    };
  };

export const createContainer = <TProviders extends Providers<Container<TProviders>>>(
  factories: TProviders,
): Container<TProviders> => {
  const cache: { [key: string]: any } = {};
  const circularDepIndicator: { [key: string]: boolean } = {};
  let depChainKeys: string[] = [];
  const container = new Proxy(factories, {
    get(target, key: string) {
      if (key === 'inject') return inject;
      if (!(key in cache) && key in factories) {
        depChainKeys.push(String(key));
        if (circularDepIndicator[key]) {
          throw new Error(
            `Circular dependency detected ${depChainKeys.map((key) => `"${key}"`).join(' -> ')}`,
          );
        }
        circularDepIndicator[key] = true;
        cache[key] = factories[key as keyof TProviders](container);
        depChainKeys = [];
      }
      return cache[key];
    },
  }) as Container<TProviders>;
  return container;
};

export const createProviders = <TProviders extends Providers<Container<TProviders>>>(
  factories: TProviders,
): TProviders => factories;

type CtorDeps<T extends Ctor, TDepsKeys extends string[]> = T extends new (
  ...args: infer TArgs extends { [K in keyof TDepsKeys]: any }
) => any
  ? UnionToIntersection<
      {
        [Index in keyof TDepsKeys]: { [K in TDepsKeys[Index]]: TArgs[Index] };
      }[number]
    >
  : never;

export const fromClass =
  <TCtor extends Ctor, TDepsKeys extends string[]>(ctor: TCtor, ...depsKeys: TDepsKeys) =>
  (deps: CtorDeps<TCtor, TDepsKeys>) => {
    return new ctor(
      ...depsKeys.map((dep) => deps[dep as keyof typeof deps]),
    ) as any as InstanceType<TCtor>;
  };

export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;
export type Ctor = new (...args: any[]) => any;
export type InstanceType<T extends new (...args: any) => any> = T extends new (
  ...args: any
) => infer R
  ? R
  : any;
