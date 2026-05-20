import { getGoogleAuthToken } from "./googleTokenProvider.js";

const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

interface TokenPayload {
  exp?: number;
}

export interface AuthorizationHeaderProvider {
  getAuthorizationHeader(): Promise<string>;
}

export class AuthProvider implements AuthorizationHeaderProvider {
  private readonly targetAudience: string;
  private token?: string;
  private tokenRefreshPromise?: Promise<string>;

  constructor(targetAudience: string) {
    this.targetAudience = targetAudience;
  }

  async getAuthorizationHeader(): Promise<string> {
    const token = await this.getToken();

    return `Bearer ${token}`;
  }

  private hasValidToken(token: string): boolean {
    const decodedToken = AuthProvider.decodeTokenPayload(token);

    if (decodedToken === undefined) {
      return false;
    }

    return !AuthProvider.hasTokenExpired(decodedToken.exp);
  }

  private static isTokenPayload(value: unknown): value is TokenPayload {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const record = value as Record<string, unknown>;

    return !Object.hasOwn(record, "exp") || typeof record["exp"] === "number";
  }

  private static decodeTokenPayload(token: string): TokenPayload | undefined {
    const tokenSegments = token.split(".");

    if (tokenSegments.length < 2) {
      return undefined;
    }

    try {
      const payload = JSON.parse(Buffer.from(tokenSegments[1], "base64url").toString("utf8"));

      return AuthProvider.isTokenPayload(payload) ? payload : undefined;
    } catch {
      return undefined;
    }
  }

  private static hasTokenExpired(expireTimestamp?: number): boolean {
    if (expireTimestamp === undefined) {
      return true;
    }

    return expireTimestamp <= Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_BUFFER_SECONDS;
  }

  private async getToken(): Promise<string> {
    const token = this.token;

    if (token !== undefined && this.hasValidToken(token)) {
      return token;
    }

    // Deduplicate concurrent refresh calls: reuse the in-flight promise so that
    // multiple callers waiting on an expired token share a single fetch.
    if (this.tokenRefreshPromise === undefined) {
      this.tokenRefreshPromise = this.refreshToken();
    }

    return this.tokenRefreshPromise;
  }

  private async refreshToken(): Promise<string> {
    try {
      const token = await getGoogleAuthToken(this.targetAudience);

      this.token = token;

      return token;
    } finally {
      this.tokenRefreshPromise = undefined;
    }
  }
}
