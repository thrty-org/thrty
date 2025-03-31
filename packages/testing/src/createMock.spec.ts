import { createMock } from './createMock';

type User = {
  id: string;
  name: string;
};
type UserService = {
  getUser(userId: string): Promise<User>;
  createUser(name: string): Promise<User>;
};

it('should mock service properly', async () => {
  const userService = createMock<UserService>();

  userService.createUser.mockImplementation((name) => Promise.resolve({ id: 'USER_1', name }));
  userService.getUser.mockResolvedValue(Promise.resolve({ id: 'USER_2', name: 'Emmett' }));

  await expect(userService.createUser('Marty')).resolves.toEqual({ id: 'USER_1', name: 'Marty' });
  expect(userService.createUser).toHaveBeenCalledTimes(1);
  await expect(userService.getUser('Emmett')).resolves.toEqual({ id: 'USER_2', name: 'Emmett' });
  expect(userService.getUser).toHaveBeenCalledTimes(1);
});

it('should clear all mocks', async () => {
  const userService = createMock<UserService>();

  userService.createUser('Marty');
  userService.getUser('USER_1');

  userService.mockClear();

  expect(userService.createUser).toHaveBeenCalledTimes(0);
  expect(userService.getUser).toHaveBeenCalledTimes(0);
});
