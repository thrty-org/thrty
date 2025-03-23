import { RequestBodyMeta, RequestBody } from '@thrty/api';
import { Middleware } from '@thrty/core';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { ZodType, TypeOf } from 'zod';

export const requestBody = <TEvent extends APIGatewayProxyEvent, R, const TBody extends ZodType>(
  body: TBody,
): Middleware<TEvent, OutputEvent<TEvent, TBody>, R, R> =>
  Object.assign(
    (next: any) =>
      (event: TEvent, ...rest: any[]) => {
        const parsedBody = event.body?.startsWith('{') ? JSON.parse(event.body) : event.body;
        const res = body.safeParse(parsedBody);
        if (res.success) {
          return next(
            Object.assign(event, { requestBody: res.data } satisfies RequestBody),
            ...rest,
          );
        }
        // TODO Needs improvement: provide detailed error messages as string and as object or array of objects
        throw new BadRequestError(res.error.issues.map((e) => e.message).join(', '));
      },
    {
      meta: {
        requestBody: body,
      } satisfies RequestBodyMeta,
    },
  );

type OutputEvent<TInputEvent, TBody extends ZodType> = TInputEvent & RequestBody<TypeOf<TBody>>;

export class BadRequestError extends Error {}
