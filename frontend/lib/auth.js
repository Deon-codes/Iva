/**
 * Firebase Auth error-code → human-readable message map.
 *
 * Import `getAuthErrorMessage` anywhere you catch a Firebase Auth error
 * and need a user-friendly string.
 */

const CODE_MAP = {
  // Sign-up
  "auth/email-already-in-use":
    "An account with this email already exists. Try signing in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",

  // Sign-in
  "auth/user-not-found": "No account found with this email. Please sign up first.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",

  // Google
  "auth/popup-closed-by-user":
    "Sign-in popup was closed. Try again when ready.",
  "auth/popup-blocked":
    "Popup was blocked by your browser. Allow popups for this site and try again.",
  "auth/cancelled-popup-request":
    "Sign-in was cancelled. Try again when ready.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",

  // Network
  "auth/network-request-failed":
    "Network error — please check your connection and try again.",


};

/**
 * Return a human-readable error message for a Firebase Auth error.
 * Falls back to a generic message for unknown codes.
 */
export function getAuthErrorMessage(error) {
  if (!error?.code) return "Something went wrong. Please try again.";
  return (
    CODE_MAP[error.code] ||
    `Authentication error (${error.code}). Please try again.`
  );
}

/**
 * Validate that the required Firebase config env vars are present.
 * Returns null if all good, or a descriptive error string.
 */
export function validateFirebaseConfig() {
  const required = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return `Missing Firebase environment variables: ${missing.join(", ")}. ` +
      "Add them to frontend/.env.local and restart the dev server.";
  }

  return null;
}
