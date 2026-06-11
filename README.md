# QA Automation Showcase — E2E Web & Mobile

> Vitrine technique d'automatisation de tests **bout-en-bout**, sur le web
> (Playwright) **et** le mobile React Native (Detox), avec intégration continue.
> Le combo web + mobile dans un seul repo est volontaire : c'est ce qui
> distingue un·e QA automation généraliste d'un·e spécialiste mobile.

[![Web E2E](https://github.com/Staiif/qa-automation-showcase/actions/workflows/web-e2e.yml/badge.svg)](https://github.com/Staiif/qa-automation-showcase/actions/workflows/web-e2e.yml)
[![Mobile E2E](https://github.com/Staiif/qa-automation-showcase/actions/workflows/mobile-e2e.yml/badge.svg)](https://github.com/Staiif/qa-automation-showcase/actions/workflows/mobile-e2e.yml)
[![Living documentation](https://github.com/Staiif/qa-automation-showcase/actions/workflows/pages.yml/badge.svg)](https://github.com/Staiif/qa-automation-showcase/actions/workflows/pages.yml)

### 🔗 Démo live — [living documentation + rapports (web & mobile)](https://staiif.github.io/qa-automation-showcase/)

> En français, lisible par un PO/client : tous les comportements garantis +
> les résultats des suites web (Cucumber) et mobile (Detox). Mis à jour
> automatiquement à chaque `main` vert.

---

## 🎯 Ce que ce repo démontre

| Compétence | Où la voir |
|---|---|
| **E2E core partagé** consommé par **2 apps** (BasePage · ApiClient · fixtures) | [`packages/e2e-core`](./packages/e2e-core) |
| **Page Object Model** — web **et** mobile (parité) | [`tests/playwright/pages`](./tests/playwright/pages) · [`apps/mobile/e2e/support/pages`](./apps/mobile/e2e/support/pages) |
| **BDD / Gherkin bilingue** (FR + EN) au-dessus des Page Objects | [`features/`](./tests/playwright/features) · [`steps/`](./tests/playwright/steps) |
| **Tags & living documentation** (Cucumber HTML + page unifiée) | [`tools/living-docs.mjs`](./tools/living-docs.mjs) |
| **Fixtures** custom (compte par worker, board authentifié) | [`tests/playwright/fixtures.ts`](./tests/playwright/fixtures.ts) |
| **Tests d'API** (contrat, auth, cycle de vie) | [`specs/api.spec.ts`](./tests/playwright/specs/api.spec.ts) |
| **Setup / teardown** des données via l'API | [`fixtures.ts`](./tests/playwright/fixtures.ts) · [`api.spec.ts`](./tests/playwright/specs/api.spec.ts) |
| **Isolation des données en parallèle** (1 compte par worker) | [`fixtures.ts`](./tests/playwright/fixtures.ts) |
| **Comptes en variables d'environnement** (rien en dur) | [`.env.example`](./.env.example) · [`apps/api/src/config.js`](./apps/api/src/config.js) |
| Tests **multi-navigateurs** (Chromium / Firefox / WebKit / mobile) | [`playwright.config.ts`](./tests/playwright/playwright.config.ts) |
| **Tests d'accessibilité** automatisés (axe-core, WCAG 2 AA) | [`specs/accessibility.spec.ts`](./tests/playwright/specs/accessibility.spec.ts) |
| **E2E mobile** React Native + **Gherkin bilingue** (Detox, **vert en CI** sur émulateur Android) | [`apps/mobile/e2e`](./apps/mobile/e2e) |
| **CI** GitHub Actions (navigateurs Linux · émulateur Android · déploiement Pages) | [`.github/workflows`](./.github/workflows) |
| **Rapports publiés** sur GitHub Pages (living doc + Cucumber web + Detox mobile) | [démo live](https://staiif.github.io/qa-automation-showcase/) |
| Stratégie anti-flaky : `testID` stables, retries, `aosp_atd` + ANR masqués (mobile) | partout |

## 🧱 Architecture du monorepo

```
.
├── packages/
│   └── e2e-core/       # Toolkit E2E partagé (BasePage · ApiClient · fixtures) — consommé par 2 suites
├── apps/
│   ├── api/            # API Express (auth · tasks · notes) — comptes en env, endpoint de teardown
│   ├── web/            # App « Taskly » (tâches) — Vite + React + TS
│   ├── notes/          # App « Notely » (notes) — 2e app, même API + même e2e-core
│   └── mobile/         # App « Taskly » — React Native + projet natif android/ (Detox)
├── tests/
│   ├── playwright/     # Suite Tasks : POM, fixtures, specs TS, Gherkin (FR/EN) — sur e2e-core
│   └── notes-e2e/      # Suite Notely : POM, fixtures, specs — sur le MÊME e2e-core
├── tools/              # living-docs.mjs (doc unifiée) + landing GitHub Pages
├── .env.example        # Variables d'env (comptes, secret de test) — à copier en .env
└── .github/workflows/  # web-e2e (Tasks · BDD · Notely) · mobile-e2e (Android) · pages
```

Monorepo npm workspaces (`packages/*`, `apps/*`, `tests/*`) ; les suites web
tournent sur n'importe quel runner Linux. La partie mobile (projet natif Android
+ Detox) est documentée dans [`apps/mobile/README.md`](./apps/mobile/README.md).

## 🧩 E2E core partagé — un cœur, plusieurs apps

Le vrai enjeu Lead n'est pas d'écrire des tests, c'est de **factoriser le
framework** pour qu'ajouter une app coûte presque rien. Ici, **deux apps** —
**Taskly** (tâches) et **Notely** (notes) — partagent **un seul**
[`@taskly/e2e-core`](./packages/e2e-core) :

```
                    packages/e2e-core
       BasePage · ApiClient · makeAuthFixtures · seedSession
              ▲                                   ▲
   tests/playwright  (Taskly)          tests/notes-e2e  (Notely)
   POM + Gherkin FR/EN (BDD)           POM + specs Playwright (sans BDD)
   class TaskApiClient extends …       class NotesApiClient extends …
```

Chaque suite n'écrit que **son domaine** : ses Page Objects (qui étendent
`BasePage`) et son client API (qui étend `ApiClient` avec `createTask` /
`createNote`). L'**isolation par worker**, le **teardown auto** et le **seed de
session** viennent du core — y compris le branchement BDD côté Taskly **et** un
test Playwright standard côté Notely (le core n'est pas lié à Cucumber).

> Transposition web d'un vrai `e2e-core` partagé entre une flotte d'apps mobiles
> (Detox/Cucumber) : la duplication entre suites est le principal coût qu'un
> Lead QA doit tuer.

## 🔐 Configuration & comptes (env)

Aucun identifiant n'est écrit en dur dans le code. Les comptes de test et le
secret protégeant l'endpoint de teardown vivent dans un `.env` (git-ignoré) ;
en CI ce sont des secrets GitHub.

```bash
cp .env.example .env   # puis ajustez les valeurs
```

L'API ([`apps/api/src/config.js`](./apps/api/src/config.js)) **échoue au
démarrage** avec un message clair si une variable requise manque (fail-fast).

## 🔁 Setup / teardown & isolation

- L'API expose `POST /api/test/reset`, **protégé par un secret**, qui nettoie
  les données — la fixture `resetData` l'appelle avant chaque test.
- Les tests peuvent **créer des données via l'API** (seed) puis vérifier le
  rendu côté UI (voir le test « pré-créée via l'API »).
- **Isolation en parallèle** : chaque worker Playwright s'authentifie comme
  `demo+wN@…`, un compte accepté par convention. Les tests tournent ainsi sur
  16 workers sans collision de données.

## 🥒 BDD / Gherkin (FR + EN)

En plus des specs TypeScript, la suite expose des scénarios **Gherkin lisibles
par des non-développeurs**, en **français et en anglais**, via
[`playwright-bdd`](https://github.com/vitalets/playwright-bdd) :

```gherkin
# language: fr
Scénario: Connexion avec des identifiants valides
  Étant donné que je suis sur la page de connexion
  Quand je me connecte avec des identifiants valides
  Alors je vois mon tableau de tâches
```

- Features : [`tests/playwright/features`](./tests/playwright/features)
  (`*.fr.feature` / `*.en.feature`).
- Steps : [`tests/playwright/steps`](./tests/playwright/steps) — ils
  **réutilisent les mêmes Page Objects et fixtures** que les specs.
- Exécution : `npm run test:e2e:bdd` (génère puis lance le projet `bdd`).
  Inclut un `Plan du Scénario` / `Scenario Outline` **data-driven** (filtres).

## 🏷️ Tags & filtrage

Les scénarios sont tagués (`@auth`, `@tasks`, `@smoke`, `@filter`) pour cibler
les runs :

```bash
# Web : ne lancer que la smoke suite
(cd tests/playwright && npx bddgen && npx playwright test --project=bdd --grep @smoke)
# Mobile : filtrage par tag (depuis apps/mobile)
cd apps/mobile && CUCUMBER_TAGS='@smoke' npm run e2e:test:android
```

## 📕 Living documentation & rapports — [démo live](https://staiif.github.io/qa-automation-showcase/)

Trois artefacts **lisibles par un client / PO**, **publiés automatiquement sur
GitHub Pages** à chaque `main` vert :

- **Living documentation unifiée** (web **+** mobile, FR + EN, tags) — toutes les
  fonctionnalités et scénarios garantis, sur une seule page.
- **Rapport Cucumber HTML** (web, pass/fail) — produit par `playwright-bdd`.
- **Rapport Detox HTML** (mobile, pass/fail) — produit par `jest-html-reporters`,
  récupéré depuis le run mobile (cross-workflow).

```bash
npm run docs:living   # génère la living doc en local -> docs/living-documentation.html
```

## 🚀 Démarrage rapide

```bash
cp .env.example .env                 # comptes & secret de test
npm install
npx playwright install --with-deps   # navigateurs (une seule fois)

npm run test:e2e          # toute la suite (API + web + specs + BDD)
npm run test:e2e:ui       # mode UI interactif de Playwright
npm run test:e2e:report   # ouvre le dernier rapport HTML
npm run test:e2e:bdd      # scénarios Gherkin (FR + EN) uniquement
npm run dev               # API + front en local (dev)
```

Le `webServer` de Playwright démarre **l'API puis le build de production du
front**, et lance les tests contre ces artefacts — comme en prod.

## 🐛 Ce que la suite a réellement attrapé

Une bonne suite trouve des bugs *avant* le client. Pendant la mise au point,
elle a fait remonter (et permis de corriger) :

- **Accessibilité (WCAG 2 AA)** : le bleu d'origine des boutons avait un ratio
  de contraste de **4.46:1**, sous le seuil de 4.5:1 — détecté par axe-core,
  palette corrigée.
- **i18n** : un pluriel français incorrect (« 0 tâ**s**ches » au lieu de
  « 0 tâche ») révélé par une assertion sur le compteur.

## 🧪 Couverture fonctionnelle (app Taskly)

- **API** : login valide / invalide, accès refusé sans token, cycle de vie
  d'une tâche (create → toggle → delete), teardown, endpoint protégé.
- **Auth (UI)** : identifiants valides / invalides, persistance de session,
  déconnexion.
- **Tâches (UI)** : création, complétion, suppression, filtres (toutes / à
  faire / terminées), persistance via API, seed via API, saisie vide.
- **Accessibilité** : login et tableau de bord sans violation WCAG 2 AA.

## 📱 Mobile (Detox + Gherkin)

App React Native testée en bout-en-bout avec **Detox**, en scénarios
**Gherkin FR + EN** (jest-cucumber). **Vert en CI** (émulateur Android réel,
image `aosp_atd`) **et en local** — 16 scénarios répartis sur 4 fichiers pour le
sharding multi-workers.

```
PASS  e2e/auth.fr.test.js · auth.en · tasks.fr · tasks.en
  ✓ Connexion / Sign in · Déconnexion / Sign out
  ✓ Ajouter / Adding · Terminer / Completing · Supprimer / Deleting
  ✓ Filtrer / Filtering  (Scenario Outline ×2)
Test Suites: 4 passed · Tests: 16 passed, 16 total
```

Le run CI produit aussi un **rapport HTML Detox** publié sur la [démo live](https://staiif.github.io/qa-automation-showcase/).
Détails (toolchain Android, build release **sans Metro**, run) :
[`apps/mobile/README.md`](./apps/mobile/README.md).

---

<sub>Repo de démonstration — freelance QA / Dev (Playwright · Detox · CI).
Disponible en anglais sur demande pour les missions internationales.</sub>
