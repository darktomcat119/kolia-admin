import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  // getSession() may return an expired token from local storage.
  // Check expiry and refresh if needed.
  const { data } = await supabase.auth.getSession();
  let token = data.session?.access_token;

  if (data.session?.expires_at) {
    const expiresAt = data.session.expires_at * 1000; // convert to ms
    const now = Date.now();
    // Refresh if token expires within 60 seconds
    if (expiresAt - now < 60_000) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      token = refreshed.session?.access_token ?? token;
    }
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ApiEnvelope = { error?: string; data?: unknown };

async function readApiJson(response: Response): Promise<ApiEnvelope> {
  const text = await response.text();
  if (!text.trim()) {
    if (response.status === 405) {
      throw new Error(
        '405 Method Not Allowed (empty body). Set VITE_API_URL in Vercel to your Railway API base URL (https://….up.railway.app), not the admin site URL, then redeploy.',
      );
    }
    throw new Error(response.statusText || `Request failed (${response.status})`);
  }
  try {
    return JSON.parse(text) as ApiEnvelope;
  } catch {
    throw new Error(`Invalid response (${response.status}): ${text.slice(0, 160)}`);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  const json = await readApiJson(response);

  if (!response.ok) {
    throw new Error(json.error || 'Request failed');
  }

  return json.data as T;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });
  const json = await readApiJson(response);
  if (!response.ok) {
    throw new Error(json.error || 'Upload failed');
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
  uploadRestaurantImage: (file: File, type: 'cover' | 'logo' | 'gallery') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return uploadRequest<{ url: string }>('/api/admin/upload/restaurant-image', formData);
  },
  uploadMenuItemImage: (file: File, restaurantId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('restaurant_id', restaurantId);
    return uploadRequest<{ url: string }>('/api/admin/upload/menu-item-image', formData);
  },
};
