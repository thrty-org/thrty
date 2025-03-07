import { todoRepositoryFactory } from './todoRepositoryFactory';

export const todoRepositoryProviders = {
  todoRepository: todoRepositoryFactory,
};
