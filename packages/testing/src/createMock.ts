export const createMock = <T>() => {
  const cache = new Map<any, jest.Mock>();
  return new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === 'mockClear') {
          return () => cache.clear();
        }
        if (!cache.has(name)) {
          cache.set(name, jest.fn().mockName(`${String(name)}`));
        }
        return cache.get(name);
      },
    },
  ) as jest.Mocked<T> & { mockClear(): void };
};
