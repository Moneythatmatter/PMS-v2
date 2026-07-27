import { api } from "@/services/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
};

export type LoginResult = {
  user: AuthUser;
  token: string;
};

const SESSION_KEY = "pms_session";
const TOKEN_KEY = "pms_token";

export function getSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(user: AuthUser | null, token?: string | null) {
  if (user && token) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthUser> {
  const result = await api.post<LoginResult>("/api/auth/login", {
    email,
    password,
  });
  setSession(result.user, result.token);
  return result.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = await api.get<AuthUser>("/api/auth/me");
    setSession(user, token);
    return user;
  } catch {
    setSession(null);
    return null;
  }
}

export function logoutSession() {
  setSession(null);
}
