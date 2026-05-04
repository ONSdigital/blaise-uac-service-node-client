import AuthProvider from "./authProvider.js";
import jwt from "jsonwebtoken";
import { type Mock } from "vitest";
import { AuthenticationError } from "../errors.js";

vi.mock("./googleTokenProvider.js");
import getGoogleAuthToken from "./googleTokenProvider.js";

const mockedGetGoogleAuthToken = getGoogleAuthToken as Mock<() => Promise<string>>;

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
  mockedGetGoogleAuthToken.mockClear();
  vi.clearAllMocks();
  vi.resetAllMocks();
});

it("returns auth headers with a token", async () => {
  const uniqueToken = "A Token";

  mockAuthToken(uniqueToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  const authHeader = await authProvider.getAuthHeader();

  expect(authHeader).toEqual({ Authorization: `Bearer ${uniqueToken}` });
  expect(mockedGetGoogleAuthToken).toBeCalledWith("DDS_CLIENT_ID");
});

it("requests a new token when the cached token has expired", async () => {
  const expiredToken = jwt.sign({ foo: "bar", exp: Math.floor(Date.now() / 1000) - 30 }, "shhhhh");

  mockAuthToken(expiredToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthHeader();

  expect(authHeader).toEqual({ Authorization: `Bearer ${updatedToken}` });
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});

it("reuses the cached token when it has not expired", async () => {
  const validToken = jwt.sign(
    { foo: "bar", exp: Math.floor(Date.now() / 1000) + 60 * 60 },
    "shhhhh",
  );

  mockAuthToken(validToken);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthHeader();

  expect(authHeader).toEqual({ Authorization: `Bearer ${validToken}` });
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(1);
});

it("requests a new token when the cached token is invalid", async () => {
  mockAuthToken("%%%%%");
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthHeader();

  expect(authHeader).toEqual({ Authorization: `Bearer ${updatedToken}` });
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});

it("throws AuthenticationError when token fetch fails", async () => {
  const authError = new AuthenticationError("Auth failed");

  mockAuthTokenError(authError);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await expect(authProvider.getAuthHeader()).rejects.toThrow(AuthenticationError);
});

it("requests a new token when the cached token has no expiry", async () => {
  const tokenWithoutExpiry = jwt.sign({ foo: "bar" }, "shhhhh", { noTimestamp: true });

  mockAuthToken(tokenWithoutExpiry);
  const authProvider = new AuthProvider("DDS_CLIENT_ID");

  await authProvider.getAuthHeader();

  const updatedToken = "SecondaryTokenCalled";

  mockAuthToken(updatedToken);

  const authHeader = await authProvider.getAuthHeader();

  expect(authHeader).toEqual({ Authorization: `Bearer ${updatedToken}` });
  expect(mockedGetGoogleAuthToken).toHaveBeenCalledTimes(2);
});
