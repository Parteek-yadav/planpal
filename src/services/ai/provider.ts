/**
 * Options configuring AI content generation requests.
 */
export interface GenerateContentOptions {
  readonly prompt: string;
  readonly systemInstruction?: string;
  readonly maxOutputTokens?: number;
  readonly temperature?: number;
  readonly responseMimeType?: string;
  readonly timeoutMs?: number;
}

/**
 * Result returned by an AI provider.
 */
export interface GenerateContentResult {
  readonly text: string;
}

/**
 * Pluggable provider interface allowing the AI client to be mocked in tests
 * and decoupled from specific remote SDKs.
 */
export interface AiProvider {
  generateContent(options: GenerateContentOptions): Promise<GenerateContentResult>;
}

/**
 * Standard typed error codes for AI service operations.
 */
export type AiErrorCode =
  | "VALIDATION_ERROR"
  | "TIMEOUT_ERROR"
  | "NETWORK_ERROR"
  | "RATE_LIMIT_ERROR"
  | "OFF_TOPIC_REFUSAL"
  | "CONFIGURATION_ERROR";

/**
 * Typed error class representing errors occurring within the AI subsystem.
 * Never serializes or leaks user-provided prompt content in message or cause.
 */
export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode,
    public readonly cause?: unknown,
    public readonly retryCount: number = 0,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

/**
 * Configuration for exponential backoff with jitter.
 */
export interface BackoffOptions {
  readonly maxRetries?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly jitterFactor?: number;
  readonly shouldRetry?: (error: unknown) => boolean;
}

/**
 * Sleep helper utility using standard setTimeout.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an async operation with exponential backoff and randomized jitter for transient errors.
 *
 * @param operation - Function executing the attempt
 * @param options - Backoff tuning configuration
 * @returns Result of the operation
 */
export async function executeWithExponentialBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  options: BackoffOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 5000;
  const jitterFactor = options.jitterFactor ?? 0.25;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries) {
        break;
      }

      if (options.shouldRetry && !options.shouldRetry(error)) {
        break;
      }

      // Exponential delay: base * 2^attempt
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
      // Add randomized jitter
      const jitter = (Math.random() * 2 - 1) * jitterFactor * cappedDelay;
      const actualDelay = Math.max(0, cappedDelay + jitter);

      await sleep(actualDelay);
    }
  }

  throw lastError;
}

/**
 * Evaluates whether current execution is in a client-side (browser) environment.
 */
export function isClientEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  // In Node.js testing environments (like jsdom), window is mocked. Real browsers lack Node process.
  if (
    typeof process !== "undefined" &&
    process.versions?.node &&
    process.env.NODE_ENV === "test"
  ) {
    return false;
  }
  return true;
}

/**
 * Server-side Gemini API provider connecting to Google Generative Language endpoints.
 * Enforces server-side only execution, timeouts, token capping, and zero sensitive logging.
 */
export class GeminiApiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxTokens: number;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    defaultTimeoutMs?: number;
    defaultMaxTokens?: number;
    forceClientSide?: boolean;
  }) {
    // Enforce server-side only execution
    if (options?.forceClientSide || isClientEnvironment()) {
      throw new AiServiceError(
        "GeminiApiProvider cannot be instantiated in client-side environment",
        "CONFIGURATION_ERROR",
      );
    }

    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY || "";
    this.model = options?.model || "gemini-2.5-flash";
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 10000; // 10s default
    this.defaultMaxTokens = options?.defaultMaxTokens ?? 2048; // Max output token cap
  }

  async generateContent(options: GenerateContentOptions): Promise<GenerateContentResult> {
    if (!this.apiKey) {
      throw new AiServiceError("Gemini API key is not configured", "CONFIGURATION_ERROR");
    }

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const maxOutputTokens = Math.min(
      options.maxOutputTokens ?? this.defaultMaxTokens,
      4096,
    );

    return executeWithExponentialBackoff(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const contents = [
            {
              role: "user",
              parts: [{ text: options.prompt }],
            },
          ];

          const bodyPayload: Record<string, unknown> = {
            contents,
            generationConfig: {
              responseMimeType: options.responseMimeType || "application/json",
              temperature: options.temperature ?? 0.2,
              maxOutputTokens,
            },
          };

          if (options.systemInstruction) {
            bodyPayload.systemInstruction = {
              parts: [{ text: options.systemInstruction }],
            };
          }

          const encodedModel = encodeURIComponent(this.model);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": this.apiKey,
              },
              body: JSON.stringify(bodyPayload),
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            if (response.status === 429) {
              throw new AiServiceError(
                "Gemini API rate limit exceeded",
                "RATE_LIMIT_ERROR",
              );
            }
            throw new AiServiceError(
              `Gemini API returned status ${response.status}`,
              "NETWORK_ERROR",
            );
          }

          const data = (await response.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };

          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text === undefined || text === null) {
            throw new AiServiceError(
              "Gemini response did not contain text content",
              "VALIDATION_ERROR",
            );
          }

          return { text };
        } catch (error) {
          if (
            (error instanceof Error && error.name === "AbortError") ||
            (error as { name?: string })?.name === "TimeoutError"
          ) {
            throw new AiServiceError(
              `AI request timed out after ${timeoutMs}ms`,
              "TIMEOUT_ERROR",
              error,
            );
          }
          if (error instanceof AiServiceError) {
            throw error;
          }
          throw new AiServiceError(
            "Network error communicating with AI provider",
            "NETWORK_ERROR",
            error,
          );
        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        maxRetries: 2,
        shouldRetry: (err) => {
          if (err instanceof AiServiceError) {
            return (
              err.code === "NETWORK_ERROR" ||
              err.code === "RATE_LIMIT_ERROR" ||
              err.code === "TIMEOUT_ERROR"
            );
          }
          return false;
        },
      },
    );
  }
}

/**
 * In-memory MockAiProvider for unit testing with programmable responses,
 * error simulation, delay, and call inspection.
 */
export class MockAiProvider implements AiProvider {
  public callCount = 0;
  public readonly recordedCalls: GenerateContentOptions[] = [];
  private responseQueue: Array<
    | GenerateContentResult
    | Error
    | ((opts: GenerateContentOptions) => Promise<GenerateContentResult>)
  > = [];

  constructor(
    initialResponses?: Array<
      | GenerateContentResult
      | Error
      | ((opts: GenerateContentOptions) => Promise<GenerateContentResult>)
    >,
  ) {
    if (initialResponses) {
      this.responseQueue.push(...initialResponses);
    }
  }

  queueResponse(
    response:
      | GenerateContentResult
      | Error
      | ((opts: GenerateContentOptions) => Promise<GenerateContentResult>),
  ): void {
    this.responseQueue.push(response);
  }

  async generateContent(options: GenerateContentOptions): Promise<GenerateContentResult> {
    this.callCount++;
    this.recordedCalls.push(options);

    if (options.timeoutMs && options.timeoutMs < 10) {
      throw new AiServiceError(
        `AI request timed out after ${options.timeoutMs}ms`,
        "TIMEOUT_ERROR",
      );
    }

    if (this.responseQueue.length > 0) {
      const next = this.responseQueue.shift()!;
      if (typeof next === "function") {
        return next(options);
      }
      if (next instanceof Error) {
        throw next;
      }
      return next;
    }

    return { text: "{}" };
  }

  reset(): void {
    this.callCount = 0;
    this.recordedCalls.length = 0;
    this.responseQueue = [];
  }
}
