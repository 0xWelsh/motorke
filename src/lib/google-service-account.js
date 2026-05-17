import { GoogleAuth } from "google-auth-library";

export function parseGoogleServiceAccount(envKey = "GOOGLE_SERVICE_ACCOUNT_JSON") {
  const raw =
    process.env[envKey]?.trim() ||
    (envKey !== "GOOGLE_SERVICE_ACCOUNT_JSON"
      ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
      : null);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn(`[google] ${envKey} is not valid JSON`);
    return null;
  }
}

export async function getGoogleAuthClient(scopes, envKey) {
  const credentials = parseGoogleServiceAccount(envKey);
  if (!credentials) return null;
  const auth = new GoogleAuth({ credentials, scopes });
  return auth.getClient();
}
