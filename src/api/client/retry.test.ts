/**
 * Tests for the 429 retry / backoff behavior wired into the core request path.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LogicMonitorClient } from './index.js';

const originalFetch = global.fetch;

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  const { status = 200, headers = {} } = init;
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function makeClient(maxRetries?: number): LogicMonitorClient {
  return new LogicMonitorClient({
    company: 'test',
    bearerToken: 'token',
    ...(maxRetries !== undefined ? { maxRetries } : {}),
  });
}

describe('Client 429 retry / backoff', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('retries after a 429 and returns the eventual success', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ errmsg: 'rate limited' }, { status: 429, headers: { 'retry-after': '0' } }))
      .mockResolvedValueOnce(jsonResponse({ id: 42, name: 'device-42' }));

    const client = makeClient(3);
    const result = await client.getDevice(42);

    expect(result).toEqual({ id: 42, name: 'device-42' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting maxRetries and throws', async () => {
    // A fresh Response per call: a body can only be consumed once.
    fetchMock.mockImplementation(async () =>
      jsonResponse({ errmsg: 'rate limited' }, { status: 429, headers: { 'retry-after': '0' } }),
    );

    const client = makeClient(2);
    await expect(client.getDevice(7)).rejects.toMatchObject({ status: 429 });

    // 1 initial attempt + 2 retries
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry when maxRetries is 0', async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse({ errmsg: 'rate limited' }, { status: 429, headers: { 'retry-after': '0' } }),
    );

    const client = makeClient(0);
    await expect(client.getDevice(7)).rejects.toMatchObject({ status: 429 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry on non-429 errors', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ errmsg: 'not found' }, { status: 404 }));

    const client = makeClient(3);
    await expect(client.getDevice(7)).rejects.toMatchObject({ status: 404 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
