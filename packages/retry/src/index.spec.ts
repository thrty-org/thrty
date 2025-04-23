import { compose, types } from '@thrty/core';
import { retry } from './index';
import { NotFoundError } from '@thrty/http-errors';

const actual = jest.fn();

beforeEach(() => {
  actual.mockClear();
});

describe('default', () => {
  const handler = compose(
    types<{}, Promise<{ result: string }>>(),
    retry({ logger: false }),
  )(actual);

  describe('given actual handler succeeds', () => {
    let result: { result: string };
    beforeEach(async () => {
      actual.mockResolvedValue({ result: 'ok' });

      result = await handler({});
    });

    it('should call the actual handler once', async () => {
      expect(actual).toHaveBeenCalledTimes(1);
    });

    it('should return result', () => {
      expect(result).toEqual({
        result: 'ok',
      });
    });
  });

  describe('given actual handler fails once', () => {
    beforeEach(async () => {
      actual.mockRejectedValueOnce(new Error('Test error'));
      await handler({});
    });

    it('should retry the actual handler once', async () => {
      expect(actual).toHaveBeenCalledTimes(2);
    });
  });

  describe('given actual handlers exceeds max retries', () => {
    let result: Error;
    beforeEach(async () => {
      actual.mockRejectedValue(new Error('Test error'));
      result = await handler({}).catch((e) => e);
    });

    it('should retry the actual handler max-retries times', async () => {
      expect(actual).toHaveBeenCalledTimes(4);
    });

    it('should return error', () => {
      expect(result).toEqual(new Error('Test error'));
    });
  });
});

describe('retryOn=[NotFoundError]', () => {
  const handler = compose(
    types<{}, Promise<{ result: string }>>(),
    retry({ logger: false, retryOn: [NotFoundError] }),
  )(actual);

  describe('given actual handler fails with NotFoundError', () => {
    beforeEach(async () => {
      actual.mockRejectedValueOnce(new NotFoundError('Test error'));
      await handler({}).catch((e) => e);
    });

    it('should retry the actual handler once', async () => {
      expect(actual).toHaveBeenCalledTimes(2);
    });
  });

  describe('given actual handler fails with another error', () => {
    beforeEach(async () => {
      actual.mockRejectedValueOnce(new Error('Test error'));
      await handler({}).catch((e) => e);
    });

    it('should not retry the actual handler', async () => {
      expect(actual).toHaveBeenCalledTimes(1);
    });
  });
});
describe('retryOn=callback', () => {
  const handler = compose(
    types<{}, Promise<{ result: string }>>(),
    retry({ logger: false, retryOn: (e) => e instanceof NotFoundError }),
  )(actual);

  describe('given actual handler fails with NotFoundError', () => {
    beforeEach(async () => {
      actual.mockRejectedValueOnce(new NotFoundError('Test error'));
      await handler({}).catch((e) => e);
    });

    it('should retry the actual handler once', async () => {
      expect(actual).toHaveBeenCalledTimes(2);
    });
  });

  describe('given actual handler fails with another error', () => {
    beforeEach(async () => {
      actual.mockRejectedValueOnce(new Error('Test error'));
      await handler({}).catch((e) => e);
    });

    it('should not retry the actual handler', async () => {
      expect(actual).toHaveBeenCalledTimes(1);
    });
  });
});
