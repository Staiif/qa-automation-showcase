import type { Page, Locator, APIRequestContext, TestType } from '@playwright/test';

export interface Credentials {
  email: string;
  password: string;
}

export interface ApiClientConfig {
  apiUrl: string;
  testSecret: string;
}

export interface E2EConfig extends ApiClientConfig {
  demoUser: Credentials;
  /** localStorage key under which the app stores its session. */
  sessionKey: string;
}

/** Fixtures injected by makeAuthFixtures into every suite. */
export interface CoreFixtures {
  /** A per-parallel-slot account, so parallel tests never share data. */
  user: Credentials;
  /** Autouse: resets this worker's backend data before each test. */
  resetData: void;
}

export function tokenFor(email: string): string;
export function requireEnv(name: string): string;

export class BasePage {
  readonly page: Page;
  constructor(page: Page);
  byId(id: string): Locator;
  goto(path?: string): Promise<void>;
  reload(): Promise<void>;
}

export class ApiClient {
  protected request: APIRequestContext;
  protected config: ApiClientConfig;
  constructor(request: APIRequestContext, config: ApiClientConfig);
  login(credentials: Credentials): Promise<string>;
  reset(email: string): Promise<void>;
  post<T = unknown>(path: string, token: string, data: unknown): Promise<T>;
}

/** Extend a base test with per-worker isolation + auto teardown. */
export function makeAuthFixtures<TFixtures extends object, TWorker extends object>(
  base: TestType<TFixtures, TWorker>,
  config: E2EConfig,
): TestType<TFixtures & CoreFixtures, TWorker>;

export function seedSession(
  page: Page,
  sessionKey: string,
  user: Credentials,
): Promise<void>;
