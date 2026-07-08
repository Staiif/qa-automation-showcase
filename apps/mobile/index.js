import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initForDetox, attachFetch, attachConsole } from './src/e2e/detoxStudioLogger';

// E2E observability: structured markers picked up by Detox Studio's device
// log pump. Only active when Detox launches the app with
// launchArgs { detoxStudioLogs: true } — normal dev sessions stay silent.
if (initForDetox()) {
  attachFetch();
  attachConsole(); // iOS only (Android console is captured via logcat)
}

AppRegistry.registerComponent(appName, () => App);
