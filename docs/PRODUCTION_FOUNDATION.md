# PENETIX Pay — production platform engineering (Phase 1)

This is a **foundation for a future production platform**, not a claim that real bank financing or customer payments are enabled. Current customer/merchant/bank demo routes are fictional and unauthenticated (demo role cookies are NOT security).

## Isolated payment core
- `src/platform/payments/core.ts`: strict LKR minor-unit input validation, state machine, actor-authorized transitions and event records.
- `src/platform/payments/provider.ts`: fail-closed financing interface; no real bank connected.
- `src/platform/payments/sandbox.ts`: deterministic Rs. 10 test transaction, with explicit `moneyMoved:false`.
- `scripts/sandbox-payment.ts`: CLI harness.
- `db/migrations/0001_initial.sql`: **review-only** relational sketch for customer accounts, external KYC references, merchant agreements, transactions, applications, idempotency and event outbox. Not applied to any real database.

Run locally: `npm run sandbox:payment` and `npm test`.
The sandbox result `settled` is FICTIONAL and never a real receipt.

## Required before any actual transaction
1. Licensed financial partner, suitable bank/product/legal approvals, compliant contracts and consumer disclosures.
2. Bank-accepted authentication, verified identity/KYC provider and controlled document/data retention. Email verification does NOT equal lending KYC.
3. Managed transactional DB (separate protected environment), authorized server identities, scoped access, encryption, backups, incident management and operational reconciliation.
4. Real financing partner sandbox credentials, server-side authenticated webhooks with replay detection, provider-certified QR/payment rails, processing/refund and reconciliation tests.
5. Signed pilot agreements, security audits and verified transaction limits. Obtain explicit amount/payment authorisation before any real charge.

## Planned next implementation packages
- Authentication: managed identity provider supporting email OTP; Resend can be used as provider-approved transactional email transport when configured. Never implement self-issued insecure identity proof.
- Customer profile + KYC: separate external verification result from private source documents, never store raw NIC/card details in local browser/session storage.
- Merchant onboarding: agreements, roles, KYC/KYB evidence via secure storage and verified bank settlement instructions.
- Payment request APIs: authenticated merchant accounts, idempotent DB transaction writes and approved bank adapter.
- Customer checkout: consent to full repayment terms, unique financing application, independently verified provider outcomes.
- Ledger and settlement: double-entry accounting, webhooks, exceptions, refunds/disputes, daily reconciliation and operator segregation.
- Recovery: bank-owned collections subject to applicable laws; no arbitrary threats, penalties or app-initiated legal action.

## Environment gates
Live banking should be enabled ONLY after explicit bank onboarding and penetration testing. No money movement code or production API credentials have been added.

## Why the existing mock service remains
It supports UI demonstrations only. Do not reuse demo roles, mock IDs, simulated approvals or client-supplied financial state as authentication or production transaction records.
