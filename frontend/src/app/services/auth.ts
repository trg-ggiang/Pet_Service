export type UserRole = "admin" | "doctor" | "staff" | "customer";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
  status: string;
  fullName: string;
  customerId?: number | null;
  doctorId?: number | null;
  staffId?: number | null;
  phone?: string | null;
  address?: string | null;
  roomName?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  remember: boolean;
};

type AuthResponse = {
  ok: true;
  token: string;
  user: AuthUser;
};

type SessionPayload = {
  token: string;
  user: AuthUser;
  remember: boolean;
};

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

function writeStorage(storage: Storage, session: AuthSession) {
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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return payload as T;
}

export async function login(input: { email: string; password: string; remember: boolean }) {
  const payload = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return saveSession({ token: payload.token, user: payload.user, remember: input.remember });
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

  return saveSession({ token: payload.token, user: payload.user, remember: true });
}

export async function restoreSession() {
  const session = getStoredSession();

  if (!session) {
    return null;
  }

  try {
    const payload = await requestJson<{ ok: true; user: AuthUser }>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

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