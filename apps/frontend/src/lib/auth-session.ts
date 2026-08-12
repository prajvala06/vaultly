export type AuthSessionUser = {
  name: string;
  email: string;
};

const AUTH_SESSION_KEY = 'vaultly.auth.session';

export function saveAuthSession(user: AuthSessionUser): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
}

export function readAuthSession(): AuthSessionUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const rawValue: string | null = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!rawValue) {
    return null;
  }
  try {
    return JSON.parse(rawValue) as AuthSessionUser;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function forceClientLogout(redirectPath = '/'): void {
  clearAuthSession();
  if (typeof window === 'undefined') {
    return;
  }
  const currentPath: string = window.location.pathname;
  if (currentPath === redirectPath || currentPath === '/login' || currentPath === '/register') {
    return;
  }
  window.location.assign(redirectPath);
}

export function getDisplayFirstName(user: AuthSessionUser | null): string {
  const fullName: string = user?.name.trim() ?? '';
  if (fullName.length > 0) {
    return fullName.split(/\s+/)[0] ?? fullName;
  }
  const emailLocalPart: string = user?.email.split('@')[0]?.trim() ?? '';
  if (emailLocalPart.length > 0) {
    return emailLocalPart;
  }
  return 'there';
}

export function getUserInitials(user: AuthSessionUser | null): string {
  const fullName: string = user?.name.trim() ?? '';
  if (fullName.length > 0) {
    const parts: string[] = fullName.split(/\s+/).filter((part) => part.length > 0);
    if (parts.length >= 2) {
      const first: string = parts[0]?.[0] ?? '';
      const last: string = parts[parts.length - 1]?.[0] ?? '';
      return `${first}${last}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  const emailLocalPart: string = user?.email.split('@')[0]?.trim() ?? '';
  if (emailLocalPart.length > 0) {
    return emailLocalPart.slice(0, 2).toUpperCase();
  }
  return 'VL';
}
