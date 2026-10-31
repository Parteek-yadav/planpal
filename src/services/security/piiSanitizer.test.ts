import { describe, it, expect } from "vitest";
import { sanitizePii } from "./piiSanitizer";

describe("PII Sanitizer", () => {
  it("redacts email addresses", () => {
    const input = "Please contact me at party.planner123@gmail.com for details.";
    const result = sanitizePii(input);
    expect(result).not.toContain("party.planner123@gmail.com");
    expect(result).toContain("[REDACTED_EMAIL]");
  });

  it("redacts phone numbers in various formats", () => {
    const input1 = "Call me at (555) 123-4567 tomorrow.";
    expect(sanitizePii(input1)).toContain("[REDACTED_PHONE]");

    const input2 = "Reach us at 555-987-6543 or +1 800 555 0199.";
    const sanitized = sanitizePii(input2);
    expect(sanitized).not.toContain("555-987-6543");
    expect(sanitized).toContain("[REDACTED_PHONE]");
  });

  it("handles clean strings without modification", () => {
    const input = "Outdoor garden reception with fairy lights and acoustic trio.";
    expect(sanitizePii(input)).toBe(input);
  });

  it("handles empty or falsy strings gracefully", () => {
    expect(sanitizePii("")).toBe("");
  });
});
