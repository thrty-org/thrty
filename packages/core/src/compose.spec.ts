import { compose } from './compose';

it('should apply middlewares in reverse', async () => {
  const order: any[] = [];
  const middleware1 = () => order.push(middleware1) as any;
  const middleware2 = () => order.push(middleware2) as any;

  compose(middleware1, middleware2)(async () => {});

  expect(order).toEqual([middleware2, middleware1]);
});

it('should execute middleware handlers in order', async () => {
  const order: any[] = [];
  const middleware1 =
    (next: any) =>
    (...args: any[]) => {
      order.push(middleware1);
      return next(...args);
    };
  middleware1['meta'] = { 1: '1' };
  const middleware2 =
    (next: any) =>
    (...args: any[]) => {
      order.push(middleware2);
      return next(...args);
    };
  middleware2['meta'] = { 2: '2' };
  const middleware3 =
    (next: any) =>
    (...args: any[]) => {
      order.push(middleware3);
      return next(...args);
    };

  const composedHandler = compose(middleware1, middleware2, middleware3)(async () => {});
  composedHandler({});

  expect(order).toEqual([middleware1, middleware2, middleware3]);
  expect(composedHandler.meta).toEqual({ 1: '1', 2: '2' });
});

it('should provide actual handler reference via "actual" property', async () => {
  const middleware =
    (actual: any) =>
    (...args: any[]) =>
      actual(...args);
  const actualHandler = async () => {};
  const handler = compose(middleware, middleware)(actualHandler);

  expect(handler.actual).toBe(actualHandler);
});

it('should not provide actual handler reference via "actual" property in case of 1 middleware', async () => {
  const middleware =
    (actual: any) =>
    (...args: any[]) =>
      actual(...args);
  const actualHandler = async () => {};
  const handler = compose(middleware)(actualHandler) as any as { actual: undefined };

  expect(handler['actual']).toBe(undefined);
});

it('should be able to enhance events through middlewares', async () => {
  const middleware =
    (actual: any) =>
    (event: any, ...args: any[]) =>
      actual(Object.assign(event, { test: 1 }), ...args);
  const actualHandler = async (event: any) => event.test;
  const handler = compose(middleware)(actualHandler);
  const event = {};

  await expect(handler(event)).resolves.toEqual(1);
  expect(event).toEqual({ test: 1 });
});
