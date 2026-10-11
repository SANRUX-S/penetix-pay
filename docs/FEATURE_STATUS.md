# Feature status
Implemented means code works locally; Simulated means fictional data with no live service; Stubbed means partial; Not built means absent.

| Feature | Status | Scope |
|---|---|---|
| Native Next.js application and role shells | Implemented | Customer mobile column; merchant and bank workspaces |
| Tokens and contrast checker | Implemented | Stronger text variants preserve brand colours |
| Core UI components and keyboard focus | Implemented | Native dialog, tables, controls and shared sample indicators |
| Exhaustive standalone component inventory | Stubbed | Actual journey components supplied; not every abstraction is separately exported |
| Demo launcher and presenter controls | Simulated | Five personas, role, latency, failure, date, reset |
| Catalog and local illustrations | Simulated | Six generic products; three SVG views per product |
| Finance engine | Implemented | Decimal rate math, cents, clamped dates, IRR and early settlement |
| Merchant fees and bank unit economics | Implemented | Itemised fees, ECL, funding, contribution, break-even |
| Pure state machines and audit | Implemented | Illegal transitions rejected and sample events recorded |
| Browse, plan, checkout and decisions | Simulated | Full sample purchase and three fictional outcomes |
| Payments and early repayment | Simulated | One active fictional plan; no money moves |
| Orders and refund requests | Simulated | Audited sample transitions |
| Find My Deal | Simulated | Current voluntary offers; limits and ranking |
| Merchant product and order management | Simulated | Merchant ownership checked in mock services |
| Merchant offer publishing | Simulated | Net settlement preview and consent gate |
| Settlements and refund adjustments | Simulated | Explicit illustrative fee policy and clawback |
| Bank applications and overrides | Simulated | Fictional decision queue |
| Bank simulator, scenarios, sensitivity and CSV | Simulated | Hypothetical calculations; no forecast |
| Partnership readiness | Implemented | Honest pre-launch facts and proposed controls |
| Session snapshot and preference persistence | Implemented | Versioned, Zod-validated non-sensitive data |
| Mock API and demo role guards | Implemented | Same-origin mock handlers; not production identity |
| Personal-information guard | Implemented | Identifier-like input rejected; no identity fields |
| Localization catalogs and pseudo-locale | Stubbed | Draft scaffold; not all visible copy connected |
| Native and legal locale reviews | Not built | Human review required |
| Live banking, lending, KYC, payments and notifications | Not built | Outside demo scope |
| Production authentication and independent review | Not built | Demo role is user-switchable |
| Lighthouse report | Not built | No Lighthouse scores claimed |
| Browser and accessibility verification | Implemented | Final measured results in docs/VERIFICATION.md |
| Native mobile binaries | Not built | This delivery is an interactive web application |
