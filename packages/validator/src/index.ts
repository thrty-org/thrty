import type { Middleware } from '@thrty/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export class ValidationError extends Error {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(message: string, issues: readonly StandardSchemaV1.Issue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

type Decrement<N extends number> = N extends 4 ? 3 : N extends 3 ? 2 : N extends 2 ? 1 : 0;

/**
 * Dotted-path keys into T, up to {@link Depth} levels deep. Any string is also
 * accepted (for write-only paths that don't exist yet on T), but existing paths
 * autocomplete.
 */
export type Path<T, Depth extends number = 4> = Depth extends 0
  ? never
  :
      | ExistingPath<T, Depth>
      | (string & {});

type ExistingPath<T, Depth extends number> = T extends object
  ? {
      [K in keyof T & string]:
        | K
        | (NonNullable<T[K]> extends object
            ? `${K}.${ExistingPath<NonNullable<T[K]>, Decrement<Depth>>}`
            : never);
    }[keyof T & string]
  : never;

/**
 * Replace the value at dotted path P in T with V. If a segment doesn't exist
 * on T, it's added (so writing to a new key like `requestBody` works).
 */
export type SetAt<T, P extends string, V> = P extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
    ? Omit<T, Head> & { [K in Head]: SetAt<NonNullable<T[Head]>, Tail, V> }
    : T & { [K in Head]: SetAt<{}, Tail, V> }
  : P extends keyof T
    ? Omit<T, P> & { [K in P]: V }
    : T & { [K in P]: V };

export interface ValidateOptions<TEvent, TSchema extends StandardSchemaV1, TPath extends string> {
  schema: TSchema;
  /**
   * Write target. Dotted paths (`record.body`) are supported. When `select` is
   * omitted, the same path is also used to read the value to validate.
   */
  path?: TPath;
  /**
   * Extract the value to validate from the event. When omitted, the value at
   * `path` is used (or the whole event if `path` is also omitted).
   */
  select?: (event: TEvent) => unknown;
  /**
   * Map validation issues to a custom error. Defaults to {@link ValidationError}.
   */
  onInvalid?: (issues: readonly StandardSchemaV1.Issue[]) => Error;
}

/** Shorthand: validate the whole event, replace it with the validated value. */
export function validate<TEvent, TSchema extends StandardSchemaV1, C, R>(
  schema: TSchema,
): Middleware<
  TEvent,
  StandardSchemaV1.InferOutput<TSchema>,
  Promise<R>,
  Promise<R>,
  C,
  C
>;
/** Positional path: read and write the validated value at the given path. */
export function validate<
  TEvent,
  TSchema extends StandardSchemaV1,
  C,
  R,
  const TPath extends Path<TEvent>,
>(
  schema: TSchema,
  path: TPath,
): Middleware<
  TEvent,
  SetAt<TEvent, TPath, StandardSchemaV1.InferOutput<TSchema>>,
  Promise<R>,
  Promise<R>,
  C,
  C
>;
/** Full options form. */
export function validate<
  TEvent,
  TSchema extends StandardSchemaV1,
  C,
  R,
  const TPath extends Path<TEvent> = never,
>(
  options: ValidateOptions<TEvent, TSchema, TPath>,
): Middleware<
  TEvent,
  [TPath] extends [never]
    ? StandardSchemaV1.InferOutput<TSchema>
    : SetAt<TEvent, TPath, StandardSchemaV1.InferOutput<TSchema>>,
  Promise<R>,
  Promise<R>,
  C,
  C
>;
export function validate(
  arg: StandardSchemaV1 | ValidateOptions<any, any, any>,
  pathArg?: string,
): any {
  const isShorthand = isStandardSchema(arg);
  const schema: StandardSchemaV1 = isShorthand ? arg : arg.schema;
  const path: string | undefined = isShorthand ? pathArg : arg.path;
  const select = isShorthand ? undefined : arg.select;
  const onInvalid = isShorthand ? undefined : arg.onInvalid;

  return (next: any) =>
    async (event: any, ...rest: any[]) => {
      const input = select
        ? select(event)
        : path !== undefined
          ? getAtPath(event, path)
          : event;
      let result = schema['~standard'].validate(input);
      if (result instanceof Promise) result = await result;
      if (result.issues) {
        throw onInvalid
          ? onInvalid(result.issues)
          : new ValidationError('Validation failed', result.issues);
      }
      const validated = (result as { value: unknown }).value;
      const nextEvent =
        path !== undefined ? setAtPath(event, path.split('.'), validated) : validated;
      return next(nextEvent, ...rest);
    };
}

const isStandardSchema = (value: unknown): value is StandardSchemaV1 =>
  typeof value === 'object' && value !== null && '~standard' in value;

const getAtPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<any>((acc, key) => (acc == null ? acc : acc[key]), obj);

const setAtPath = (obj: any, keys: string[], value: unknown): any => {
  if (keys.length === 0) return value;
  const [head, ...rest] = keys;
  const base = obj && typeof obj === 'object' ? obj : {};
  return { ...base, [head]: setAtPath(base[head], rest, value) };
};
