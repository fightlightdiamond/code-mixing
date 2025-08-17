/**
 * @jest-environment node
 */

import { apiClient } from "@/core/api/api";

describe("apiClient FormData submission", () => {
  it("submits FormData without setting Content-Type", async () => {
    const fd = new FormData();
    fd.append("field", "value");

    const fetchMock = jest.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const originalFetch = global.fetch;
    // @ts-ignore override for test
    global.fetch = fetchMock;

    const result = await apiClient.request("/test", { method: "POST", body: fd });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, options] = fetchMock.mock.calls[1];
    const headers = options?.headers as Headers;
    expect(headers.get("Content-Type")).toBeNull();

    // restore original fetch
    global.fetch = originalFetch;
  });
});
