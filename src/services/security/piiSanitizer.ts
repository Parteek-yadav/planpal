/**
 * Regular expressions for detecting personally identifiable information (PII).
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_REGEX = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g;

/**
 * Sanitizes untrusted user input by stripping or redacting PII patterns
 * (such as emails, phone numbers, and SSN formats) before prompt construction.
 *
 * @param text - Raw input string from untrusted user text.
 * @returns Sanitized string with PII replaced by redaction placeholders.
 */
export function sanitizePii(text: string): string {
  if (!text) return "";
  return text
    .replace(SSN_REGEX, "[REDACTED_ID]")
    .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]");
}
