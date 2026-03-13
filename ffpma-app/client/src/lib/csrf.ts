const originalFetch = window.fetch.bind(window);

let _csrfToken: string | null = null;
let _fetchingToken: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await originalFetch('/api/csrf-token', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      _csrfToken = data.csrfToken;
      return _csrfToken!;
    }
  } catch { /* ignore */ }
  return '';
}

export function clearCsrfToken() {
  _csrfToken = null;
}

export async function getCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  if (!_fetchingToken) {
    _fetchingToken = fetchCsrfToken().finally(() => { _fetchingToken = null; });
  }
  return _fetchingToken;
}

function isSameOrigin(input: RequestInfo | URL): boolean {
  try {
    const url = typeof input === 'string' ? new URL(input, window.location.origin) : input instanceof URL ? input : new URL(input.url, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return true;
  }
}

window.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (isStateChanging && isSameOrigin(input)) {
    const token = await getCsrfToken();
    if (token) {
      const headers = new Headers(init?.headers);
      if (!headers.has('x-csrf-token')) {
        headers.set('x-csrf-token', token);
      }
      init = { ...init, headers };
    }
  }

  return originalFetch(input, init);
};
