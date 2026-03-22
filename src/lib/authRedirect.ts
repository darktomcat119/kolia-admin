/**
 * URLs passed to Supabase must match Redirect URLs in the Supabase dashboard.
 * Otherwise Supabase uses "Site URL" (often localhost:3000).
 */

const DEFAULT_ORIGIN = 'https://kolia-admin.vercel.app';

function getOrigin(): string {
  const explicit = import.meta.env.VITE_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = import.meta.env.VITE_VERCEL_ORIGIN?.trim();
  if (vercel) return vercel.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }

  return DEFAULT_ORIGIN;
}

function pathWithBase(suffix: string): string {
  const rawBase = import.meta.env.BASE_URL || '/';
  const basePath =
    rawBase === '/' ? '' : rawBase.replace(/^\/+|\/+$/g, '');
  const seg = suffix.replace(/^\//, '');
  return basePath ? `/${basePath}/${seg}` : `/${seg}`;
}

export function getAuthConfirmRedirectUrl(): string {
  return `${getOrigin()}${pathWithBase('auth/confirm')}`;
}

export function getPasswordResetRedirectUrl(): string {
  return `${getOrigin()}${pathWithBase('reset-password')}`;
}
