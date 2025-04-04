import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { inject } from '@thrty/inject';
import { z } from 'zod';
import { compose, types } from '@thrty/core';
import { post, authorizer } from '@thrty/api';
import { requestBody, responseBody } from '@thrty/api-zod';
import { todoRepositoryProviders } from './todoRepositoryProviders';
import { scopes } from './scopes';

const CreateTodoRequestModel = z.object({
  title: z.string(),
});
const CreateTodoResponseModel = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
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
  scopes('todo:create'),
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
