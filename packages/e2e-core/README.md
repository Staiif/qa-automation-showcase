# @taskly/e2e-core

Shared E2E toolkit consumed by **every app's test suite** — so adding a new app
means writing only what's specific to it, not re-implementing the plumbing.

This mirrors a real-world setup where a fleet of apps (here: **Tasks** and
**Notes**) share one `e2e-core`: a base API client, base Page Object, and a
fixtures factory.

## What it provides

| Export | Rôle |
|---|---|
| `BasePage` | Page Object de base (`page`, `byId`, `goto`, `reload`) — chaque app n'écrit que ses écrans |
| `ApiClient` | client API **setup/teardown** (`login`, `reset`, `post`) — à étendre par domaine (`createTask`, `createNote`…) |
| `makeAuthFixtures(base, config)` | fixtures partagées : **compte par worker** + **reset auto** (isolation parallèle) |
| `seedSession(page, key, user)` | injecte une session en `localStorage` (skip le login UI) |
| `tokenFor`, `requireEnv` | utilitaires |

## How an app plugs in

```js
import { test as base } from 'playwright-bdd';
import { makeAuthFixtures, ApiClient, BasePage } from '@taskly/e2e-core';

const config = { apiUrl, testSecret, demoUser, sessionKey: 'myapp.session' };

class MyApiClient extends ApiClient {           // domaine spécifique
  createThing(token, name) { return this.post('/api/things', token, { name }); }
}
class MyPage extends BasePage {                 // écrans spécifiques
  get title() { return this.byId('title'); }
}

export const test = makeAuthFixtures(base, config).extend({
  api: async ({ request }, use) => use(new MyApiClient(request, config)),
  myPage: async ({ page }, use) => use(new MyPage(page)),
});
```

Voir [`tests/playwright`](../../tests/playwright) (app **Tasks**) et
[`tests/notes-e2e`](../../tests/notes-e2e) (app **Notes**) : deux suites, **un**
seul cœur.

> Écrit en JavaScript (fidèle à un vrai `e2e-core` mobile Detox/Cucumber), avec
> des types fournis par `index.d.ts`. Zéro dépendance runtime : le `base` test
> est injecté.
