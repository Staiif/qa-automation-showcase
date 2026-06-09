# Taskly Mobile — React Native + Detox + Gherkin

Version mobile de l'app Taskly, testée en bout-en-bout avec **Detox** (le
standard du E2E React Native, gris-box sur émulateur Android / simulateur iOS),
et des scénarios **Gherkin bilingues (FR + EN)** via **jest-cucumber**.

> ✅ Vérifié : **16 scénarios passent sur un émulateur Android réel**
> (Pixel 7, API 34) — auth, CRUD, filtres, en français et en anglais.

## Ce que cette partie démontre

- App RN propre (écrans découplés, état typé TypeScript), sélecteurs `testID`.
- **Page Objects Detox** (`LoginScreen`, `TaskBoardScreen`) — parité avec le POM web.
- **BDD Gherkin** lisible par des non-devs, **FR + EN**, branché sur Detox.
- `Plan du Scénario` / `Scenario Outline` data-driven pour les filtres.
- **Tags** (`@smoke`, `@auth`, `@tasks`, `@filter`) avec filtrage par run.
- Config Detox (`android.emu.debug`, `ios.sim.debug`).

## Structure des tests

```
e2e/
├── features/                       # Gherkin (FR + EN)
│   ├── authentication.fr.feature   authentication.en.feature
│   └── tasks.fr.feature            tasks.en.feature
├── support/
│   ├── pages/                      # Page Objects Detox
│   │   ├── LoginScreen.js          TaskBoardScreen.js
│   └── steps.js                    # step definitions (utilisent les Page Objects)
├── auth.fr.test.js  auth.en.test.js
├── tasks.fr.test.js tasks.en.test.js   # 1 fichier/feature -> sharding multi-workers
└── jest.config.js
```

Filtrage par tag :

```bash
CUCUMBER_TAGS='@smoke' npm run e2e:test:android   # ne lance que la smoke suite
npm run e2e:test:android -- --maxWorkers 3        # 3 émulateurs en parallèle
```

## Pré-requis Android (one-time)

```bash
# 1. JDK 17
sudo apt-get install -y openjdk-17-jdk          # (Linux ; macOS : brew install openjdk@17)

# 2. Android SDK (command-line tools) -> $ANDROID_HOME
#    platform-tools, build-tools;35.0.0, platforms;android-34/35,
#    emulator, system-images;android-34;google_apis;x86_64

# 3. Un AVD nommé Pixel_7_API_34
avdmanager create avd -n Pixel_7_API_34 -k "system-images;android-34;google_apis;x86_64" -d pixel_7
```

Variables d'env attendues : `JAVA_HOME`, `ANDROID_HOME` (+ `platform-tools`,
`emulator`, `cmdline-tools/latest/bin` dans le `PATH`).

## Générer le projet natif

Le dossier `android/` est versionné. Pour le régénérer depuis zéro :

```bash
npx @react-native-community/cli@latest init Taskly --version 0.76.5 --skip-install
# recopier android/ puis ré-appliquer la config Detox (voir .detoxrc.js,
# android/app/build.gradle, android/build.gradle, androidTest/.../DetoxTest.java)
```

## Lancer la suite (Android)

```bash
npm install

# 1. Démarrer un émulateur (headless possible)
emulator -avd Pixel_7_API_34 -no-window -gpu swiftshader_indirect &

# 2. Démarrer Metro (l'app debug charge le JS depuis le packager)
npx react-native start &

# 3. Build + run Detox (scénarios Gherkin FR + EN)
npm run e2e:build:android
npm run e2e:test:android
```

iOS : `npm run e2e:build:ios && npm run e2e:test:ios` (macOS + Xcode +
`applesimutils` requis).

> ℹ️ La suite **web (Playwright + Gherkin)** à la racine tourne, elle, sans
> outillage mobile sur un runner Linux standard.
