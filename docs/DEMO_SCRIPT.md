# Presenting PENETIX Pay

Start on the launcher with the Base scenario. Reset the demo before each walkthrough. Use fictional sample profiles only. All rates and financial figures are illustrative; no money moves.

## Five-minute walkthrough

| Time | Exact action | One sentence to say |
| --- | --- | --- |
| 0:00–0:30 | Open `/`; select Customer and enter the customer app | “This is a pre-launch concept demo with fictional sample data and no confirmed bank arrangement.” |
| 0:30–1:15 | Open Explore; choose Smartphone 128 GB; choose Buy with PENETIX Pay | “The app puts the monthly amount beside the total repayable so the cost is clear.” |
| 1:15–2:00 | Switch between 3 and 12 months; open the calculation explanation and schedule | “Every amount comes from the same calculation engine, and these rates are editable demo assumptions.” |
| 2:00–2:30 | Continue to checkout; acknowledge simulation; submit | “This decision is simulated on a fictional profile and is not made by any bank.” |
| 2:30–3:15 | Use the role switcher for Merchant; open Offers; choose a product, review net settlement, then consent and publish | “A merchant participates voluntarily and sees every fee and the net amount before publishing.” |
| 3:15–4:15 | Switch to Bank; open Simulator; change probability of default and funding cost | “Gross revenue is separate from contribution after costs, and the waterfall updates from the assumptions.” |
| 4:15–5:00 | Open Bank Readiness and show the first three answers and checklist | “There are zero confirmed live users and merchant commitments, and real risk is unknown without portfolio data.” |

## Ten-minute deep dive

| Time | Exact action | One sentence to say |
| --- | --- | --- |
| 0:00–1:00 | Reset at `/`; select the Active plan sample profile; open Customer | “Reset restores the same sample state, and the presenter controls change the demo clock and failures.” |
| 1:00–2:00 | Explore a product; compare all terms in Choose your plan; change down payment | “A shorter plan can have a higher monthly payment while a longer plan can cost more overall.” |
| 2:00–3:00 | Open Find My Deal; choose a product; set a total-cost limit and duration; compare offers | “These are voluntary sample offers ranked by the displayed total financed cost, with over-limit offers kept visible.” |
| 3:00–4:00 | Open Payments; inspect principal outstanding and total remaining; open early repayment | “Principal outstanding differs from unpaid instalments because those instalments include scheduled interest.” |
| 4:00–5:00 | Switch to Merchant; open Orders; inspect one order; use its enabled next action | “Order actions follow a state machine, and every simulated transition records an audit event.” |
| 5:00–6:00 | Open Offers; edit price and delivery terms; inspect net settlement; acknowledge and publish | “The settlement preview itemises the merchant fee and any subsidy before the merchant consents.” |
| 6:00–7:00 | Open Settlements and Disputes; inspect the refund policy and adjustment before resolving | “The displayed sample policy states whether the merchant fee is returned and how a refund changes settlement.” |
| 7:00–8:00 | Switch to Bank; open Applications; inspect a fictional profile and simulate an override | “This demonstrates proposed bank control without representing a real underwriting decision.” |
| 8:00–9:00 | Open Simulator; choose Conservative; save a scenario; choose Stress; compare and export CSV | “The comparison and export preserve assumptions, and every result is hypothetical rather than a forecast.” |
| 9:00–10:00 | Open Portfolio, then Readiness; inspect reproducible loss results and the proposed diagram | “Pilot controls and architecture are proposals requiring banking, legal, operational, and independent review.” |

When demonstrating a failure, enable Simulate error in the presenter bar, trigger a supported service action, show its retry message, and turn the toggle off before continuing. Do not describe an unavailable or unverified feature as implemented; consult `FEATURE_STATUS.md` before a presentation.
