import {GoogleAuth} from "google-auth-library";

export default async function getGoogleAuthToken(targetAudience: string): Promise<string> {
    const auth = new GoogleAuth();
    console.log("Client id", targetAudience);
    try {
        const {idTokenProvider} = await auth.getIdTokenClient(targetAudience);
        return await idTokenProvider.fetchIdToken(targetAudience);
    } catch (error) {
        console.error("Could not get the Google auth token credentials", error);
        return "";
    }
}
