import { compose, eventType } from '@thrty/core';
import { inject, fromClass } from './index';

describe('inject()', () => {
  describe('given factories are set up properly', () => {
    type AService = ReturnType<typeof aServiceFactory>;
    const aServiceFactory = () => ({
      a() {
        return 'A';
      },
    });
    const bServiceFactory = ({ aService }: { aService: AService }) => ({
      b() {
        return 'B' + aService.a();
      },
    });
    const composed = compose(
      eventType<{}>(),
      inject({
        aService: aServiceFactory,
        bService: bServiceFactory,
      }),
    );

    it('should infer types properly', () => {
      composed(async (event) => {
        event.deps.bService.b();
        event.deps.aService.a();
      });
    });

    it('should resolve dependencies properly', async () => {
      await expect(
        composed(async (event) => ({
          b: event.deps.bService.b(),
          a: event.deps.aService.a(),
        }))({}),
      ).resolves.toEqual({
        b: 'BA',
        a: 'A',
      });
    });

    it('should pass through arguments properly', async () => {
      const arg0 = {};
      const arg1 = 1;
      const arg2 = 2;
      const res = await composed(async (...args: any[]) => args)(arg0, arg1, arg2);

      expect(res).toEqual([arg0, arg1, arg2]);
    });

    describe('and unknown dependency is accessed', () => {
      it('should expect type error', () => {
        composed(async (event) => {
          // @ts-expect-error - Should complain about unknown property
          event.deps.cService;
        });
      });
    });
  });

  describe('given handler is called a second time', () => {
    const aServiceFactory = jest
      .fn()
      .mockImplementation((deps) => ({ a: 'a', test: () => deps.bService.b }));
    const handler = compose(
      eventType<{}>(),
      inject({
        aService: aServiceFactory,
      }),
    )(async (event) => event.deps.aService);

    beforeEach(async () => {
      await handler({});
      await handler({});
    });

    it('should call factory only once', () => {
      expect(aServiceFactory).toBeCalledTimes(1);
    });
  });

  describe('fromClass()', () => {
    type AService = ReturnType<typeof aServiceFactory>;
    const aServiceFactory = () => ({ a: 'a' });
    type BService = ReturnType<typeof bServiceFactory>;
    const bServiceFactory = ({ aService }: { aService: AService }) => ({ b: 'b' });
    class DService {
      aService: AService;
      bService: BService;
      constructor(aService: AService, bService: BService) {
        this.aService = aService;
        this.bService = bService;
      }
      d() {
        return 'd' + this.aService.a + this.bService.b;
      }
    }

    describe('given dependencies are set up properly', () => {
      const composed = compose(
        eventType<{}>(),
        inject({
          aService: aServiceFactory,
          bService: bServiceFactory,
          dService: fromClass(DService, 'aService', 'bService'),
        }),
      );

      it('should infer types properly', () => {
        composed(async (event) => {
          event.deps.bService.b;
          event.deps.aService.a;
          event.deps.dService.d();
        });
      });

      it('should resolve dependencies properly', async () => {
        await expect(
          composed(async (event) => ({
            d: event.deps.dService.d(),
            b: event.deps.bService.b,
            a: event.deps.aService.a,
          }))({}),
        ).resolves.toEqual({
          d: 'dab',
          b: 'b',
          a: 'a',
        });
      });
    });

    describe('given argument is missing', () => {
      it('should expect type error', () => {
        compose(
          eventType<{}>(),
          inject({
            aService: aServiceFactory,
            bService: bServiceFactory,
            // @ts-expect-error - Should complain about missing bService
            dService: fromClass(DService, 'aService'),
          }),
        );
      });
    });

    describe('given argument order is wrong', () => {
      it('should expect type error', () => {
        compose(
          eventType<{}>(),
          inject({
            aService: aServiceFactory,
            bService: bServiceFactory,
            // @ts-expect-error - Should complain about wrong argument order
            dService: fromClass(DService, 'bService', 'aService'),
          }),
        );
      });
    });

    describe('given dependency is missing', () => {
      it('should expect type error', () => {
        compose(
          eventType<{}>(),
          inject({
            aService: aServiceFactory,
            // @ts-expect-error - Should complain about missing bService
            dService: fromClass(DService, 'aService', 'bService'),
          }),
        );
      });
    });
  });

  describe('given dependency is missing in container setup', () => {
    type AService = { a(): string };
    const bServiceFactory = ({ aService }: { aService: AService }) => ({
      b() {
        return 'B' + aService.a();
      },
    });

    it('should expect type error', () => {
      compose(
        eventType<{}>(),
        inject({
          // @ts-expect-error - Should complain about missing aService
          bService: bServiceFactory,
        }),
      );
    });
  });

  describe('given falsy value is used in factory', () => {
    const handler = compose(
      eventType<{}>(),
      inject({
        value: () => '',
      }),
    )(async (event) => event.deps.value);

    it('should resolve dependency properly', async () => {
      await expect(handler({})).resolves.toEqual('');
    });
  });

  describe('given dependencies are circular dependent on each other', () => {
    const aServiceFactory = ({ bService }: any) => bService;
    const bServiceFactory = ({ aService }: any) => aService;
    const handler = compose(
      eventType<{}>(),
      inject({
        aService: aServiceFactory,
        bService: bServiceFactory,
      }),
    )(async (event) => {
      event.deps.bService;
      event.deps.aService;
    });
    let result: any;

    beforeEach(async () => {
      result = await handler({}).catch((e) => e);
    });

    it('should throw an error while executing handler', () => {
      expect(result).toEqual(
        new Error('Circular dependency detected "bService" -> "aService" -> "bService"'),
      );
    });
  });
});
