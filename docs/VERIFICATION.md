# System verification report

**Historical baseline before the `feat/full-app-entry-redesign` branch.** The test results below refer to the original demo launcher implementation and MUST NOT be interpreted as a passed verification of the new animated entry or responsive visual redesign. Re-run all checks and update this report before merging or publicly presenting the revised UI.

Originally measured on node v22 / Next.js 16.3.4 (Turbopack).

## 1. Automated checks summary

| Check | Command | Result | Details |
|---|---|---|---|
| Typecheck | `npm run typecheck` | Passed | `tsc --noEmit` exited 0 with 0 errors |
| Code Lint | `npm run lint` | Passed | ESLint exited 0 with 0 errors |
| Truth Lint | `npm run truth-lint` | Passed | Scanned `src/`, `app/`, `docs/`; zero banned terms or real brand names |
| Contrast Check | `npm run contrast-check` | Passed | All body text >= 4.5:1, all boundaries >= 3:1 |
| Unit & Property Tests | `npm test` | Passed | 47/47 passing tests in Vitest across 3 test suites |
| Production Build | `npm run build` | Passed | Static and dynamic routes compiled successfully |
| End-to-End Suite | `npm run test:e2e` | Passed | 8/8 tests passed in Playwright |
| Accessibility Audit | `axe-core/playwright` | Passed | 0 automated accessibility violations on launcher and core routes |

## 2. Test vectors verification
- **Vector A (Customer Plan)**:
  - 3M: Monthly Rs. 41,205.96, Final Rs. 41,205.94, Total interest Rs. 3,617.86, Total repayable Rs. 123,617.86, Effective cost 27.30% / 30.99%
  - 6M: Monthly Rs. 21,063.03, Final Rs. 21,063.00, Total interest Rs. 6,378.15, Total repayable Rs. 126,378.15, Effective cost 23.35% / 26.01%
  - 9M: Monthly Rs. 14,353.18, Final Rs. 14,353.17, Total interest Rs. 9,178.61, Total repayable Rs. 129,178.61, Effective cost 21.77% / 24.08%
  - 12M: Monthly Rs. 11,001.60, Final Rs. 11,001.60, Total interest Rs. 12,019.20, Total repayable Rs. 132,019.20, Effective cost 20.92% / 23.05%
- **Vector B (Edge cases)**:
  - Zero rate 12M: EMI Rs. 10,000.00, Total interest Rs. 0.00
  - Rs. 100,000 at 18% over 12M: EMI Rs. 9,168.00, final Rs. 9,167.99, balance Rs. 0.00
  - Early settlement 12M after month 6: outstanding principal Rs. 62,678.17
- **Vector C (Bank building blocks)**:
  - Gross interest: Rs. 12,019.20
  - Funding cost: Rs. 7,345.06
  - Expected credit loss (ECL): Rs. 2,160.00
  - Pre-operations contribution: Rs. 2,514.14

## 3. End-to-End browser journeys tested
1. **Original launcher (historical)**: role choices, persona selector, disclaimers, responsive preview. New splash-to-app behavior not yet browser-verified.
2. **Customer Navigation**: mobile shell with bottom navigation, category chips, greeting.
3. **Customer Purchase**: explore catalog -> product details -> choose plan (EMI and total repayable displayed side by side) -> review & consent -> simulated decision.
4. **Find My Deal**: 3-step voluntary comparison flow (Product -> Limit -> Voluntary offers -> Where the money goes itemisation).
5. **Merchant Portal**: overview with pending net settlement, catalog manager, order workflow, voluntary offer net settlement preview consent gate.
6. **Bank Workspace**: application queue with simulated overrides, seeded portfolio simulation, unit economics simulator with sensitivity heat-table and CSV export, partnership readiness with 6 honest questions.
7. **Role Separation**: cross-role access correctly blocked with `AccessDenied` view.
8. **Accessibility**: Axe audit confirmed clean of critical and serious issues.
