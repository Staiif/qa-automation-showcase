// CommonJS config (the package is ESM): lets us compute retries from the env,
// mirroring the Playwright config's `retries: isCI ? 2 : 0`.
module.exports = {
  spec: 'src/specs/**/*.spec.js',
  require: 'src/support/servers.js', // Mocha global fixtures: boot/teardown the stack
  timeout: 60_000,
  slow: 10_000,
  retries: process.env.CI ? 2 : 0,
};
