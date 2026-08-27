import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LogicMonitorClient } from './client.js';

describe('LogicMonitorClient pagination and sort defaults', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = jest.fn<typeof fetch>();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function jsonResponse(body: unknown) {
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => body,
    } as Response;
  }

  function newClient() {
    return new LogicMonitorClient({ company: 'acme', bearerToken: 'test-token' });
  }

  it('does not stop after one page when LM reports a bogus negative total', async () => {
    // Reproduces the real-world bug: LM's /alert/alerts endpoint returned
    // total: -1001 while genuinely holding more than 1000 open alerts.
    const page1Items = Array.from({ length: 1000 }, (_, i) => ({ id: `page1-${i}` }));
    const page2Items = Array.from({ length: 1000 }, (_, i) => ({ id: `page2-${i}` }));
    const page3Items = Array.from({ length: 200 }, (_, i) => ({ id: `page3-${i}` })); // short page => last page

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ total: -1001, items: page1Items }))
      .mockResolvedValueOnce(jsonResponse({ total: -1001, items: page2Items }))
      .mockResolvedValueOnce(jsonResponse({ total: -1001, items: page3Items }));

    const client = newClient();
    const result = await client.listAlerts({ autoPaginate: true });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.items).toHaveLength(2200);
  });

  it('stops pagination once a genuinely non-negative total is reached', async () => {
    const page1Items = Array.from({ length: 1000 }, (_, i) => ({ id: `page1-${i}` }));
    const page2Items = Array.from({ length: 500 }, (_, i) => ({ id: `page2-${i}` }));

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ total: 1500, items: page1Items }))
      .mockResolvedValueOnce(jsonResponse({ total: 1500, items: page2Items }));

    const client = newClient();
    const result = await client.listAlerts({ autoPaginate: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.items).toHaveLength(1500);
  });

  it('stops immediately on an empty page regardless of the reported total', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: -1, items: [] }));

    const client = newClient();
    const result = await client.listAlerts({ autoPaginate: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(0);
  });

  it('defaults list_alerts requests to newest-first (sort=-startEpoch)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 1, items: [{ id: '1' }] }));

    const client = newClient();
    await client.listAlerts({});

    const requestedUrl = new URL((fetchMock.mock.calls[0] as any[])[0] as string);
    expect(requestedUrl.searchParams.get('sort')).toBe('-startEpoch');
  });

  it('lets an explicit sort override the newest-first default', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 1, items: [{ id: '1' }] }));

    const client = newClient();
    await client.listAlerts({ sort: 'id' } as any);

    const requestedUrl = new URL((fetchMock.mock.calls[0] as any[])[0] as string);
    expect(requestedUrl.searchParams.get('sort')).toBe('id');
  });
});
