import jwt, { type JwtPayload } from "jsonwebtoken";
import getGoogleAuthToken from "./googleTokenProvider.js";

export default class AuthProvider {
  private readonly clientId: string;
  private token = "";

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async getAuthHeader(): Promise<{ Authorization: string }> {
    if (!this.hasValidToken()) {
      this.token = await getGoogleAuthToken(this.clientId);
    }

    return { Authorization: `Bearer ${this.token}` };
  }

  private hasValidToken(): boolean {
    if (this.token === "") {
      return false;
    }

    const decodedToken = jwt.decode(this.token, { json: true });

    if (!AuthProvider.isJwtPayload(decodedToken)) {
      return false;
    }

    return !AuthProvider.hasTokenExpired(decodedToken.exp ?? 0);
  }

  private static isJwtPayload(token: JwtPayload | string | null): token is JwtPayload {
    return token !== null && typeof token !== "string";
  }

  private static hasTokenExpired(expireTimestamp: number): boolean {
    return expireTimestamp < Math.floor(Date.now() / 1000);
  }
}
