# PENETIX Pay full-screen concept experience

The root route displays a short accessible PX brand splash, then automatically opens the customer app. Demo access is issued by the local mock session route; it is **not** real authentication. Existing customer flows (explore, offer comparison, installment plans, simulated bank approval, orders and repayments) remain intact.

## Navigation
- `/` — animated opening, redirects to `/customer/home`.
- `/customer/home` — full-width premium responsive shopping home.
- `/customer/explore` — fictional product catalog with search and filters.
- `/customer/find-my-deal` — voluntary fictional merchant offers.
- `/customer/payments` — simulated finance plans.
- Workspace switcher in customer header: merchant or bank demos. Presenter tools (Alt+P) provide scenarios and reset.

## Safety
All information is fictional and transactions are simulations. No confirmed merchant/bank partners, no real card data, no actual financing. Production financial integrations require contract, authorisation and independent security review.

## Visual system
Dominant white, charcoal text, muted gray and restricted emerald accents. Responsive product grid, desktop horizontal navigation, mobile bottom navigation, reduced-motion fallback, branded loading animation.

## Verification to run locally
`npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`

No CI or browser execution is claimed for these changes until those commands have been run in a connected development environment.
