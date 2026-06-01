const DEFAULT_API_ORIGIN = "http://localhost:5050";

function getApiOrigin() {
  const raw = String(import.meta.env.VITE_API_URL || DEFAULT_API_ORIGIN).trim();
  return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiOrigin()}${normalizedPath}`;
}
