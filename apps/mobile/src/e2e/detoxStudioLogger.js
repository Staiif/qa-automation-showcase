// Vendored from detox-studio packages/app-logger v0.1.0 — do not edit here,
// update the canonical copy and re-vendor.
/**
 * @detox-studio/app-logger — structured E2E log emitter for React Native.
 *
 * How it works: instead of talking to any server, every event is written as
 * a single `__E2E__{json}` line through console.log. Under test, the studio's
 * logcat pump (MCP runner or the Jest reporter) picks these markers up from
 * the device log stream, decodes them, and stores them attributed to the
 * current run/simulator/scenario. The app never needs to know a server URL,
 * a runId, or even that it is being observed.
 *
 * Plain console.log/warn/error calls are already captured by the pump with
 * LOG/WARN/ERROR levels — do NOT wrap the console here, it would duplicate.
 * This module only adds what logcat cannot see structure in: network calls,
 * Sentry events, and business events (PDF, FS…).
 *
 * Usage (index.js):
 *   import { init, attachFetch } from '@detox-studio/app-logger';
 *   if (__DEV__) { init(); attachFetch(); }
 */

const MARKER = '__E2E__';
const MAX_MESSAGE_LEN = 3500; // stay well under logcat's ~4KB line limit

let enabled = false;
// Captured once so console interception elsewhere can't loop us
const originalLog = console.log.bind(console);

function emit(level, source, message, extra) {
  if (!enabled) return;
  try {
    originalLog(MARKER + JSON.stringify({
      level,
      source,
      message: String(message).slice(0, MAX_MESSAGE_LEN),
      ...extra,
    }));
  } catch {
    // Logging must never break the app
  }
}

/** Enable the emitter explicitly (manual control). */
export function init(options = {}) {
  enabled = options.enabled !== false;
}

/** Whether the emitter is currently active. */
export function isEnabled() {
  return enabled;
}

/**
 * Recommended activation: enable ONLY when the app was launched by Detox
 * with `launchArgs: { detoxStudioLogs: true }` — which Detox Studio's
 * runners pass automatically. Same APK for dev and E2E; a normal dev
 * session stays silent. Requires the app to have the standard
 * `react-native-launch-arguments` native module; if it's absent, this is
 * a silent no-op.
 */
export function initForDetox() {
  try {
    // eslint-disable-next-line global-require
    const { LaunchArguments } = require('react-native-launch-arguments');
    const value = LaunchArguments.value();
    if (value && (value.detoxStudioLogs === true || value.detoxStudioLogs === 'true')) {
      enabled = true;
    }
  } catch {
    // module not installed or not a Detox launch: stay disabled
  }
  return enabled;
}

/** Manual business event, e.g. log('PDF', 'invoice', 'Generated invoice.pdf'). */
export function log(level, source, message, metadata) {
  emit(level, source, message, metadata ? { metadata } : undefined);
}

/**
 * Mirror console.log/warn/error as structured markers. iOS ONLY by default:
 * on Android the logcat pump already captures the console natively (tags
 * ReactNativeJS I/W/E) and wrapping it would duplicate every line. On iOS
 * the unified log has no reliable RN tag, so this is how plain console
 * output reaches the Logs Viewer. Pass { force: true } to override.
 */
export function attachConsole(options = {}) {
  let isIOS = false;
  try {
    // eslint-disable-next-line global-require
    isIOS = require('react-native').Platform.OS === 'ios';
  } catch {
    // outside RN (tests): treat as not iOS
  }
  if (!isIOS && !options.force) return;
  if (console.__e2ePatched) return;
  console.__e2ePatched = true;

  const wrap = (method, level) => {
    const original = console[method].bind(console);
    console[method] = (...args) => {
      original(...args);
      emit(level, 'console', args.map(a => (typeof a === 'string' ? a : safeStringify(a))).join(' '));
    };
  };
  wrap('log', 'LOG');
  wrap('warn', 'WARN');
  wrap('error', 'ERROR');
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Patch global fetch: every call surfaces as API / API ERROR with its status. */
export function attachFetch() {
  if (typeof global.fetch !== 'function' || global.fetch.__e2ePatched) return;
  const original = global.fetch;
  const patched = async function (input, opts) {
    const method = ((opts && opts.method) || 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    const startedAt = Date.now();
    try {
      const res = await original(input, opts);
      emit(res.ok ? 'API' : 'API ERROR', 'fetch', `${method} ${url} → ${res.status}`, {
        httpStatus: res.status,
        metadata: { durationMs: Date.now() - startedAt },
      });
      return res;
    } catch (error) {
      emit('API ERROR', 'fetch', `${method} ${url} → ${error.message}`, {
        metadata: { durationMs: Date.now() - startedAt },
      });
      throw error;
    }
  };
  patched.__e2ePatched = true;
  global.fetch = patched;
}

/** Register response interceptors on an axios instance. */
export function attachAxios(instance) {
  if (!instance || !instance.interceptors || instance.__e2ePatched) return;
  instance.__e2ePatched = true;
  instance.interceptors.response.use(
    (response) => {
      const { method, url } = response.config || {};
      emit('API', 'axios', `${(method || 'GET').toUpperCase()} ${url} → ${response.status}`, {
        httpStatus: response.status,
      });
      return response;
    },
    (error) => {
      const cfg = error.config || {};
      const status = error.response ? error.response.status : undefined;
      emit('API ERROR', 'axios', `${(cfg.method || 'GET').toUpperCase()} ${cfg.url} → ${status ?? error.message}`, {
        httpStatus: status,
      });
      return Promise.reject(error);
    },
  );
}

/** Mirror Sentry captures as SENTRY-level logs. */
export function attachSentry(Sentry) {
  if (!Sentry || Sentry.__e2ePatched) return;
  Sentry.__e2ePatched = true;
  const originalException = Sentry.captureException && Sentry.captureException.bind(Sentry);
  const originalMessage = Sentry.captureMessage && Sentry.captureMessage.bind(Sentry);
  if (originalException) {
    Sentry.captureException = (error, hint) => {
      emit('SENTRY', 'sentry', (error && error.message) || String(error));
      return originalException(error, hint);
    };
  }
  if (originalMessage) {
    Sentry.captureMessage = (message, level) => {
      emit('SENTRY', 'sentry', String(message));
      return originalMessage(message, level);
    };
  }
}
