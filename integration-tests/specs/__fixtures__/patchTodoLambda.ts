import { types } from 'thirty/core';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { APIGatewayProxyResult } from 'thirty/types';
import { inject } from 'thirty/inject';
import { z } from 'zod';
import { compose } from '@thrty/core';
import { patch, authorizer } from '@thrty/api';
import { responseBody, requestBody } from '@thrty/api-zod';
import { todoRepositoryProviders } from './todoRepositoryProviders';
import { NotFoundError } from 'thirty/errors';
import { scopes } from './scopes';

const PatchTodoResponseModel = z.object({
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
  patch('/todos/{todoId}'),
  scopes('todo:update'),
  authorizer('default'),
  requestBody(
    z.object({
      title: z.string(),
      completed: z.boolean(),
    }),
  ),
  responseBody(PatchTodoResponseModel),
)(async (event) => {
  const { todoRepository } = event.deps;

  const todo = todoRepository.findTodoById(event.routeParams.todoId);
  if (!todo) {
    throw new NotFoundError(`Todo with id ${event.routeParams.todoId} not found`);
  }

  return {
    statusCode: 201,
    body: todoRepository.updateTodo({ ...todo, ...event.requestBody }),
  };
});
