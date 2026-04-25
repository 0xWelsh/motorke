import { OAuth2Client } from "google-auth-library";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const client = googleClientId ? new OAuth2Client(googleClientId) : null;

/**
 * Verifies a Google ID token and returns the user payload.
 * @param {string} token - The ID token from the frontend.
 * @returns {Promise<Object>} - The verified payload (email, name, sub).
 */
export async function verifyGoogleToken(token) {
  try {
    if (!client || !googleClientId) {
      return null;
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}
