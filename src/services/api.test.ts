import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchApi, setApiTokenProvider } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  setApiTokenProvider(null);
  vi.unstubAllGlobals();
});

describe('fetchApi: token segar dan retry 401', () => {
  it('memakai token dari provider, bukan token lama yang diberikan pemanggil', async () => {
    const headers: Array<Headers> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        headers.push(new Headers(init?.headers));
        return jsonResponse({ data: [] });
      })
    );
    setApiTokenProvider(async () => 'token-baru');

    await fetchApi('/me', {}, 'token-lama');

    expect(headers[0].get('Authorization')).toBe('Bearer token-baru');
  });

  it('mengulang tepat sekali dengan token baru setelah 401', async () => {
    let calls = 0;
    const sent: Array<string | null> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        sent.push(new Headers(init?.headers).get('Authorization'));
        calls += 1;
        return calls === 1
          ? jsonResponse({ error: { code: 'TOKEN_EXPIRED', message: 'kedaluwarsa' } }, 401)
          : jsonResponse({ data: { ok: true } });
      })
    );
    setApiTokenProvider(async () => (calls === 0 ? 'token-lama' : 'token-baru'));

    const result = await fetchApi<{ data: { ok: boolean } }>('/me');

    expect(sent).toEqual(['Bearer token-lama', 'Bearer token-baru']);
    expect(result.data.ok).toBe(true);
  });

  it('meneruskan error.code server saat tetap gagal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: { code: 'TOKEN_EXPIRED', message: 'Sesi kedaluwarsa' } }, 401)
      )
    );

    await expect(fetchApi('/me')).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
      status: 401,
    });
  });
});
