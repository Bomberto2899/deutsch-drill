async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
};

/** Calls `onReload` whenever a file in the config dir changes. */
export function subscribeToReloads(onReload: () => void): () => void {
  const es = new EventSource('/api/events');
  es.onmessage = (e) => {
    if (e.data === 'reload') onReload();
  };
  return () => es.close();
}
