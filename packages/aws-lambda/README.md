<h1 align="center">
  <img src="../../assets/logo.svg" alt="thrty" width="150">
  <br>
  @thrty/aws-lambda
  <br>
</h1>

<h4 align="center">Drop-in type overrides for <code>aws-lambda</code> — sensible generic defaults and real-world accuracy fixes.</h4>

<p align="center">
    <img src="https://img.shields.io/npm/v/@thrty/aws-lambda.svg">
    <img src="https://github.com/thrty-org/thrty/actions/workflows/checks.yml/badge.svg">
</p>

### Installation

```shell
npm install --save-dev @thrty/aws-lambda
```

Peer dependency on `aws-lambda` (and its `@types/aws-lambda`). No runtime code — pure TypeScript declarations.

### What it does

This package re-declares a small set of `aws-lambda` types where the official `@types/aws-lambda` is either too verbose (generics with no defaults) or doesn't reflect actual AWS runtime behavior. Everything else stays in `aws-lambda` — import the unchanged types from there.

#### Handler types with defaults

```ts
import type { EventBridgeHandler } from '@thrty/aws-lambda';

// All three generics default — pass only what you care about
typesOf<EventBridgeHandler>();
typesOf<EventBridgeHandler<'OrderPlaced'>>();
typesOf<EventBridgeHandler<'OrderPlaced', Order>>();
typesOf<EventBridgeHandler<'OrderPlaced', Order, void>>();
```

| Export                                              | Defaults added              |
| --------------------------------------------------- | --------------------------- |
| `EventBridgeHandler<TDetailType, TDetail, TResult>` | `string`, `unknown`, `void` |
| `EventBridgeEvent<TDetailType, TDetail>`            | `string`, `unknown`         |

#### Result types with corrections

```ts
import type { APIGatewayProxyResult } from '@thrty/aws-lambda';

// 204 No Content — body is optional, matching actual API Gateway behavior
const res: APIGatewayProxyResult = { statusCode: 204 };
```

| Export                  | Correction                               |
| ----------------------- | ---------------------------------------- |
| `APIGatewayProxyResult` | `body?: string` (was `string`, required) |

### Why a separate package?

Keeping the corrections out of `@thrty/core` means you can opt in only where you need them, and we don't add a hidden coupling to `aws-lambda` from the core engine. Use `@thrty/aws-lambda` for the types it overrides; keep importing everything else from `aws-lambda` directly.
