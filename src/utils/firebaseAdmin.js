const admin = require("firebase-admin");

function normalizeServiceAccountJson(rawCredentials) {
  let normalized = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < rawCredentials.length; index += 1) {
    const char = rawCredentials[index];

    if (escaped) {
      normalized += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      normalized += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      normalized += char;
      inString = !inString;
      continue;
    }

    if (inString && char === "\r") {
      continue;
    }

    if (inString && char === "\n") {
      normalized += "\\n";
      continue;
    }

    normalized += char;
  }

  return normalized;
}

function parseServiceAccountCredentials(rawCredentials) {
  try {
    return JSON.parse(rawCredentials);
  } catch (_err) {
    return JSON.parse(normalizeServiceAccountJson(rawCredentials));
  }
}

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) {
    return null;
  }

  try {
    const credentials = parseServiceAccountCredentials(rawCredentials);
    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
    return admin;
  } catch (err) {
    console.error("Firebase admin init failed:", err);
    return null;
  }
}

module.exports = getFirebaseAdmin;