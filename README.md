# PENETIX Pay concept app
An interactive application for a proposed Sri Lankan bank-funded installment platform. This is a fictional demonstration. No real lending, identity checks, bank decisions, or money movement take place.

## Run locally
Node.js 22.13 or later.
```sh
npm install
npm run dev
```
Open http://127.0.0.1:3000. Choose Customer, Merchant, or Bank in the demo launcher. The customer app is mobile first. The partner workspaces use responsive desktop layouts.

## Checks
```sh
npm run typecheck
npm run lint
npm run truth-lint
npm run contrast-check
npm test
npm run build
npm run test:e2e
```
End-to-end tests require a Playwright browser. The app needs no keys or runtime external requests. Fonts and product illustrations are local.

## Present the concept
Use the scenario selector or Demo controls (Alt + P). Scenarios include New customer, Active plan, Conditional approval, Declined application, and Overdue installment. Edit the demo date, latency, and failure toggle. Reset demo restores seeded fictional data.

## Architecture
Native Next.js App Router, React, strict TypeScript, Tailwind, Lucide, Decimal.js, Zod, Vitest, fast-check, Playwright and axe. App routes are under app/; shared components, ports, mock adapters, fixtures, pure financial logic and translations are under src/. Demo role cookies control layouts and mock route handlers; these are not production authentication.

See docs/FEATURE_STATUS.md for the feature ledger, docs/FINANCIAL_MODEL.md for calculations, docs/ARCHITECTURE.md for system boundaries, and docs/PRODUCTION_GAP.md for requirements before live use.

All products and merchants are fictional. All displayed rates are editable demo assumptions. A bank would retain control of real underwriting and provide lending capital. PENETIX would provide technology and potential merchant-acquisition services.
