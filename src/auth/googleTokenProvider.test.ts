const googleAuthMocks = vi.hoisted(() => ({
  GoogleAuth: vi.fn(),
  getIdTokenClient: vi.fn(),
  fetchIdToken: vi.fn(),
}));

vi.mock("google-auth-library", () => {
  googleAuthMocks.GoogleAuth.mockImplementation(function MockGoogleAuth() {
    return {
      getIdTokenClient: googleAuthMocks.getIdTokenClient,
    };
  });

  return { GoogleAuth: googleAuthMocks.GoogleAuth };
});

import { AuthenticationError } from "../errors.js";

import { getGoogleAuthToken } from "./googleTokenProvider.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("getGoogleAuthToken", () => {
  it("returns the fetched Google ID token", async () => {
    googleAuthMocks.getIdTokenClient.mockResolvedValue({
      idTokenProvider: {
        fetchIdToken: googleAuthMocks.fetchIdToken,
      },
    });
    googleAuthMocks.fetchIdToken.mockResolvedValue("test-id-token");

    await expect(getGoogleAuthToken("target-audience")).resolves.toBe("test-id-token");

    expect(googleAuthMocks.GoogleAuth).toHaveBeenCalledTimes(1);
    expect(googleAuthMocks.getIdTokenClient).toHaveBeenCalledWith("target-audience");
    expect(googleAuthMocks.fetchIdToken).toHaveBeenCalledWith("target-audience");
  });

  it("wraps Google auth failures in AuthenticationError", async () => {
    const rootError = new Error("credentials missing");

    googleAuthMocks.getIdTokenClient.mockRejectedValue(rootError);
    const tokenPromise = getGoogleAuthToken("target-audience");

    await expect(tokenPromise).rejects.toMatchObject({
      message: "Could not get the Google auth token credentials",
      originalError: rootError,
    });
    await expect(tokenPromise).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("leaves originalError undefined for non-Error failures", async () => {
    googleAuthMocks.getIdTokenClient.mockRejectedValue("credentials missing");

    await expect(getGoogleAuthToken("target-audience")).rejects.toMatchObject({
      message: "Could not get the Google auth token credentials",
      originalError: undefined,
    });
  });
});
