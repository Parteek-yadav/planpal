# PlanPal 🎪💍🎂

> **PlanPal** is an intelligent, GenAI-powered event planning assistant tailored for **weddings**, **birthdays**, and **community events**.

Built with Next.js App Router, TypeScript strict mode, Zod validation, Vitest test suite, and WCAG 2.1 AA accessible design.

---

## 🏛️ Layered Architecture

PlanPal strictly enforces a decoupled unidirectional architecture:

```
/src/domain (Pure Business Logic)
   └── Zero I/O, zero framework dependencies, pure math & models
       ├── Event Intake Schemas & Validations
       ├── Smart Budget Allocation & Variance Engine
       ├── Milestone & Day-of Run-of-Show Timeline Scheduler
       └── Vendor Procurement Manager
         ↓
/src/services (AI & Server Integrations)
   └── Server-only AI client, PII sanitization, structured Zod parsing
         ↓
/src/app/api (Thin Route Handlers)
   └── Thin request validation, HTTP status codes, error formatting
         ↓
/src/components (UI Layer)
   └── WCAG 2.1 AA accessible presentation, responsive design tokens, zero business logic
```

---

## 🛡️ Security & Privacy Guarantees

- **No Client API Keys**: External AI services are invoked only server-side.
- **PII Scrubbing**: Automatic redaction of emails, phone numbers, and SSNs before sending any user text to AI models.
- **Strict Zod Parsing**: Every user input and every AI response is strictly validated against schemas.
- **XSS Prevention**: Never uses `dangerouslySetInnerHTML`.
- **Untrusted Input**: All user-provided text is sanitized and bounded.

---

## ♿ Accessibility (WCAG 2.1 AA)

- Semantic HTML first, supplemented with ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `role="dialog"`).
- Full keyboard operability (Arrow key tab cycling, Escape key modal dismissal).
- High-contrast color tokens exceeding 4.5:1 ratio.
- Visible focus rings (`:focus-visible` outline with offset).
- Respects `prefers-reduced-motion` media query.
- Skip link for screen readers.

---

## 🧪 Testing & Quality Assurance

- **Unit & Integration Tests**: 49 tests across 12 test suites covering every domain calculation, API route handler, and UI component.
- **Type Checking**: Strict TypeScript mode (`noImplicitAny`, `strictNullChecks`).
- **Linting**: ESLint with Prettier integration.

```bash
# Run unit tests
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint linter
npm run lint

# Build production bundle
npm run build
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch PlanPal.
