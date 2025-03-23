import { compose, typesOf } from '@thrty/core';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { requestBody } from './requestBody';
import { z } from 'zod';

const handler = compose(
  typesOf<APIGatewayProxyHandler>(),
  requestBody(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      birthDate: z.date(),
    }),
  ),
)(async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(event.requestBody),
  };
});
