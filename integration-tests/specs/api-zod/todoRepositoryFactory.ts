export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const todoRepositoryFactory = () => {
  const todos = [];
  return {
    createTodo(title: string): Todo {
      const todo = {
        id: Math.random().toString(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      todos.push(todo);
      return todo;
    },
  };
};
