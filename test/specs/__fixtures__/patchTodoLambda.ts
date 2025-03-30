import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { compose, types } from '@thrty/core';
import { authorizer, patch } from '@thrty/api';
import { requestBody, responseBody } from '@thrty/api-zod';
import { inject } from '@thrty/inject';
import { z } from 'zod';
import { todoRepositoryProviders } from './todoRepositoryProviders';
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
    throw new Error(`Todo with id ${event.routeParams.todoId} not found`);
  }

  return {
    statusCode: 201,
    body: todoRepository.updateTodo({ ...todo, ...event.requestBody }),
  };
});
