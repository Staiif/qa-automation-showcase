# QA Automation Showcase — E2E Web & Mobile

> Vitrine technique d'automatisation de tests **bout-en-bout**, sur le web
> (Playwright) **et** le mobile React Native (Detox), avec intégration continue.
> Le combo web + mobile dans un seul repo est volontaire : c'est ce qui
> distingue un·e QA automation généraliste d'un·e spécialiste mobile.

[![Web E2E](https://img.shields.io/badge/web%20e2e-playwright-2EAD33)](./tests/playwright)
[![Mobile E2E](https://img.shields.io/badge/mobile%20e2e-detox-7B61FF)](./apps/mobile)
[![CI](https://img.shields.io/badge/ci-github%20actions-2088FF)](./.github/workflows)

---

## 🎯 Ce que ce repo démontre

| Compétence | Où la voir |
|---|---|
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
| **E2E mobile** React Native + **Gherkin bilingue** (Detox, Android vérifié) | [`apps/mobile/e2e`](./apps/mobile/e2e) |
| **CI** prête à l'emploi (matrice de navigateurs + runner macOS) | [`.github/workflows`](./.github/workflows) |
| Stratégie anti-flaky : `testID` stables, retries, trace on retry | partout |

## 🧱 Architecture du monorepo

```
.
├── apps/
│   ├── api/            # API Express (auth + tasks) — comptes lus dans l'env, endpoint de teardown
│   ├── web/            # App démo « Taskly » — Vite + React + TS (cible des tests web)
│   └── mobile/         # App démo « Taskly » — React Native (cible des tests Detox)
├── tests/
│   └── playwright/     # Suite E2E + API : POM, fixtures, specs TS, features Gherkin (FR/EN)
├── .env.example        # Variables d'env (comptes, secret de test) — à copier en .env
└── .github/workflows/  # web-e2e (Linux) + mobile-e2e (macOS)
```

Les workspaces npm `apps/api`, `apps/web` et `tests/playwright` s'installent et
tournent sur n'importe quel runner Linux. La partie mobile (outillage natif)
est documentée dans [`apps/mobile/README.md`](./apps/mobile/README.md).

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
# Web (Playwright) : ne lancer que la smoke suite
npm run test:e2e:bdd -- --grep @smoke
# Mobile (Detox) : filtrage par tag
CUCUMBER_TAGS='@smoke' npm run e2e:test:android --workspace apps/mobile
```

## 📕 Living documentation

Deux artefacts **lisibles par un client / PO**, générés depuis les `.feature` :

- **Rapport Cucumber HTML** (web, avec pass/fail) : produit par `playwright-bdd`
  à chaque run → `tests/playwright/reports/cucumber/index.html`.
- **Living documentation unifiée** (web **+** mobile, FR + EN, tags) :

```bash
npm run docs:living   # -> docs/living-documentation.html
```

Une seule page qui liste toutes les fonctionnalités, scénarios et tags des deux
plateformes — idéale pour montrer à un client *ce que la suite garantit*.

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
**Gherkin FR + EN** (jest-cucumber). **Vérifié : 16 scénarios passent sur un
émulateur Android réel** (Pixel 7 / API 34).

```
PASS e2e/bdd.test.js
  ✓ Connexion / Sign in · Déconnexion / Sign out
  ✓ Ajouter / Adding · Terminer / Completing · Supprimer / Deleting
  ✓ Filtrer / Filtering  (Scenario Outline ×2)
Tests: 16 passed, 16 total
```

Détails (toolchain Android, build, run) :
[`apps/mobile/README.md`](./apps/mobile/README.md).

---

<sub>Repo de démonstration — freelance QA / Dev (Playwright · Detox · CI).
Disponible en anglais sur demande pour les missions internationales.</sub>
