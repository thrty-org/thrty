import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { compose, types } from '@thrty/core';
import { get, authorizer } from '@thrty/api';
import { responseBody } from '@thrty/api-zod';
import { inject } from '@thrty/inject';
import { z } from 'zod';
import { todoRepositoryProviders } from './todoRepositoryProviders';
import { scopes } from './scopes';

const GetTodoResponseModel = z
  .object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string(),
    completed: z.boolean(),
    updatedAt: z.string(),
  })
  .array();

export const handler = compose(
  types<APIGatewayProxyEvent, Promise<APIGatewayProxyResult>>(),
  inject({
    ...todoRepositoryProviders,
  }),
  get('/todos'),
  scopes('todo:read'),
  authorizer('default'),
  responseBody(GetTodoResponseModel),
)(async (event) => {
  const { todoRepository } = event.deps;

  const todo = todoRepository.findTodos();

  return {
    statusCode: 201,
    body: todo,
  };
});
