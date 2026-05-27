import { AuthenticationError } from "../errors.js";

import { AuthProvider } from "./authProvider.js";
import { getGoogleAuthToken } from "./googleTokenProvider.js";

vi.mock("./googleTokenProvider.js");

const mockedGetGoogleAuthToken = vi.mocked(getGoogleAuthToken);

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

function createToken(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }), "utf8").toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return `${header}.${body}.`;
}

function mockAuthToken(token: string) {
  mockedGetGoogleAuthToken.mockImplementationOnce(() => {
    return Promise.resolve(token);
  });
}

function mockAuthTokenError(error: Error) {
  mockedGetGoogleAuthToken.mockImplementationOnce(() => {
    return Promise.reject(error);
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

it("returns an authorization header string with a token", async () => {
  const uniqueToken = "A Token";

  mockAuthToken(uniqueToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${uniqueToken}`);
  expect(mockedGetGoogleAuthToken).toBeCalledWith("DDS_CLIENT_ID");
});

it("requests a new token when the cached token has expired", async () => {
  const expiredToken = createToken({ foo: "bar", exp: Math.floor(Date.now() / 1000) - 30 });

  mockAuthToken(expiredToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthorizationHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${updatedToken}`);
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});

it("reuses the cached token when it has not expired", async () => {
  const validToken = createToken({ foo: "bar", exp: Math.floor(Date.now() / 1000) + 60 * 60 });

  mockAuthToken(validToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthorizationHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${validToken}`);
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(1);
});

it("requests a new token when the cached token is close to expiry", async () => {
  const nearExpiryToken = createToken({ foo: "bar", exp: Math.floor(Date.now() / 1000) + 30 });

  mockAuthToken(nearExpiryToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthorizationHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${updatedToken}`);
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});

it("requests a new token when the cached token is invalid", async () => {
  mockAuthToken("%%%%%");
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthorizationHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${updatedToken}`);
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});

it("reuses a single in-flight token request across concurrent callers", async () => {
  const deferredToken = createDeferredPromise<string>();

  mockedGetGoogleAuthToken.mockReturnValueOnce(deferredToken.promise);

  const authProvider = new AuthProvider("DDS_CLIENT_ID");
  const firstHeaderPromise = authProvider.getAuthorizationHeader();
  const secondHeaderPromise = authProvider.getAuthorizationHeader();

  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(1);

  deferredToken.resolve("SharedToken");

  await expect(Promise.all([firstHeaderPromise, secondHeaderPromise])).resolves.toEqual([
    "Bearer SharedToken",
    "Bearer SharedToken",
  ]);
});

it("throws AuthenticationError when token fetch fails", async () => {
  const authError = new AuthenticationError("Auth failed");

  mockAuthTokenError(authError);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await expect(authProvider.getAuthorizationHeader()).rejects.toThrow(AuthenticationError);
});

it("requests a new token when the cached token has no expiry", async () => {
  const tokenWithoutExpiry = createToken({ foo: "bar" });

  mockAuthToken(tokenWithoutExpiry);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthorizationHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${updatedToken}`);
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});

it("requests a new token when the cached token payload is a non-object JSON value", async () => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }), "utf8").toString(
    "base64url",
  );
  const payload = Buffer.from(JSON.stringify(["not", "an", "object"]), "utf8").toString(
    "base64url",
  );
  const arrayPayloadToken = `${header}.${payload}.`;

  mockAuthToken(arrayPayloadToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthorizationHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${updatedToken}`);
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});

it("requests a new token when the cached token payload cannot be JSON-parsed", async () => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }), "utf8").toString(
    "base64url",
  );
  const payload = Buffer.from("{invalid json", "utf8").toString("base64url");
  const malformedToken = `${header}.${payload}.`;

  mockAuthToken(malformedToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthorizationHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthorizationHeader();

  expect(authHeader).toBe(`Bearer ${updatedToken}`);
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});
