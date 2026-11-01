/**
 * Resilient API client with in-flight request deduplication and
 * stale request cancellation via AbortController.
 */

export interface RequestOptions extends RequestInit {
  readonly dedupeKey?: string;
  readonly cancelPrevious?: boolean;
}

interface InFlightEntry<T> {
  readonly promise: Promise<T>;
  readonly controller: AbortController;
}

class ApiClient {
  private readonly inFlightRequests = new Map<string, InFlightEntry<unknown>>();
  private readonly controllersByKey = new Map<string, AbortController>();

  /**
   * Executes a fetch request with automatic deduplication of concurrent identical requests
   * and optional cancellation of stale previous requests.
   *
   * @param url - Request endpoint URL
   * @param options - Request options including body, headers, dedupeKey, cancelPrevious
   * @returns Parsed JSON response promise
   */
  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { dedupeKey, cancelPrevious = false, ...fetchOptions } = options;

    // 1. Cancel previous stale request for this key if requested
    if (dedupeKey && cancelPrevious) {
      const activeController = this.controllersByKey.get(dedupeKey);
      if (activeController) {
        activeController.abort();
        this.controllersByKey.delete(dedupeKey);
        this.inFlightRequests.delete(dedupeKey);
      }
    }

    // 2. Return in-flight promise if an identical request is already running
    if (dedupeKey && !cancelPrevious) {
      const existing = this.inFlightRequests.get(dedupeKey);
      if (existing) {
        return existing.promise as Promise<T>;
      }
    }

    // 3. Create fresh AbortController linked to caller signal if provided
    const controller = new AbortController();
    if (dedupeKey) {
      this.controllersByKey.set(dedupeKey, controller);
    }

    if (fetchOptions.signal) {
      fetchOptions.signal.addEventListener("abort", () => controller.abort());
    }

    const promise = (async () => {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw Object.assign(
            new Error(
              (errorData as { error?: { message?: string } })?.error?.message ||
                `HTTP error ${response.status}`,
            ),
            { status: response.status, data: errorData },
          );
        }

        return (await response.json()) as T;
      } finally {
        if (dedupeKey) {
          this.inFlightRequests.delete(dedupeKey);
          if (this.controllersByKey.get(dedupeKey) === controller) {
            this.controllersByKey.delete(dedupeKey);
          }
        }
      }
    })();

    if (dedupeKey) {
      this.inFlightRequests.set(dedupeKey, {
        promise: promise as Promise<unknown>,
        controller,
      });
    }

    return promise;
  }

  /**
   * Cancel any pending in-flight request associated with dedupeKey.
   */
  cancel(dedupeKey: string): void {
    const controller = this.controllersByKey.get(dedupeKey);
    if (controller) {
      controller.abort();
      this.controllersByKey.delete(dedupeKey);
      this.inFlightRequests.delete(dedupeKey);
    }
  }

  /**
   * Reset all in-flight trackers (for testing).
   */
  clear(): void {
    for (const controller of this.controllersByKey.values()) {
      controller.abort();
    }
    this.inFlightRequests.clear();
    this.controllersByKey.clear();
  }
}

export const apiClient = new ApiClient();

