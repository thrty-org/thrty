export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const todoRepositoryFactory = () => {
  let todos: Todo[] = [];
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
    findTodoById(id: string): Todo | undefined {
      return todos.find((todo) => todo.id === id);
    },
    findTodos(): Todo[] {
      return todos;
    },
    updateTodo(todo: Todo) {
      const updatedTodo = { ...todo, updatedAt: new Date().toISOString() };
      todos = todos.map((_todo) => (_todo.id === todo.id ? updatedTodo : _todo));
      return updatedTodo;
    },
  };
};
