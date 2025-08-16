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

  it("submits FormData without overriding Content-Type", async () => {
    const fd = new FormData();
    fd.append("foo", "bar");
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: "123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    global.fetch = fetchMock;

    await apiClient.request("/upload", {
      method: "POST",
      body: fd,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const headers = fetchMock.mock.calls[1][1]?.headers as Headers;
    expect(headers).toBeInstanceOf(Headers);
    expect(headers.has("Content-Type")).toBe(false);
  });
});
