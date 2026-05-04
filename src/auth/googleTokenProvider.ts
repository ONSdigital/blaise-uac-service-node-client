import { GoogleAuth } from "google-auth-library";
import { AuthenticationError } from "../errors.js";

export default async function getGoogleAuthToken(targetAudience: string): Promise<string> {
  const auth = new GoogleAuth();

  try {
    const { idTokenProvider } = await auth.getIdTokenClient(targetAudience);

    return await idTokenProvider.fetchIdToken(targetAudience);
  } catch (error) {
    throw new AuthenticationError(
      "Could not get the Google auth token credentials",
      error instanceof Error ? error : undefined,
    );
  }
}
