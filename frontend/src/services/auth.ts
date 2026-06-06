import type { AuthResponse, AuthSession, AuthUser } from "../types/auth";
import { clearSession, getStoredSession, saveSession, writeStorage } from "../utils/authSession";
import { requestJson } from "../utils/requestJson";

export { clearSession, getAuthHeaders } from "../utils/authSession";
export type { AuthSession } from "../types/auth";

export async function login(input: {
  email: string;
  password: string;
  remember: boolean;
}) {
  const payload = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return saveSession({
    token: payload.token,
    user: payload.user,
    remember: input.remember,
  });
}

export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
}) {
  const payload = await requestJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return saveSession({
    token: payload.token,
    user: payload.user,
    remember: true,
  });
}

export async function restoreSession() {
  const session = getStoredSession();

  if (!session) {
    return null;
  }

  try {
    const payload = await requestJson<{ ok: true; user: AuthUser }>(
      "/api/auth/me",
      {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      },
    );

    const refreshedSession: AuthSession = {
      ...session,
      user: payload.user,
    };

    if (session.remember) {
      writeStorage(localStorage, refreshedSession);
    } else {
      writeStorage(sessionStorage, refreshedSession);
    }

    return refreshedSession;
  } catch {
    clearSession();
    return null;
  }
}

export async function requestPasswordReset(email: string) {
  return requestJson<{ ok: true; devCode?: string }>("/api/auth/forgot-password/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyPasswordResetCode(email: string, code: string) {
  return requestJson<{ ok: true }>("/api/auth/forgot-password/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(email: string, code: string, password: string) {
  return requestJson<{ ok: true }>("/api/auth/forgot-password/reset", {
    method: "POST",
    body: JSON.stringify({ email, code, password }),
  });
}
