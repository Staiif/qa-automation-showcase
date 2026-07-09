# Suite Appium (WebDriver) — Taskly mobile

Suite **end-to-end Appium** (WebDriverIO + UiAutomator2) pour l'app **React
Native** Taskly, en **parité de Screen Object Model** avec la suite Detox : mêmes
`testID`, même app, mêmes scénarios. La différence : Appium pilote l'app via le
**protocole WebDriver** — *le même protocole que Selenium côté web*.

> C'est « Selenium pour le mobile » : Appium réutilise le protocole et l'écosystème
> WebDriver pour automatiser des **apps natives**. Cette suite démontre donc la
> **même famille d'outils** que la suite Selenium web, mais sur mobile natif.

## Stack

| | |
|---|---|
| Client | [WebdriverIO](https://webdriver.io/) (client WebDriver) |
| Serveur | [Appium 2](https://appium.io/) + driver **UiAutomator2** (Android) |
| Runner | wdio testrunner + framework **Mocha** |
| Cible | App RN **release** (bundle Hermes embarqué) sur émulateur **Pixel_7_API_34** |

## Pré-requis

1. **Android SDK + un émulateur** (l'AVD `Pixel_7_API_34`, le même que Detox).
2. **L'APK release** de l'app mobile :
   ```bash
   (cd apps/mobile && npm install && cd android && ./gradlew assembleRelease)
   # -> apps/mobile/android/app/build/outputs/apk/release/app-release.apk
   ```
3. Les dépendances de la suite **et le driver Appium** :
   ```bash
   cd tests/appium-e2e
   npm install
   npm run appium:driver   # installe le driver uiautomator2 si absent (idempotent)
   ```
   > `appium:driver` est **idempotent** : `appium-uiautomator2-driver` est déjà
   > une devDependency de la suite, donc Appium le détecte souvent comme
   > `[installed (npm)]` après `npm install`. Le script saute alors l'install
   > (sinon `appium driver install` échoue avec « already installed »).

## Lancer

```bash
# émulateur déjà démarré (adb devices -> emulator-5554)
cd tests/appium-e2e && npm test

# ou laisser Appium démarrer l'AVD lui-même :
ANDROID_AVD=Pixel_7_API_34 npm test
```

Le serveur Appium est démarré/arrêté automatiquement par `@wdio/appium-service`.
Rapport JUnit dans `reports/`.

## Architecture

```
src/
├── support/
│   ├── env.js     # .env racine (comptes) + chemin APK + device/AVD
│   └── app.js     # relaunchApp() — état frais entre tests (≈ Detox newInstance)
├── screens/
│   ├── BaseScreen.js      # byId(testID) → resource-id OU content-desc (robuste RN)
│   ├── LoginScreen.js     # miroir du Detox LoginScreen
│   └── TaskBoardScreen.js # miroir du Detox TaskBoardScreen
└── specs/
    ├── auth.spec.js   # connexion valide/invalide, déconnexion
    └── tasks.spec.js  # ajout, complétion + filtre, suppression, saisie vide
```

## Sélecteurs RN → Appium

Un `testID` React Native apparaît, côté Android, soit comme **`resource-id`**
(la plupart des vues), soit comme **`content-desc`** (touchables accessibles).
`BaseScreen.byId()` matche **les deux** en XPath — donc les `testID` partagés
avec Detox fonctionnent ici sans modification.

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `TASKLY_DEMO_EMAIL` / `TASKLY_DEMO_PASSWORD` | Compte de démo (depuis `.env`) | — (requis) |
| `APP_PATH` | Chemin de l'`.apk` | APK release de `apps/mobile` |
| `ANDROID_DEVICE` | Device adb | `emulator-5554` |
| `ANDROID_AVD` | Si défini, Appium démarre cet AVD | *(vide → device déjà lancé)* |

## CI

`.github/workflows/appium-e2e.yml` : émulateur (`reactivecircus/android-emulator-runner`,
même config que Detox), build APK release, install du driver, run wdio headless,
retries 1.
