<h1 align="center">
  <img src="../../assets/logo.svg" alt="thirty" width="150">
  <br>
  @thrty/testing
  <br>
</h1>

<h4 align="center">Utils for testing composed Lambda functions</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/testing.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell script
npm install @thrty/testing
```

### Usage

```typescript
// handler.spec.ts
import { fromPartial, createMock, EventOf } from '@thrty/testing'
import { handler } from './handler';

const userService = createMock<UserService>();
type Event = EventOf<typeof handler>;

it('should return created user', async () => {
    const user = { /*...*/ };
    userService.createUser.mockResolvedValue(user);
    const event = fromPartial<Event>({
        deps: { userService },
        jsonBody: user,
    });

    const { statusCode, body } = await handler.actual(event);

    const expectedUser = { /*...*/ };
    expect(statusCode).toBe(201);
    expect(body).toEqual(expectedUser);
});
```