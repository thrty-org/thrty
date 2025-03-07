import { types } from 'thirty/core';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { APIGatewayProxyResult } from 'thirty/types';
import { inject } from 'thirty/inject';
import { z } from 'zod';
import { compose } from '@thrty/core';
import { get, authorizer } from '@thrty/api';
import { responseBody } from '@thrty/api-zod';
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
