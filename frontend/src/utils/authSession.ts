import type { AuthSession, SessionPayload } from "../types/auth";

const STORAGE_KEY = "petcare.session";

function readStorage(storage: Storage): AuthSession | null {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function writeStorage(storage: Storage, session: AuthSession) {
  storage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function saveSession(payload: SessionPayload) {
  const session: AuthSession = {
    token: payload.token,
    user: payload.user,
    remember: payload.remember,
  };

  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);

  if (payload.remember) {
    writeStorage(localStorage, session);
  } else {
    writeStorage(sessionStorage, session);
  }

  return session;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getStoredSession(): AuthSession | null {
  return readStorage(localStorage) ?? readStorage(sessionStorage);
}

export function getAuthHeaders() {
  const session = getStoredSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.token}` };
}
