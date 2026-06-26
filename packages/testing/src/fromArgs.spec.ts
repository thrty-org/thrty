import { compose, typesOf } from '@thrty/core';
import { inject } from '@thrty/inject';
import type { Handler } from 'aws-lambda';
import { ArgsOf, fromArgs } from './fromArgs';
import { createMock } from './createMock';

interface NotificationService {
  send(notification: { id: string }): Promise<void>;
}

const notificationServiceFactory = (): NotificationService => ({
  send: async () => {},
});

const handler = compose(
  typesOf<Handler<{ id: string }>>(),
  inject({ notificationService: notificationServiceFactory }),
)(async (event, context) => {
  await context.deps.notificationService.send(event);
  return event.id;
});

describe('fromArgs', () => {
  it('passes event and context partials to .actual with augmented context inferred', async () => {
    const notificationService = createMock<NotificationService>();
    notificationService.send.mockResolvedValue();

    const result = await handler.actual(
      ...fromArgs<typeof handler>(
        { id: 'n_1' },
        { deps: { notificationService } },
      ),
    );

    expect(result).toBe('n_1');
    expect(notificationService.send).toHaveBeenCalledWith({ id: 'n_1' });
  });

  it('defaults context to one whose getRemainingTimeInMillis is callable', () => {
    const [, context] = fromArgs<typeof handler>({ id: 'n_2' });
    expect(typeof context.getRemainingTimeInMillis).toBe('function');
    expect(context.getRemainingTimeInMillis()).toBe(10000);
  });

  it('returns a tuple assignable to ArgsOf<typeof handler> that spreads into .actual', async () => {
    const notificationService = createMock<NotificationService>();
    notificationService.send.mockResolvedValue();

    let args: ArgsOf<typeof handler>;
    args = fromArgs<typeof handler>(
      { id: 'n_3' },
      { deps: { notificationService } },
    );

    await handler.actual(...args);
    expect(notificationService.send).toHaveBeenCalledWith({ id: 'n_3' });
  });

  it('exposes a third tuple slot as a no-op Callback', () => {
    const [, , callback] = fromArgs<typeof handler>({ id: 'n_4' });
    expect(typeof callback).toBe('function');
    expect((callback as any)(null, undefined)).toBeNull();
  });
});
