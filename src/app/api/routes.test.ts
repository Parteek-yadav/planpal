import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as handleIdeas } from "./ideas/route";
import { POST as handleBudgetAdvice } from "./budget-advice/route";
import { POST as handleChat } from "./chat/route";
import { POST as handleTimeline } from "./timeline/route";
import { POST as handleVendors } from "./vendors/route";
import {
  sharedRateLimiter,
  SlidingWindowRateLimiter,
  parseAndValidateRequest,
  createErrorResponse,
  registerSecretToScrub,
  mapServiceErrorToResponse,
} from "./routeUtils";
import { z } from "zod";
import * as aiService from "@/services/ai/aiService";
import { AiServiceError, MockAiProvider } from "@/services/ai/provider";

describe("Thin API Route Handlers", () => {
  const validProfile = {
    title: "Harper & Ethan Wedding",
    eventType: "wedding" as const,
    date: "2027-08-20",
    guestCount: 150,
    budget: 35000,
    location: "Botanical Garden Terrace",
    theme: "Modern Botanical",
    description: "An elegant evening celebration",
    notes: "Requires vegan options",
    constraints: {
      dietary: ["vegan"],
      accessibility: ["wheelchair_accessible"],
      kidFriendly: false,
    },
  };

  beforeEach(() => {
    sharedRateLimiter.reset();
    aiService.resetIdeasCache();
    // Configure mock provider by default for offline deterministic execution
    const mock = new MockAiProvider();
    mock.queueResponse({
      text: JSON.stringify({
        eventSummary: "A modern botanical wedding",
        themes: [
          {
            title: "Modern Botanical",
            description: "Eucalyptus greenery",
            colorPalette: ["#112233", "#445566"],
          },
        ],
        activities: [
          {
            name: "Cocktail Hour",
            description: "Mingling with live strings",
            targetAudience: "All",
            durationMinutes: 60,
          },
        ],
        menus: [
          {
            course: "Dinner",
            dishName: "Risotto",
            description: "Truffle risotto",
            dietaryTags: ["vegan"],
          },
        ],
        decorations: [
          {
            focalArea: "Arch",
            materials: "Foliage",
            diyBudgetFriendlyTip: "Rent locally",
          },
        ],
      }),
    });
    aiService.setAiProvider(mock);
  });

  describe("POST /api/ideas", () => {
    it("returns 200 and structured ideas on valid profile input (happy path)", async () => {
      const req = new NextRequest("http://localhost:3000/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validProfile),
      });

      const res = await handleIdeas(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("max-age=300");

      const body = (await res.json()) as { eventSummary: string; themes: unknown[] };
      expect(body.eventSummary).toBeDefined();
      expect(body.themes.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects request with unknown fields (rejects unknown properties)", async () => {
      const reqWithUnknown = {
        ...validProfile,
        unexpectedHackerField: "malicious_payload",
      };

      const req = new NextRequest("http://localhost:3000/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqWithUnknown),
      });

      const res = await handleIdeas(req);
      expect(res.status).toBe(400);

      const body = (await res.json()) as {
        error: { code: string; message: string; details?: unknown };
      };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(JSON.stringify(body.error.details)).toContain("Unrecognized key");
    });
  });

  describe("POST /api/budget-advice", () => {
    it("returns 200 and structured budget advice (happy path)", async () => {
      const mock = new MockAiProvider();
      mock.queueResponse({
        text: JSON.stringify({
          summary: "Budget is well managed",
          categoryRecommendations: [
            {
              category: "venue",
              status: "ok",
              advice: "On track",
            },
          ],
          savingOpportunities: [
            {
              area: "Decor",
              strategy: "DIY table signs",
              estimatedSavings: "$200",
            },
          ],
          riskAlerts: [],
        }),
      });
      aiService.setAiProvider(mock);

      const payload = {
        profile: validProfile,
        spend: { venue: 8000, catering: 7000 },
      };

      const req = new NextRequest("http://localhost:3000/api/budget-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleBudgetAdvice(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("no-store");

      const body = (await res.json()) as {
        summary: string;
        categoryRecommendations: unknown[];
      };
      expect(body.summary).toBe("Budget is well managed");
      expect(body.categoryRecommendations.length).toBe(1);
    });

    it("rejects unknown fields in budget-advice payload", async () => {
      const payload = {
        profile: validProfile,
        spend: { venue: 8000 },
        extraField: "not allowed",
      };

      const req = new NextRequest("http://localhost:3000/api/budget-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleBudgetAdvice(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/chat", () => {
    it("returns 200 and grounded answer for event question (happy path)", async () => {
      const mock = new MockAiProvider();
      mock.queueResponse({
        text: JSON.stringify({
          answer: "We recommend a tent backup in case of rain.",
          isOffTopic: false,
          suggestedFollowUps: ["How much is tent rental?"],
          groundedReferences: ["Location: Botanical Garden Terrace"],
        }),
      });
      aiService.setAiProvider(mock);

      const payload = {
        profile: validProfile,
        plan: { currentSpent: 15000 },
        question: "What should we do if weather turns rainy?",
      };

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleChat(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("no-store");

      const body = (await res.json()) as { answer: string; isOffTopic: boolean };
      expect(body.answer).toContain("tent backup");
      expect(body.isOffTopic).toBe(false);
    });

    it("rejects empty or whitespace-only questions", async () => {
      const payload = {
        profile: validProfile,
        plan: {},
        question: "    ",
      };

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleChat(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/timeline", () => {
    it("returns 200 and backward scheduled milestones (happy path)", async () => {
      const payload = {
        eventType: "wedding",
        date: "2027-10-15",
      };

      const req = new NextRequest("http://localhost:3000/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleTimeline(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("public, max-age=3600");

      const body = (await res.json()) as {
        milestones: Array<{ title: string; targetDate: string }>;
      };
      expect(body.milestones.length).toBe(8);
      expect(body.milestones[0].title).toBe("Finalize Guest Count & Set Budget Cap");
    });

    it("rejects invalid date format in timeline request", async () => {
      const req = new NextRequest("http://localhost:3000/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "wedding", date: "invalid-date" }),
      });

      const res = await handleTimeline(req);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/vendors", () => {
    it("returns 200 and default vendor checklist (happy path)", async () => {
      const payload = {
        eventType: "birthday",
      };

      const req = new NextRequest("http://localhost:3000/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleVendors(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("public, max-age=86400");

      const body = (await res.json()) as { vendors: Array<{ category: string }> };
      expect(body.vendors.length).toBe(6);
      expect(body.vendors.some((v) => v.category === "cake")).toBe(true);
    });

    it("rejects unknown fields in vendor request", async () => {
      const req = new NextRequest("http://localhost:3000/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "birthday", rogueKey: 123 }),
      });

      const res = await handleVendors(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Content-Type & Body Size Enforcement", () => {
    it("rejects request missing application/json Content-Type header with 415", async () => {
      const req = new NextRequest("http://localhost:3000/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ eventType: "wedding", date: "2027-10-15" }),
      });

      const res = await handleTimeline(req);
      expect(res.status).toBe(415);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    });

    it("rejects request with malformed JSON body with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ broken json: ",
      });

      const res = await handleTimeline(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("MALFORMED_JSON");
    });

    it("rejects oversized request body (Content-Length header check) with 413", async () => {
      const req = new NextRequest("http://localhost:3000/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "70000", // exceeds 64KB
        },
        body: JSON.stringify(validProfile),
      });

      const res = await handleIdeas(req);
      expect(res.status).toBe(413);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("rejects oversized body data content with 413", async () => {
      const hugeDescription = "A".repeat(70000);
      const oversizedPayload = {
        ...validProfile,
        description: hugeDescription,
      };

      const req = new NextRequest("http://localhost:3000/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oversizedPayload),
      });

      const res = await handleIdeas(req);
      expect(res.status).toBe(413);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe("PAYLOAD_TOO_LARGE");
    });
  });

  describe("Per-IP Sliding Window Rate Limiting (429 + Retry-After)", () => {
    it("triggers 429 and Retry-After header when rate limit is exceeded", async () => {
      const limiter = new SlidingWindowRateLimiter(3, 10000); // 3 requests per 10s
      const testSchema = z.object({ value: z.string() }).strict();

      const makeReq = () =>
        new NextRequest("http://localhost:3000/api/test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "198.51.100.42",
          },
          body: JSON.stringify({ value: "test" }),
        });

      // Requests 1, 2, 3 should succeed
      expect(
        (await parseAndValidateRequest(makeReq(), testSchema, { rateLimiter: limiter }))
          .ok,
      ).toBe(true);
      expect(
        (await parseAndValidateRequest(makeReq(), testSchema, { rateLimiter: limiter }))
          .ok,
      ).toBe(true);
      expect(
        (await parseAndValidateRequest(makeReq(), testSchema, { rateLimiter: limiter }))
          .ok,
      ).toBe(true);

      // Request 4 from same IP triggers 429
      const fourthResult = await parseAndValidateRequest(makeReq(), testSchema, {
        rateLimiter: limiter,
      });
      expect(fourthResult.ok).toBe(false);
      if (!fourthResult.ok) {
        expect(fourthResult.response.status).toBe(429);
        expect(fourthResult.response.headers.get("Retry-After")).toBeDefined();
        const retryAfter = Number(fourthResult.response.headers.get("Retry-After"));
        expect(retryAfter).toBeGreaterThan(0);

        const body = (await fourthResult.response.json()) as { error: { code: string } };
        expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
      }
    });

    it("isolates rate limiting by client IP address", async () => {
      const limiter = new SlidingWindowRateLimiter(1, 10000);
      const testSchema = z.object({ val: z.number() }).strict();

      const reqIp1 = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-real-ip": "1.1.1.1" },
        body: JSON.stringify({ val: 1 }),
      });
      const reqIp2 = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-real-ip": "2.2.2.2" },
        body: JSON.stringify({ val: 2 }),
      });

      // IP 1 first request succeeds
      expect(
        (await parseAndValidateRequest(reqIp1, testSchema, { rateLimiter: limiter })).ok,
      ).toBe(true);
      // IP 1 second request blocked
      expect(
        (await parseAndValidateRequest(reqIp1, testSchema, { rateLimiter: limiter })).ok,
      ).toBe(false);

      // IP 2 first request succeeds (different IP)
      expect(
        (await parseAndValidateRequest(reqIp2, testSchema, { rateLimiter: limiter })).ok,
      ).toBe(true);
    });
  });

  describe("Service Failure Mappings (502 / 503 / 504)", () => {
    it("maps AI upstream network error to 502 Bad Gateway", () => {
      const netError = new AiServiceError("Remote connection dropped", "NETWORK_ERROR");
      const res = mapServiceErrorToResponse(netError);

      expect(res.status).toBe(502);
      expect(res.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, must-revalidate",
      );
    });

    it("maps AI upstream validation error to 502 Bad Gateway", () => {
      const valError = new AiServiceError(
        "Model produced invalid json",
        "VALIDATION_ERROR",
      );
      const res = mapServiceErrorToResponse(valError);
      expect(res.status).toBe(502);
    });

    it("maps AI timeout error to 504 Gateway Timeout", () => {
      const timeoutError = new AiServiceError("Upstream timed out", "TIMEOUT_ERROR");
      const res = mapServiceErrorToResponse(timeoutError);
      expect(res.status).toBe(504);
    });

    it("maps upstream rate limiting to 503 Service Unavailable", () => {
      const rateError = new AiServiceError("Quota exceeded", "RATE_LIMIT_ERROR");
      const res = mapServiceErrorToResponse(rateError);
      expect(res.status).toBe(503);
    });

    it("maps unexpected errors to 503 without internal details", async () => {
      const secretException = new Error("Database crashed at /var/secrets/db.key");
      const res = mapServiceErrorToResponse(secretException);

      expect(res.status).toBe(503);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
      expect(body.error.message).toBe(
        "Service temporarily unavailable. Please try again later.",
      );
      // No internal stack or path
      expect(JSON.stringify(body)).not.toContain("/var/secrets");
    });
  });

  describe("Secret Scrubbing & Information Leak Defense", () => {
    it("confirms that registered secrets never appear in error responses", async () => {
      const SECRET_API_KEY = "SUPER_SECRET_GEMINI_KEY_ABC123";
      registerSecretToScrub(SECRET_API_KEY);

      // Simulate a raw error containing the secret key
      const leakyMessage = `Call failed with key=${SECRET_API_KEY} at /internal/lib.ts`;
      const res = createErrorResponse(500, "SYSTEM_ERROR", leakyMessage, {
        rawError: `Debug info: token was ${SECRET_API_KEY}`,
      });

      const bodyText = await res.text();
      expect(bodyText).not.toContain(SECRET_API_KEY);
      expect(bodyText).toContain("[REDACTED_SECRET]");
    });

    it("ensures stack traces never appear in error responses", async () => {
      const errorWithStack = new Error("Something blew up");
      errorWithStack.stack =
        "Error: Something blew up\n    at Object.<anonymous> (c:\\app\\secret.ts:12:34)";

      const res = createErrorResponse(500, "ERROR", errorWithStack.message, {
        stack: errorWithStack.stack,
      });

      const bodyText = await res.text();
      expect(bodyText).not.toContain("c:\\app\\secret.ts");
      expect(bodyText).not.toContain("Object.<anonymous>");
    });
  });
});
