import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";

describe("ApiClient - Deduplication & Stale Request Cancellation", () => {
  beforeEach(() => {
    apiClient.clear();
    vi.restoreAllMocks();
  });

  it("deduplicates concurrent identical in-flight requests", async () => {
    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        ok: true,
        status: 200,
        json: async () => ({ ideas: ["theme1", "theme2"] }),
      } as Response;
    });

    const promise1 = apiClient.request<{ ideas: string[] }>("/api/ideas", {
      method: "POST",
      dedupeKey: "ideas-wedding-1",
    });

    const promise2 = apiClient.request<{ ideas: string[] }>("/api/ideas", {
      method: "POST",
      dedupeKey: "ideas-wedding-1",
    });

    const [res1, res2] = await Promise.all([promise1, promise2]);

    expect(callCount).toBe(1); // Single network request made
    expect(res1).toEqual(res2);
    expect(res1.ideas).toEqual(["theme1", "theme2"]);
  });

  it("cancels stale in-flight request when cancelPrevious is set to true", async () => {
    let abortedCallCount = 0;
    let completedCallCount = 0;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const signal = init?.signal;
      return new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => {
          completedCallCount++;
          resolve({
            ok: true,
            status: 200,
            json: async () => ({ version: "v2" }),
          } as Response);
        }, 100);

        if (signal) {
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            abortedCallCount++;
            reject(new DOMException("The user aborted a request.", "AbortError"));
          });
        }
      });
    });

    const promise1 = apiClient.request("/api/events/plan", {
      method: "POST",
      dedupeKey: "wizard-plan",
      cancelPrevious: true,
    });

    // Fire second request with cancelPrevious: true
    const promise2 = apiClient.request("/api/events/plan", {
      method: "POST",
      dedupeKey: "wizard-plan",
      cancelPrevious: true,
    });

    await expect(promise1).rejects.toThrow();
    const res2 = await promise2;

    expect(abortedCallCount).toBe(1);
    expect(completedCallCount).toBe(1);
    expect(res2).toEqual({ version: "v2" });
  });

  it("allows explicit manual cancellation with cancel(dedupeKey)", async () => {
    let wasAborted = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const signal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          wasAborted = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const promise = apiClient.request("/api/events/chat", {
      method: "POST",
      dedupeKey: "chat-req-1",
    });

    apiClient.cancel("chat-req-1");

    await expect(promise).rejects.toThrow("Aborted");
    expect(wasAborted).toBe(true);
  });
});

