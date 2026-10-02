// Cliente mínimo de la API REST. El token vive en localStorage para sobrevivir recargas.
const TOKEN_KEY = 'hl_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t: string | null) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* modo privado */ }
};

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalle = Array.isArray(json.details) ? json.details.map((d: { message: string }) => d.message).join('. ') : '';
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('hl:logout'));
    }
    throw new ApiError(detalle || json.message || `Error ${res.status}`, res.status);
  }
  return json.data as T;
}

export const get = <T,>(path: string) => api<T>('GET', path);
export const post = <T,>(path: string, body?: unknown) => api<T>('POST', path, body);
export const put = <T,>(path: string, body?: unknown) => api<T>('PUT', path, body);
export const patch = <T,>(path: string, body?: unknown) => api<T>('PATCH', path, body);
export const del = <T,>(path: string) => api<T>('DELETE', path);

/** Descarga un archivo autenticado (p. ej. el CSV de reportes). */
export async function descargar(path: string, nombre: string) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new ApiError('No se pudo descargar el archivo', res.status);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(await res.blob());
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const qs = (params: Record<string, string | number | undefined | null>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') s.set(k, String(v)); });
  const str = s.toString();
  return str ? `?${str}` : '';
};
