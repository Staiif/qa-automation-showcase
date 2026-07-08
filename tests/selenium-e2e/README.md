# Suite Selenium (JS) — Taskly

Suite **end-to-end Selenium WebDriver** (JavaScript) pour l'app **Taskly**, en
**parité de Page Object Model** avec la suite Playwright. Même app, mêmes
sélecteurs (`data-testid`), même `@taskly/e2e-core` (le `requireEnv` et le schéma
de token sont partagés) — mais une **stack QA différente**, très demandée sur le
marché.

> Pourquoi une 2ᵉ stack web ? Pour démontrer que le **framework de test** (POM,
> waits explicites, isolation, seed/teardown via API) est maîtrisé
> indépendamment de l'outil : ici WebDriver au lieu de Playwright.

## Stack

| | |
|---|---|
| Driver | [`selenium-webdriver`](https://www.selenium.dev/selenium/docs/api/javascript/) (Selenium 4 — Selenium Manager résout chromedriver tout seul) |
| Runner | [Mocha](https://mochajs.org/) + [Chai](https://www.chaijs.com/) |
| Rapport | [mochawesome](https://github.com/adamgruber/mochawesome) (HTML, `npm run test:report`) |
| Navigateur | Chrome headless (`--headless=new`) |

## Architecture

```
src/
├── support/
│   ├── env.js        # .env racine + comptes (réutilise requireEnv d'e2e-core)
│   ├── driver.js     # Chrome headless, waits explicites uniquement (anti-flaky)
│   ├── apiClient.js  # login / reset / createTask (setup-teardown via l'API)
│   ├── session.js    # seedSession via localStorage (skip le login UI)
│   └── servers.js    # boot API + web preview (équivalent du webServer Playwright)
├── pages/
│   ├── BasePage.js       # byId(data-testid), goto, visible/click/type (waits explicites)
│   ├── LoginPage.js      # miroir de pages/LoginPage.ts (Playwright)
│   └── TaskBoardPage.js  # miroir de pages/TaskBoardPage.ts (Playwright)
└── specs/
    ├── auth.spec.js   # login valide/invalide, persistance de session, déconnexion
    └── tasks.spec.js  # ajout, complétion, suppression, filtres, seed via API, saisie vide
```

## Lancer

Depuis la **racine du repo** :

```bash
cp .env.example .env          # comptes & secret de test (une fois)
npm install
npm run test:selenium         # boote l'API + le preview web, puis lance la suite (headless)
```

Ou directement dans la suite :

```bash
npm run test --workspace tests/selenium-e2e          # headless
npm run test:headed --workspace tests/selenium-e2e   # navigateur visible (HEADLESS=0)
npm run test:report --workspace tests/selenium-e2e   # + rapport HTML -> reports/index.html
```

La suite **démarre elle-même** l'API (`npm run api:start`) et le **build de
production** du front (`npm run web:build && npm run web:preview`) via des
*global fixtures* Mocha, puis les arrête à la fin — comme le `webServer` de
Playwright. Définir `BASE_URL` cible un déploiement déjà en ligne (et saute le
boot des serveurs).

## Variables d'environnement

Lues depuis le `.env` racine (jamais en dur), comme les autres suites :

| Variable | Rôle | Défaut |
|---|---|---|
| `TASKLY_DEMO_EMAIL` / `TASKLY_DEMO_PASSWORD` | Compte de démo (un compte worker `…+w99@…` en est dérivé) | — (requis) |
| `TEST_SUPPORT_SECRET` | Secret de l'endpoint de reset | — (requis) |
| `VITE_API_URL` | URL de l'API | `http://localhost:3001` |
| `BASE_URL` | Cible web (vide = boote le preview local) | `http://localhost:4173` |
| `HEADLESS` | `0`/`false` pour un navigateur visible | `true` |
| `SELENIUM_WORKER` | Index du compte worker (isolation) | `99` |

## Anti-flaky

- **Waits explicites uniquement** (`until.elementLocated` + `elementIsVisible`),
  jamais d'`implicit wait` (mélanger les deux est la cause n°1 de flakiness).
- **Sélecteurs `data-testid` stables**, partagés avec la suite Playwright.
- **Isolation + reset via l'API** avant chaque test (compte worker dédié).
- **Retries** en CI (2) — voir le workflow `selenium-e2e.yml`.
