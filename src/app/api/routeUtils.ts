import { NextRequest, NextResponse } from "next/server";
import { ZodType, ZodError } from "zod";
import { AiServiceError } from "@/services/ai/provider";

/**
 * Standard API error response shape.
 * Guaranteed to never contain stack traces, internal system details, or credentials.
 */
export interface ApiErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

/**
 * Known system secrets to scrub from all error responses.
 */
const SENSITIVE_STRINGS: string[] = [];

// Register environment secrets to scrub
if (typeof process !== "undefined" && process.env) {
  if (process.env.GEMINI_API_KEY) {
    SENSITIVE_STRINGS.push(process.env.GEMINI_API_KEY);
  }
}

/**
 * Scrubs any sensitive environment variable or secret from outgoing error messages.
 */
export function scrubSecrets(input: string): string {
  if (!input) return "";
  let result = input;
  for (const secret of SENSITIVE_STRINGS) {
    if (secret && secret.length > 4) {
      result = result.split(secret).join("[REDACTED_SECRET]");
    }
  }
  // Strip any stack trace paths or Node internal stack indicators
  return result
    .replace(/at\s+[\w\d.<>_]+\s+\([^)]+\)/g, "")
    .replace(/[a-zA-Z]:\\[^:\n]+/g, "[REDACTED_PATH]");
}

/**
 * Registers an additional secret to scrub from responses (useful in testing).
 */
export function registerSecretToScrub(secret: string): void {
  if (secret && secret.length > 2 && !SENSITIVE_STRINGS.includes(secret)) {
    SENSITIVE_STRINGS.push(secret);
  }
}

/**
 * Creates a consistent, scrubbed API error response.
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  extraHeaders?: Record<string, string>,
): NextResponse<ApiErrorResponse> {
  const safeMessage = scrubSecrets(message);

  let safeDetails: unknown = undefined;
  if (details !== undefined && details !== null) {
    if (typeof details === "string") {
      safeDetails = scrubSecrets(details);
    } else {
      try {
        const json = JSON.stringify(details);
        safeDetails = JSON.parse(scrubSecrets(json));
      } catch {
        safeDetails = undefined;
      }
    }
  }

  const payload: ApiErrorResponse = {
    error: {
      code,
      message: safeMessage,
      ...(safeDetails !== undefined ? { details: safeDetails } : {}),
    },
  };

  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    ...(extraHeaders || {}),
  });

  return NextResponse.json(payload, { status, headers });
}

/**
 * IP format validation regex (IPv4 or IPv6)
 */
const IP_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-fA-F0-9:]+$/;

/**
 * Sliding Window In-Memory Rate Limiter.
 * Protected against unbounded memory exhaustion with maxTrackedIps cap and automatic eviction.
 */
export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly maxTrackedIps: number;
  private readonly clientLog = new Map<string, number[]>();

  constructor(
    maxRequests: number = 30,
    windowMs: number = 60000,
    maxTrackedIps: number = 5000,
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxTrackedIps = maxTrackedIps;
  }

  public get trackedIpsCount(): number {
    return this.clientLog.size;
  }

  /**
   * Evaluates request rate limit against the sliding window for the given client IP.
   */
  check(clientIp: string): {
    readonly isAllowed: boolean;
    readonly remaining: number;
    readonly retryAfterSeconds: number;
    readonly resetSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Memory protection: if map size reaches capacity, prune expired entries
    if (this.clientLog.size >= this.maxTrackedIps && !this.clientLog.has(clientIp)) {
      for (const [ip, log] of this.clientLog.entries()) {
        const active = log.filter((t) => t > windowStart);
        if (active.length === 0) {
          this.clientLog.delete(ip);
        } else {
          this.clientLog.set(ip, active);
        }
      }
      // If still at or above capacity after pruning expired, evict oldest entry
      if (this.clientLog.size >= this.maxTrackedIps) {
        const firstKey = this.clientLog.keys().next().value;
        if (firstKey) {
          this.clientLog.delete(firstKey);
        }
      }
    }

    // Retrieve and clean timestamps older than sliding window
    const timestamps = (this.clientLog.get(clientIp) || []).filter(
      (t) => t > windowStart,
    );

    if (timestamps.length >= this.maxRequests) {
      const oldestTimestamp = timestamps[0];
      const expiryTime = oldestTimestamp + this.windowMs;
      const retryAfterMs = Math.max(1000, expiryTime - now);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      this.clientLog.set(clientIp, timestamps);
      return {
        isAllowed: false,
        remaining: 0,
        retryAfterSeconds,
        resetSeconds: retryAfterSeconds,
      };
    }

    // Append current timestamp
    timestamps.push(now);
    this.clientLog.set(clientIp, timestamps);

    const remaining = Math.max(0, this.maxRequests - timestamps.length);
    const resetSeconds = Math.ceil(this.windowMs / 1000);

    return {
      isAllowed: true,
      remaining,
      retryAfterSeconds: 0,
      resetSeconds,
    };
  }

  reset(): void {
    this.clientLog.clear();
  }
}

/**
 * Shared rate limiters for API routes.
 */
export const sharedRateLimiter = new SlidingWindowRateLimiter(20, 60000); // 20 req/min

/**
 * Extracts client IP from request headers or socket info.
 * Validates IP format to prevent prototype pollution or invalid key flooding.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0].trim();
    if (first && first.length <= 45 && IP_REGEX.test(first)) {
      return first;
    }
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    const trimmed = realIp.trim();
    if (trimmed && trimmed.length <= 45 && IP_REGEX.test(trimmed)) {
      return trimmed;
    }
  }

  return "127.0.0.1";
}

/**
 * Options for parsing and validating an incoming JSON request.
 */
export interface RequestValidationOptions {
  readonly maxBodySizeBytes?: number;
  readonly rateLimiter?: SlidingWindowRateLimiter;
}

const DEFAULT_MAX_BODY_SIZE = 65536; // 64 KB

/**
 * Parses and validates request body with strict Content-Type and size checks.
 */
export async function parseAndValidateRequest<T>(
  req: NextRequest,
  schema: ZodType<T>,
  options: RequestValidationOptions = {},
): Promise<
  { ok: true; data: T } | { ok: false; response: NextResponse<ApiErrorResponse> }
> {
  // 1. Check Rate Limit
  const limiter = options.rateLimiter || sharedRateLimiter;
  const clientIp = getClientIp(req);
  const rateLimitStatus = limiter.check(clientIp);

  if (!rateLimitStatus.isAllowed) {
    const response = createErrorResponse(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again later.",
      undefined,
      {
        "Retry-After": String(rateLimitStatus.retryAfterSeconds),
        "X-RateLimit-Limit": String(limiter["maxRequests"]),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rateLimitStatus.resetSeconds),
      },
    );
    return { ok: false, response };
  }

  // 2. Enforce Content-Type header
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const response = createErrorResponse(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json",
    );
    return { ok: false, response };
  }

  // 3. Enforce Max Body Size (Header check)
  const maxBytes = options.maxBodySizeBytes ?? DEFAULT_MAX_BODY_SIZE;
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    const response = createErrorResponse(
      413,
      "PAYLOAD_TOO_LARGE",
      `Request body exceeds maximum size of ${maxBytes} bytes`,
    );
    return { ok: false, response };
  }

  // 4. Read body text & verify byte size
  let rawBodyText: string;
  try {
    rawBodyText = await req.text();
  } catch {
    const response = createErrorResponse(
      400,
      "INVALID_BODY",
      "Failed to read request body text",
    );
    return { ok: false, response };
  }

  const byteLength = new TextEncoder().encode(rawBodyText).length;
  if (byteLength > maxBytes) {
    const response = createErrorResponse(
      413,
      "PAYLOAD_TOO_LARGE",
      `Request body size (${byteLength} bytes) exceeds limit of ${maxBytes} bytes`,
    );
    return { ok: false, response };
  }

  // 5. Parse JSON
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBodyText);
  } catch {
    const response = createErrorResponse(
      400,
      "MALFORMED_JSON",
      "Request body is not valid JSON",
    );
    return { ok: false, response };
  }

  // 6. Validate with strict Zod schema
  try {
    const data = schema.parse(parsedJson);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      const response = createErrorResponse(
        400,
        "VALIDATION_ERROR",
        "Request body validation failed",
        issues,
      );
      return { ok: false, response };
    }

    const response = createErrorResponse(400, "VALIDATION_ERROR", "Validation failed");
    return { ok: false, response };
  }
}

/**
 * Maps service and domain layer errors to consistent HTTP error responses.
 */
export function mapServiceErrorToResponse(
  error: unknown,
): NextResponse<ApiErrorResponse> {
  if (error instanceof AiServiceError) {
    if (error.code === "TIMEOUT_ERROR") {
      return createErrorResponse(
        504,
        "SERVICE_TIMEOUT",
        "The upstream AI service timed out processing your request.",
      );
    }
    if (error.code === "RATE_LIMIT_ERROR") {
      return createErrorResponse(
        503,
        "UPSTREAM_RATE_LIMITED",
        "Upstream AI service capacity exceeded. Please retry shortly.",
      );
    }
    if (error.code === "NETWORK_ERROR") {
      return createErrorResponse(
        502,
        "UPSTREAM_UNAVAILABLE",
        "Unable to reach the upstream AI provider.",
      );
    }
    if (error.code === "VALIDATION_ERROR") {
      return createErrorResponse(
        502,
        "UPSTREAM_INVALID_RESPONSE",
        "Upstream service generated an invalid response.",
      );
    }
    if (error.code === "OFF_TOPIC_REFUSAL") {
      return createErrorResponse(
        400,
        "OFF_TOPIC_REQUEST",
        "Request is outside the supported event planning domain.",
      );
    }
  }

  if (error instanceof RangeError || error instanceof TypeError) {
    return createErrorResponse(400, "BAD_REQUEST", error.message);
  }

  // Generic 503 fallback - no internal details or stack traces
  return createErrorResponse(
    503,
    "SERVICE_UNAVAILABLE",
    "Service temporarily unavailable. Please try again later.",
  );
}
