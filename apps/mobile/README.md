# Taskly Mobile — React Native + Detox + Gherkin

Version mobile de l'app Taskly, testée en bout-en-bout avec **Detox** (le
standard du E2E React Native, gris-box sur émulateur Android / simulateur iOS),
et des scénarios **Gherkin bilingues (FR + EN)** via **jest-cucumber**.

> ✅ **Vert en CI** (émulateur Android réel, image `aosp_atd`) **et en local** —
> **16 scénarios** : auth, CRUD, filtres, en français et en anglais.

## Ce que cette partie démontre

- App RN propre (écrans découplés, état typé TypeScript), sélecteurs `testID`.
- **Page Objects Detox** (`LoginScreen`, `TaskBoardScreen`) — parité avec le POM web.
- **BDD Gherkin** lisible par des non-devs, **FR + EN**, branché sur Detox.
- `Plan du Scénario` / `Scenario Outline` data-driven pour les filtres.
- **Tags** (`@smoke`, `@auth`, `@tasks`, `@filter`) avec filtrage par run.
- Configs Detox **debug** (+ Metro) et **release** (bundle embarqué, sans Metro — utilisée en CI).
- **Rapport HTML** (`jest-html-reporters`) publié sur GitHub Pages.

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

Variables d'env attendues : `JAVA_HOME`, `ANDROID_HOME` / `ANDROID_SDK_ROOT`
(+ `platform-tools`, `emulator`, `cmdline-tools/latest/bin` dans le `PATH`).
Ajoute-les à ton shell (`~/.zshrc` / `~/.bashrc`) :

```bash
export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin"
```

> ⚠️ Un terminal **déjà ouvert** ne voit pas ces variables : lance
> `source ~/.zshrc` (ou ouvre un nouveau terminal), sinon Detox échoue avec
> `$ANDROID_SDK_ROOT is not defined`.

## Générer le projet natif

Le dossier `android/` est versionné. Pour le régénérer depuis zéro :

```bash
npx @react-native-community/cli@latest init Taskly --version 0.76.5 --skip-install
# recopier android/ puis ré-appliquer la config Detox (voir .detoxrc.js,
# android/app/build.gradle, android/build.gradle, androidTest/.../DetoxTest.java)
```

## Lancer la suite (Android)

```bash
npm install   # charger d'abord l'env Android : JAVA_HOME, ANDROID_HOME (+ binaires dans le PATH)
```

**Release (recommandé — sans Metro, comme en CI)** : le JS est embarqué dans l'APK.

```bash
emulator -avd Pixel_7_API_34 -no-window -gpu swiftshader_indirect &   # ou avec fenêtre
npx detox build --configuration android.emu.release
npx detox test  --configuration android.emu.release --headless        # -> 16/16
```

**Debug (dev — live-reload via Metro)** :

```bash
emulator -avd Pixel_7_API_34 &
npx react-native start &           # Metro : l'app debug charge le JS depuis le packager
npm run e2e:build:android          # = detox build ... android.emu.debug
npm run e2e:test:android           # = detox test  ... android.emu.debug
```

iOS : `npm run e2e:build:ios && npm run e2e:test:ios` (macOS + Xcode +
`applesimutils` requis).

## 🩺 Dépannage

**`$ANDROID_SDK_ROOT is not defined`** — l'env Android n'est pas chargé dans le
terminal courant. `source ~/.zshrc` ou ouvre un nouveau terminal (voir
[Pré-requis Android](#pré-requis-android-one-time)).

**`Failed to find the app binary … app-debug.apk`** — `e2e:test:android` **ne
compile pas** l'app, il installe un APK déjà présent. Lance d'abord le build :
`npm run e2e:build:android` (ou `detox build -c android.emu.release`).

**`ENOSPC: System limit for number of file watchers reached`** (Metro / jest sur
Linux) — le quota `fs.inotify.max_user_watches` est saturé (souvent par VS Code
qui surveille tout le monorepo). Trois parades, déjà en place dans le repo :

- `metro.config.js` exclut les artefacts de build (`android/build`, `.gradle`)
  du watcher Metro ;
- `.vscode/settings.json` (racine) ajoute `files.watcherExclude` pour
  `node_modules`, les `build/` et `.gradle/` ;
- `e2e/jest.config.js` force `watchman: false` (run one-shot, aucun watcher — et
  évite un watchman système obsolète « empoisonné » à la limite inotify).

Correctif de fond (relève le plafond, nécessite `sudo`) :

```bash
sudo sysctl fs.inotify.max_user_watches=524288 fs.inotify.max_user_instances=2048
# permanent :
echo -e "fs.inotify.max_user_watches=524288\nfs.inotify.max_user_instances=2048" \
  | sudo tee /etc/sysctl.d/60-inotify.conf && sudo sysctl --system
```

> ℹ️ En CI ([`mobile-e2e.yml`](../../.github/workflows/mobile-e2e.yml)), Detox
> tourne en **release** sur un émulateur **`aosp_atd`** (léger, dialogues ANR
> masqués, clavier matériel) — **pas de Metro** — et un **rapport HTML** est
> publié sur la [démo live](https://staiif.github.io/qa-automation-showcase/).
> La suite **web** tourne, elle, sans outillage mobile sur un runner Linux.
