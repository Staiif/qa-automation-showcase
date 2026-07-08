/**
 * Optional E2E logs reporter — streams runs/scenarios/steps to the
 * detox-studio Logs Viewer backend (logs-server, :3001) when it is up.
 *
 * - Fire-and-forget: 1.5s timeout per call, first failure disables reporting
 *   for the rest of the session; the suite never slows down or fails because
 *   of it. Opt-out entirely with E2E_LOGS_DISABLED=1.
 * - Jest-only: steps.js is also loaded by the detox-studio MCP runner, which
 *   does its own reporting — outside Jest this module stays inert.
 * - Parallel-ready: share E2E_RUN_ID across workers to group them into one
 *   run (one simulator per device.id); without it each worker gets its own
 *   run and the Logs Viewer groups them by time window.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVER = process.env.E2E_LOGS_SERVER || 'http://localhost:3001';
const API = `${SERVER}/api/v1`;

const underJest = typeof jest !== 'undefined';
let enabled = underJest && !process.env.E2E_LOGS_DISABLED;

const runId = process.env.E2E_RUN_ID
  || `e2e-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;

let simulatorId = null;
let scenarioId = null;
let scenarioFailed = false;

async function req(method, path, body) {
  if (!enabled) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    enabled = false; // logs-server down: stay silent for the whole session
    return null;
  }
}

async function log(level, message) {
  if (!simulatorId) return;
  await req('POST', `/runs/${runId}/logs`, {
    simulatorId,
    scenarioId,
    logs: [{ timestamp: new Date().toISOString(), level, source: 'detox-cli', message }],
  });
}

/** beforeAll — upsert the run and register this worker's device. */
async function startRun() {
  const run = await req('POST', '/runs', { runId, metadata: { source: 'detox-cli' } });
  if (!run) return;
  const deviceId = (typeof device !== 'undefined' && device.id) || 'detox-device';
  const sim = await req('POST', `/runs/${runId}/simulators`, { deviceId, deviceName: deviceId });
  simulatorId = sim ? sim.id : null;
}

/** beforeEach — register the scenario and emit the start marker. */
async function startScenario(name) {
  scenarioFailed = false;
  scenarioId = null;
  if (!simulatorId) return;
  const scenario = await req('POST', `/runs/${runId}/scenarios`, {
    simulatorId,
    name,
    tags: [],
  });
  if (!scenario) return;
  scenarioId = scenario.id;
  await req('PATCH', `/scenarios/${scenarioId}`, { status: 'running' });
  await log('SCENARIO START', name);
  pumpStart((typeof device !== 'undefined' && device.id) || null);
}

/** Called by the instrumented step wrappers. */
async function reportStep(text, status, error) {
  if (status === 'failed') {
    scenarioFailed = true;
    await log('ERROR', `❌ ${text}${error ? ` — ${error.message}` : ''}`);
  } else {
    await log('STEP', `✅ ${text}`);
  }
}

// ── Logcat pump ──────────────────────────────────────────────────────────────
// Streams the emulator's ReactNativeJS output (plus native crashes) during
// each scenario — no instrumentation needed in the app. Also decodes the
// structured `__E2E__{json}` markers emitted by the optional app logger
// (fetch/axios/Sentry events → API / SENTRY levels).

const MARKER = '__E2E__';
const BRIEF_RE = /^([VDIWEF])\/(ReactNativeJS|AndroidRuntime)\s*\(\s*\d+\):\s?(.*)$/;

let pumpProc = null;
let pumpBuffer = [];
let pumpTimer = null;

function resolveAdb() {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk && fs.existsSync(path.join(sdk, 'platform-tools', 'adb'))) {
    return path.join(sdk, 'platform-tools', 'adb');
  }
  if (process.env.HOME && fs.existsSync(path.join(process.env.HOME, 'Android', 'Sdk', 'platform-tools', 'adb'))) {
    return path.join(process.env.HOME, 'Android', 'Sdk', 'platform-tools', 'adb');
  }
  return 'adb';
}

function pumpIngest(line, android) {
  let priority = 'I';
  let tag = 'ReactNativeJS';
  let rawMessage = line;

  if (android) {
    const match = BRIEF_RE.exec(line);
    if (!match) return;
    priority = match[1];
    tag = match[2];
    rawMessage = match[3];
  } else if (!line.includes(MARKER)) {
    return; // iOS: markers only (log stream banner lines etc.)
  }

  const markerIdx = rawMessage.indexOf(MARKER);
  if (markerIdx !== -1) {
    try {
      const payload = JSON.parse(rawMessage.slice(markerIdx + MARKER.length));
      pumpBuffer.push({
        timestamp: new Date().toISOString(),
        level: String(payload.level || 'LOG'),
        source: String(payload.source || 'app'),
        message: String(payload.message || '').slice(0, 4000),
        httpStatus: typeof payload.httpStatus === 'number' ? payload.httpStatus : undefined,
        metadata: payload.metadata,
      });
      return;
    } catch { /* malformed marker: fall through as plain line */ }
  }

  pumpBuffer.push({
    timestamp: new Date().toISOString(),
    level: tag === 'AndroidRuntime' ? 'ERROR' : priority === 'E' || priority === 'F' ? 'ERROR' : priority === 'W' ? 'WARN' : 'LOG',
    source: tag === 'AndroidRuntime' ? 'crash' : 'device',
    message: rawMessage.slice(0, 4000),
  });
}

async function pumpFlush() {
  if (pumpBuffer.length === 0 || !simulatorId) return;
  const batch = pumpBuffer.splice(0);
  await req('POST', `/runs/${runId}/logs`, { simulatorId, scenarioId, logs: batch });
}

const IOS_UDID_RE = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

function pumpStart(deviceId) {
  pumpStopSync();
  if (!enabled || !deviceId) return;

  let cmd;
  let args;
  let android;
  if (deviceId.startsWith('emulator-')) {
    android = true;
    cmd = resolveAdb();
    args = ['-s', deviceId, 'logcat', '-T', '1', '-v', 'brief', 'ReactNativeJS:V', 'AndroidRuntime:E', '*:S'];
  } else if (IOS_UDID_RE.test(deviceId) && process.platform === 'darwin') {
    // iOS: the unified log has no reliable RN tag — capture the structured
    // __E2E__ markers only (plain console is covered by attachConsole)
    android = false;
    cmd = 'xcrun';
    args = ['simctl', 'spawn', deviceId, 'log', 'stream', '--style', 'compact',
      '--predicate', `eventMessage CONTAINS "${MARKER}"`];
  } else {
    return;
  }

  pumpProc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] });
  pumpProc.on('error', () => { pumpProc = null; });
  let pending = '';
  pumpProc.stdout.on('data', chunk => {
    pending += chunk.toString();
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    lines.forEach(line => pumpIngest(line, android));
  });
  pumpTimer = setInterval(() => { pumpFlush(); }, 500);
}

function pumpStopSync() {
  if (pumpTimer) { clearInterval(pumpTimer); pumpTimer = null; }
  if (pumpProc) { pumpProc.kill('SIGTERM'); pumpProc = null; }
}

/** afterEach — emit the end marker and close the scenario. */
async function endScenario(name) {
  pumpStopSync();
  await pumpFlush();
  if (!scenarioId) return;
  const status = scenarioFailed ? 'failed' : 'passed';
  await log('SCENARIO END', `${name} (${status})`);
  await req('PATCH', `/scenarios/${scenarioId}`, {
    status,
    endedAt: new Date().toISOString(),
  });
  scenarioId = null;
}

module.exports = { startRun, startScenario, reportStep, endScenario };
