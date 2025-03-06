import { types } from 'thirty/core';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { APIGatewayProxyResult } from 'thirty/types';
import { inject } from 'thirty/inject';
import { z } from 'zod';
import { compose } from '@thrty/core';
import { post, authorizer } from '@thrty/api';
import { requestBody, responseBody } from '@thrty/api-zod';
import { todoRepositoryProviders } from './todoRepositoryProviders';

const CreateTodoRequestModel = z.object({
  title: z.string(),
});
const CreateTodoResponseModel = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const handler = compose(
  types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
  inject({
    ...todoRepositoryProviders,
  }),
  post('/todos'),
  authorizer('default'),
  requestBody(CreateTodoRequestModel),
  responseBody(CreateTodoResponseModel),
)(async (event) => {
  const { todoRepository } = event.deps;

  const todo = todoRepository.createTodo(event.requestBody.title);

  return {
    statusCode: 201,
    body: todo,
  };
});
