import { compose, types } from '@thrty/core/src';
import { doNotWaitForEmptyEventLoop } from './index';
import { inject } from '../../packages/inject/src';

let handler;

beforeEach(() => {
  handler = compose(types<{}, any>(), inject({}), doNotWaitForEmptyEventLoop())(async () => {});
});

it('should set callbackWaitsForEmptyEventLoop to false', async () => {
  const context = {};
  await handler({}, context);
  expect(context).toEqual({
    callbackWaitsForEmptyEventLoop: false,
  });
});
