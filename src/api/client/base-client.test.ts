/**
 * Tests for the shared request/pagination machinery in BaseClient, driven
 * through the public LogicMonitorClient surface.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LogicMonitorClient } from './index.js';
import { LogicMonitorApiError } from '../../utils/core/lm-error.js';

const originalFetch = global.fetch;

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  const { status = 200, headers = {} } = init;
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function makeClient(timeout?: number): LogicMonitorClient {
  return new LogicMonitorClient({
    company: 'test',
    bearerToken: 'secret-token',
    ...(timeout !== undefined ? { timeout } : {}),
  });
}

let fetchMock: jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  global.fetch = fetchMock;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function lastInit(): RequestInit {
  const calls = fetchMock.mock.calls;
  return calls[calls.length - 1][1] as RequestInit;
}

function lastUrl(): URL {
  const calls = fetchMock.mock.calls;
  return new URL(calls[calls.length - 1][0] as string);
}

describe('BaseClient.request', () => {
  it('sends auth, accept and version headers and returns parsed JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, name: 'device-1' }));

    const result = await makeClient().getDevice(1);

    expect(result).toEqual({ id: 1, name: 'device-1' });
    const headers = lastInit().headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer secret-token');
    expect(headers.Accept).toBe('application/json');
    expect(headers['X-Version']).toBe('3');
  });

  it('omits the Content-Type header when there is no body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    await makeClient().getDevice(1);
    const headers = lastInit().headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('serializes the body and sets Content-Type for write requests', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    await makeClient().createDevice({ name: 'new-device' });
    const init = lastInit();
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'new-device' }));
  });

  it('appends query params and skips null / undefined values', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    await makeClient().getDevice(1, { fields: 'id,name', skip: undefined, empty: null } as never);
    const url = lastUrl();
    expect(url.searchParams.get('fields')).toBe('id,name');
    expect(url.searchParams.has('skip')).toBe(false);
    expect(url.searchParams.has('empty')).toBe(false);
  });

  it('formats filters via cleanParams', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ total: 0, items: [] }));
    await makeClient().listResources({ filter: 'displayName:test' });
    expect(lastUrl().searchParams.get('filter')).toBe('displayName:"test"');
  });

  it('drops fields="*" so the API returns the default field set', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ total: 0, items: [] }));
    await makeClient().listResources({ fields: '*' });
    expect(lastUrl().searchParams.has('fields')).toBe(false);
  });

  it('throws a LogicMonitorApiError carrying API error details on non-2xx', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { errorMessage: 'Device not found', errorCode: 1404, errorDetail: 'no such id' },
        { status: 404 },
      ),
    );

    const error = await makeClient().getDevice(999).catch(e => e);
    expect(error).toBeInstanceOf(LogicMonitorApiError);
    expect(error).toMatchObject({
      status: 404,
      errorCode: 1404,
      errorMessage: 'Device not found',
      errorDetail: 'no such id',
    });
  });

  it('translates an aborted request into a timeout error', async () => {
    fetchMock.mockImplementation(async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    });
    await expect(makeClient(5000).getDevice(1)).rejects.toThrow(/Request timeout after 5000ms/);
  });

  it('re-throws non-abort network errors unchanged', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(makeClient().getDevice(1)).rejects.toThrow('ECONNREFUSED');
  });
});

describe('BaseClient.paginateAll', () => {
  it('fetches every page and concatenates items', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ total: 3, items: [{ id: 1 }, { id: 2 }] }))
      .mockResolvedValueOnce(jsonResponse({ total: 3, items: [{ id: 3 }] }));

    const result = await makeClient().listResources({ autoPaginate: true, size: 2 });

    expect(result.total).toBe(3);
    expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Second page advances the offset by the number of items already fetched.
    expect(new URL(fetchMock.mock.calls[1][0] as string).searchParams.get('offset')).toBe('2');
  });

  it('stops when a page returns no items', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 5, items: [] }));
    const result = await makeClient().listResources({ autoPaginate: true });
    expect(result.items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when a page is missing total/items', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }));
    await expect(makeClient().listResources({ autoPaginate: true })).rejects.toThrow(
      /missing total\/items/,
    );
  });
});

describe('BaseClient.requestMultipart', () => {
  it('uploads a multipart form via POST and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 200, imported: true }));

    const result = await makeClient().importDataSource('{"name":"x"}', 'json');

    expect(result).toEqual({ status: 200, imported: true });
    const init = lastInit();
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    // fetch sets the multipart boundary itself, so we must not pin Content-Type.
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('throws a LogicMonitorApiError when the upload is rejected', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ errorMessage: 'bad file' }, { status: 400 }),
    );
    await expect(makeClient().importDataSource('{}', 'json')).rejects.toMatchObject({
      status: 400,
      errorMessage: 'bad file',
    });
  });
});
