import jwt from "jsonwebtoken";
import getGoogleAuthToken from "./google-token-provider";

export default class AuthProvider {
    private readonly CLIENT_ID: string;
    private token: string;

    constructor(CLIENT_ID: string) {
        this.CLIENT_ID = CLIENT_ID;
        this.token = "";
    }

    async getAuthHeader(): Promise<{ Authorization: string }> {
        if (!this.isValidToken()) {
            this.token = await getGoogleAuthToken(this.CLIENT_ID);
        }
        return {Authorization: `Bearer ${this.token}`};
    }

    private isValidToken(): boolean {
        if (this.token === "") {
            return false;
        }
        const decodedToken = jwt.decode(this.token, {json: true});
        if (decodedToken === null) {
            console.log("Failed to decode token, Calling for new Google auth Token");
            return false;
        } else if (AuthProvider.hasTokenExpired(decodedToken["exp"] || 0)) {
            console.log("Auth Token Expired, Calling for new Google auth Token");

            return false;
        }

        return true;
    }

    private static hasTokenExpired(expireTimestamp: number): boolean {
        return expireTimestamp < Math.floor(new Date().getTime() / 1000);
    }
}