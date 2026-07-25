export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
};

type StoredUser = AuthUser & {
  password: string;
};

const USERS_KEY = "pms_users";
const SESSION_KEY = "pms_session";

const DEFAULT_ADMIN: StoredUser = {
  id: "U-ADMIN",
  name: "Admin",
  email: "admin@gmail.com",
  password: "123456",
  role: "Admin",
  initials: "AD",
};

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [DEFAULT_ADMIN];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
      return [DEFAULT_ADMIN];
    }
    const parsed = JSON.parse(raw) as StoredUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
      return [DEFAULT_ADMIN];
    }
    const hasAdmin = parsed.some(
      (u) => u.email.toLowerCase() === DEFAULT_ADMIN.email,
    );
    if (!hasAdmin) {
      const next = [DEFAULT_ADMIN, ...parsed];
      localStorage.setItem(USERS_KEY, JSON.stringify(next));
      return next;
    }
    return parsed;
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }
}

function toPublic(user: StoredUser): AuthUser {
  const { password: _password, ...rest } = user;
  return rest;
}

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

export function setSessionUser(user: AuthUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function loginWithEmailPassword(
  email: string,
  password: string,
): AuthUser {
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  const match = users.find((u) => u.email.toLowerCase() === normalized);
  if (!match || match.password !== password) {
    throw new Error("Invalid email or password");
  }
  const publicUser = toPublic(match);
  setSessionUser(publicUser);
  return publicUser;
}

export function logoutSession() {
  setSessionUser(null);
}

export { DEFAULT_ADMIN };
