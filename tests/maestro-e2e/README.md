# Suite Maestro — Taskly mobile

Suite **end-to-end Maestro** pour l'app **React Native** Taskly, en parité de
scénarios avec les suites Detox et Appium : mêmes `testID`, même app, mêmes
comportements couverts. La différence : les tests sont des **flows YAML
déclaratifs** — pas de code, pas de Screen Objects, pas de `node_modules`.

> Trois outils mobiles, trois philosophies : Detox (gray-box, instrumentation),
> Appium (WebDriver, protocole standard), **Maestro (déclaratif, YAML)**.
> Maestro mise sur la simplicité : un flow se lit comme un scénario de test
> manuel, et la tolérance au flakiness (attentes implicites) est intégrée.

## Stack

| | |
|---|---|
| Runner | [Maestro CLI](https://maestro.mobile.dev/) (2.x) |
| Tests | Flows **YAML** (`flows/`), subflow partagé via `runFlow` |
| Cible | App RN **release** (bundle Hermes embarqué) sur émulateur **Pixel_7_API_34** |
| Rapport | JUnit (`reports/maestro.xml`) + artefacts de debug (screenshots) |

## Pré-requis

1. **Android SDK + un émulateur** (l'AVD `Pixel_7_API_34`, le même que Detox/Appium).
2. **L'APK release** de l'app mobile, installé sur l'émulateur :
   ```bash
   (cd apps/mobile && npm install && cd android && ./gradlew assembleRelease)
   adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
   ```
3. **Le CLI Maestro** (aucune dépendance npm dans cette suite) :
   ```bash
   curl -Ls https://get.maestro.mobile.dev | bash
   # puis: export PATH="$PATH:$HOME/.maestro/bin"
   ```

## Lancer

```bash
# émulateur démarré + APK installé
cd tests/maestro-e2e
npm test              # toute la suite
npm run test:auth     # flows taggés `auth` uniquement
npm run test:tasks    # flows taggés `tasks` uniquement
```

`run.mjs` (zéro dépendance) lit les comptes dans le `.env` racine, les injecte
en variables de flow (`${EMAIL}` / `${PASSWORD}`) et lance `maestro test` sur le
workspace avec rapport JUnit + debug dans `reports/`.

## Architecture

```
.
├── config.yaml            # workspace : globs des flows exécutables + continueOnFailure
├── run.mjs                # wrapper : .env racine → --env, rapport JUnit, debug output
└── flows/
    ├── common/
    │   └── login.yaml     # subflow réutilisé partout (runFlow) — jamais exécuté seul
    ├── auth/
    │   ├── connexion-valide.yaml
    │   ├── connexion-invalide.yaml
    │   └── deconnexion.yaml
    └── tasks/
        ├── ajout-tache.yaml
        ├── completion-et-filtre.yaml
        ├── suppression.yaml
        └── saisie-vide.yaml
```

Le subflow `common/login.yaml` n'est **pas** listé dans les globs de
`config.yaml` : il ne s'exécute que via `runFlow`, jamais comme test autonome.

## Sélecteurs RN → Maestro

Un `testID` React Native remonte comme **`resource-id`** côté Android — y
compris sur les touchables (vérifié via `maestro hierarchy`). Tous les
sélecteurs utilisent donc `id: "<testID>"`, les mêmes identifiants que Detox
et Appium.

## Limitation connue : pas d'Unicode dans `inputText`

Sur Android, `inputText` de Maestro est **limité à l'ASCII** (erreur
`Unicode not supported`). Saisir « Tâche à supprimer » échoue à cause des
accents. Le flow de suppression utilise donc un titre sans accents
(« Nettoyer le bureau ») — les *assertions* sur du texte accentué rendu par
l'app (« 1 tâche à faire », « Terminées »…) fonctionnent, elles, parfaitement :
la limite ne concerne que la **saisie clavier**.

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `TASKLY_DEMO_EMAIL` / `TASKLY_DEMO_PASSWORD` | Compte de démo (depuis `.env`) | — (requis) |

## CI

`.github/workflows/maestro-e2e.yml` : émulateur (`reactivecircus/android-emulator-runner`,
même config que Detox/Appium), build APK release, install du CLI Maestro,
run headless, rapport JUnit + debug en artefacts.
