<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/inject
  <br>
</h1>

<h4 align="center">A middleware that provides a light weight and type-safe dependency injection container</h4>

<p align="center">
<img src="https://img.shields.io/npm/v/@thrty/inject.svg">
  <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/inject
```

### Usage

```typescript
import { compose, types } from '@thrty/core';
import { inject } from '@thrty/inject';

export const handler = compose(
  types<{}, Promise<void>(),
  inject({
    userRepository: userRepositoryFactory,
    userService: userServiceFactory,
  }),
)(async event => {
  const { userService } = event.deps;
  const user = await userService.createUser(event.jsonBody);
});
```

The dependency injection container makes use of factory functions. Dependencies will be resolved by the name of the key
in DI container.

So given a user service factory like the following, where `userRepository` is defined as a dependency of `userServiceFactory`,
`userRepository` need to be configured in the DI container as well.
```typescript
// userServiceFactory.ts
export interface UserServiceOptions {
  userRepository: UserRepository;
}
export const userServiceFactory = ({ userRepository }: UserServiceOptions) => ({
    async createUser(user: User) {
      return userRepository.create(user);
    },
    async getUser(id: string) {
      return userRepository.findById(id);
    },
});
```
```typescript
inject({
  userRepository: userRepositoryFactory,
  userService: userServiceFactory,
})
```

### Type safety
If a dependency is missing or not configured correctly (e.g. typo), the 

### Testing



### Best practices

Create _provider_ objects to encapsulate the creation of your dependencies. This ensures that you only need to configure
dependencies, that you really want to use directly in the lambdas business code - So that you don't worry about sub-dependencies. 
This also allows you to easily mock them in your tests.

Assuming there is a service `UserService` that depends on a `UserRepository`, you can create a provider like this:
```typescript
export const userServiceProviders = {
  userService: userServiceFactory,
  userRepository: userRepositoryFactory,
};
```
Then you just need to spread the providers into the DI container configuration:
```typescript
  inject({
    ...userServiceProviders,
  })
```

### Classes
Classes can be used as well. Given the following class `UserService` that depends on a `UserRepository`.
```typescript
import { fromClass } from '@thrty/inject';

export class UserService {
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }
  /* ... */
}
```
The provider or container needs to be set up like this:
```typescript
export const userServiceProviders = {
  userService: (deps: { userRepository: UserRepository }) => new UserService(deps.userRepository),
  userRepository: userRepositoryFactory,
};
```
or use the helper function `fromClass` to create the provider:
```typescript
export const userServiceProviders = {
  userService: fromClass(UserService, 'userRepostory'),
  userRepository: userRepositoryFactory,
};
```
