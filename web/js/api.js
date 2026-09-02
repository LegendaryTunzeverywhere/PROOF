/** API client — the only module that talks to the server. */
export class ApiError extends Error {
  constructor(payload, status) {
    super(payload?.error?.message || 'Something went wrong.');
    this.code = payload?.error?.code || 'ERROR';
    this.status = status;
    this.retryInMs = payload?.error?.retryInMs;
  }
}

async function call(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new ApiError(data, res.status);
  return data;
}

export const api = {
  get: (p) => call('GET', p),
  post: (p, b = {}) => call('POST', p, b),
  patch: (p, b = {}) => call('PATCH', p, b),
  del: (p) => call('DELETE', p),
};
