import { Middleware } from 'thirty/core';
import { BadRequestError } from 'thirty/errors';
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
          return next(Object.assign(event, { requestBody: res.data }), ...rest);
        }
        // TODO Needs improvement: provide detailed error messages as string and as object or array of objects
        throw new BadRequestError(res.error.errors.map((e) => e.message).join(', '));
      },
    {
      meta: {
        requestBody: body,
      },
    },
  );

type OutputEvent<TInputEvent, TBody extends ZodType> = TInputEvent & { requestBody: TypeOf<TBody> };
