/**
 * @jest-environment node
 */

import { apiClient } from "@/core/api/api";

describe("ApiClient.request", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns parsed JSON for object type", async () => {
    const data = { foo: "bar" };
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await apiClient.request<typeof data>("/test");
    expect(result).toEqual(data);
  });

  it("returns text for string type", async () => {
    const text = "hello";
    global.fetch = jest.fn().mockResolvedValue(
      new Response(text, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    );

    const result = await apiClient.request<string>("/test");
    expect(result).toBe(text);
  });

  it("aborts when timeout is exceeded", async () => {
    const fetchMock = jest.fn(
      (_: RequestInfo, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const timer = setTimeout(() => resolve(new Response("ok")), 50);
          init?.signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
          });
        })
    );
    global.fetch = fetchMock;

    await expect(
      apiClient.request("/timeout", { timeout: 10, retries: 2 })
    ).rejects.toThrow("Aborted");
  });

  it("retries on 500 responses", async () => {
    const responses = [
      new Response("err", { status: 500 }),
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ];
    global.fetch = jest
      .fn()
      .mockImplementation(() => Promise.resolve(responses.shift()!));

    const result = await apiClient.request<{ ok: boolean }>("/test", { retries: 1 });
    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
