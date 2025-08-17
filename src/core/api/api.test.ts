/**
 * @jest-environment node
 */
import { apiClient } from '@/core/api';

describe('ApiClient request', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns parsed JSON when T is an object', async () => {
    const data = { foo: 'bar' };
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await apiClient.request<typeof data>('/test');
    expect(result).toEqual(data);
  });

  it('returns text when T is string', async () => {
    const text = 'plain text';
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(text, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    const result = await apiClient.request<string>('/test');
    expect(result).toBe(text);
  });
});
