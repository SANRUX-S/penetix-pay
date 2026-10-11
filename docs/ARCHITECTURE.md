# PENETIX Pay concept application

The application separates a mobile-first customer experience, a merchant portal, and a bank partner portal. It runs locally without provider keys. Route handlers and client services operate on fictional sample data; they are not banking integrations.

## Layers

| Layer | Responsibility |
| --- | --- |
| Next App Router | Routes, role shells, demo-role guard, mock endpoint boundaries, and response headers |
| Role components | Present state, gather validated demonstration input, and invoke service actions |
| Demo services | Expose catalog, plans, applications, orders, simulated payments, settlements, and preferences through a single provider |
| Pure domain | Integer-minor-unit money, decimal rate calculations, amortisation, fee split, bank economics, ranking, dates, and legal state transitions |
| Sample fixtures | Fictional profiles, generic merchants and products, round assumptions, and reproducible simulation seeds |

The UI receives sample state through the demo service. Monetary calculations and financial aggregates belong to the domain layer. Components format amounts through the common money formatter; they do not calculate instalments, fees, balances, or contribution themselves.

## Demonstration permission matrix

| Surface | Customer | Merchant | Bank |
| --- | --- | --- | --- |
| Customer catalog and plan journey | Allowed | Denied by role guard | Denied by role guard |
| Customer fictional payment and order views | Allowed | Denied | Denied |
| Merchant products, offers, orders, settlements and disputes | Denied | Current sample merchant only (`m1`) | Denied |
| Bank applications, portfolio and simulator | Denied | Denied | Allowed |
| Launcher / demo role selection | Allowed | Allowed | Allowed |

Role selection is explicitly demo sign-in. The browser role cookie prevents accidental cross-role navigation in this prototype. It is not a live authorisation boundary; production access must be authenticated and enforced independently on every server operation.

## Financial and workflow boundaries

Applications, orders, instalments, settlements, and disputes follow pure transition tables. Invalid transitions throw. Service actions append an audit event with actor, role, prior state, resulting state, reason, and the controlled demo date. Application and order detail views display that trail.

Merchant publication requires a positive validated product price, valid delivery and warranty assumptions, per-product voluntary participation, explicit acknowledgement of the net-settlement preview, and consent to the displayed fee arrangement. Already-selected offers cannot be withdrawn. Refund handling states whether the merchant fee is returned and displays the calculated settlement adjustment before confirmation.

Bank calculations distinguish gross interest income from contribution after funding, credit-loss assumptions, operating costs, and the bank share of merchant fees. The simulator exposes editable assumptions and exports their values with its disclaimer. Seeded simulation is reproducible and is not a forecast or a validated credit model.

## Demo state and clock

The session is in memory with an optional session-storage snapshot. Only non-sensitive preferences use versioned local storage. Reads are validated. Reset restores the same sample fixtures. The controlled demo date, interpreted in Asia/Colombo, drives due-date, overdue, offer-expiry, and audit displays. Presenter error and latency settings demonstrate loading, retry, and failure states.

## Replacing mock services

Before adding a provider, formalise a domain-facing port for that responsibility: catalog, financing, payment, settlement, identity, or notification. Implement the provider behind that interface while preserving domain inputs and outputs. Validate both sides of every boundary, retain integer-minor-unit money and audit semantics, and exercise contract tests against failure and reconciliation cases. A bank integration must own underwriting and customer verification; the proposed minimisation design avoids sending unnecessary verification data through PENETIX.

The current implementation and evidence limits are recorded in `FEATURE_STATUS.md` and `PRODUCTION_GAP.md`. Neither the proposed architecture nor local browser checks establish a production security posture.
