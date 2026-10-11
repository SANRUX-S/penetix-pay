# Financial model for the PENETIX Pay concept app

All rates, fees and risk assumptions are editable demonstration inputs. No bank has agreed to any commercial term. PENETIX supplies the proposed technology; a future partner bank would supply lending capital and control underwriting. These calculations do not model a live loan or actual credit risk.

The pure TypeScript engine is exported from `src/domain/index.ts`. React components, services and mock route handlers use these functions. Domain code performs no network or storage operations. Monetary amounts are safe integer cents of LKR; `decimal.js` performs rate multiplication, division, powers and half-up rounding with 40 significant digits. Conversion back to a JavaScript number occurs only for an integer-cent result or a displayed percentage.

## Customer finance

For price `P`, down-payment percentage `d`, processing-fee percentage `f`, annual reducing-balance percentage `r` and number of monthly instalments `n`:

```
down payment D = roundHalfUp(P × d / 100)
base principal B = P − D
processing fee C = roundHalfUp(B × f / 100)
financed principal F = B + C for capitalised fees; otherwise B
monthly rate i = r / 1200
EMI = F × i × (1+i)^n / ((1+i)^n − 1)
EMI = F / n when i = 0
```

EMI is rounded half up to a cent. Each row rounds `opening balance × i` to a cent, then allocates payment to that interest and principal. The last instalment is outstanding principal plus that row's interest, which absorbs the rounding residual and leaves exactly zero. For tiny amounts that would round a preceding principal payment above the outstanding balance, the payment clears only the remaining principal; subsequent empty rows are zero. There are no negative balances.

```
total interest = sum of row interest
total repayable = sum of row payments = F + total interest
total customer cost = down payment + upfront fee + total repayable
cost of credit = processing fee + total interest
```

A capitalised fee is already inside `F`, so it is not charged again outside the repayments. This resolves the brief's generic `down payment + processing fee + total repayable` wording for capitalised treatment; that wording is correct for upfront treatment. In either case `total customer cost − product price = cost of credit`.

The engine permits terms from 1 to 120 months, annual rates from 0 to 1200%, and down payments from 0 to 100%. These broad numeric limits support boundary tests; the app presents 3, 6, 9 and 12 months with narrower editable demo policy bounds. Product minimum prices and permitted customer down-payment bounds are product policy, not changes to the EMI formula.

## Effective annual cost

The monthly IRR `m` solves the net-present-value equation for `[initial proceeds, −payment_1, …, −payment_n]`. Initial proceeds are `B − C` for an upfront fee and `B` for a capitalised fee. A monotone bisection solver finds the root with decimal arithmetic.

```
nominal annual cost (%) = 12 × m × 100
effective annual cost (%) = ((1+m)^12 − 1) × 100
```

The UI labels this “Effective annual cost (demo calculation)”. It does not label it APR. The applicable regulatory definition and disclosures must be confirmed with qualified legal and banking advisers before real use. A zero-financed plan has no credit cash flows and shows zero calculated cost. Internal sensitivity calculations may omit this IRR step because they display contribution rather than an effective cost figure.

## Dates and early repayment

Calendar dates use validated `YYYY-MM-DD` values. Each due date is acceptance plus the row's calendar-month offset, clamped to the destination month's final day. The original acceptance day remains the anchor: 31 January → 28/29 February → 31 March. There is no holiday adjustment. Display formatting uses `Intl.DateTimeFormat` with `Asia/Colombo` and Western digits.

For a settlement date on or after the last paid instalment's due date (acceptance date when none are paid):

```
accrued interest = roundHalfUp(outstanding principal × annual rate / 1200 × elapsed days / 30)
settlement = outstanding principal + accrued interest + demo settlement fee
interest saved = scheduled remaining interest − accrued interest
total remaining = sum of unpaid scheduled instalments
```

This actual-days/30 convention is deliberately simplified, with no compounding. Savings remain signed; a long delay can exceed the scheduled remaining interest. A fully repaid plan has zero settlement and does not incur an extra settlement charge. The fee defaults to zero. Late fees and grace periods default to off in the demo and do not alter this base amortisation schedule.

An educational `flatComparison` returns interest `F × annual rate × n / 12 / 100` and a separate flat repayment total. It is a comparison, not an available offer.

## Merchant settlement and refunds

```
merchant fee = roundHalfUp(price × merchant fee % / 100) + flat fee
net settlement = price − merchant fee − delivery subsidy
PENETIX share = roundHalfUp(merchant fee × PENETIX split % / 100)
bank share = merchant fee − PENETIX share
```

The invariant is `net settlement + merchant fee + delivery subsidy = price`, with subsidy itemised separately. The bank share receives any split rounding residual, so `PENETIX share + bank share = merchant fee` exactly. A configuration whose fees and subsidy exceed price is rejected.

For a full refund after a settlement was paid, merchant debit is `net settlement + retained merchant fee`. Returning the fee makes that debit the net settlement; retaining it makes the final merchant position minus the fee. For a pending settlement, the net payment is cancelled and only any retained fee becomes an additional debit. Subsidy reversal is a separate item. These are configurable sample policy calculations, not an assertion about any merchant contract.

## Bank unit economics

PD and LGD are percentages supplied by the presenter. EAD is financed principal by default, with an optional average of monthly opening balances. The expected interest adjustment is a documented simplification that applies a single whole-term PD to all scheduled interest.

```
gross interest = scheduled total interest
expected interest = roundHalfUp(gross interest × (1 − PD/100))
funding cost = roundHalfUp(sum(opening balances) × funding rate / 1200)
ECL = roundHalfUp(EAD × PD/100 × LGD/100)
operating cost = fixed amount + roundHalfUp(F × variable cost % / 100)
gross revenue = gross interest + bank merchant-fee share
contribution = expected interest + bank merchant-fee share − funding − ECL − operating
```

Funding is aggregated with decimal precision and rounded once, rather than individually rounding monthly funding costs. PENETIX commission is itemised separately and already excluded from the bank merchant-fee share; subtracting it again would count the same cost twice. Gross revenue and contribution are different measures.

Ignoring cent rounding, the closed-form break-even PD is:

```
100 × (gross interest + bank fee share − funding − operating)
    / (gross interest + EAD × LGD/100)
```

A negative threshold indicates the transaction is already loss-making at zero PD. A threshold above 100% indicates contribution remains positive throughout the feasible PD range. If the denominator is zero, the display convention is 100% for a nonnegative constant contribution and 0% otherwise. Cent rounding can leave a one-cent difference at the algebraic threshold.

Break-even customer rate uses a bisection search over 0–1200%, recomputing the amortisation and every cost at each trial. The result is zero when contribution is already nonnegative at zero rate and `null` when the search range has no nonnegative result. Results describe the demo assumptions only.

Portfolio totals scale each per-loan monetary block by an integer volume. `sensitivity` recomputes a PD × funding-rate grid with the same engine. `simulatePortfolio` uses a fixed-seed Mulberry32 generator, a PD default threshold and explicitly illustrative delinquency thresholds; it is a demonstration, not a credit model. Repeat calls with the same seed and inputs return identical results. Simulated loss is per-default EAD × LGD times the number of defaults. Expected loss uses EAD × portfolio size × PD × LGD. `portfolioVintage` assigns those simulated defaults uniformly across repayment months using a second deterministic seed. Its expected loss accumulates linearly; exposure follows the scheduled closing balance for loans without a default yet. This is a synthetic allocation illustration, not observed vintage performance or a default timing model. Final cumulative loss reconciles exactly to the portfolio simulation. Base, conservative and stress assumptions are round sample values without a market-data claim.

## Golden vectors and verification

For price Rs. 150,000, 20% down payment, financed Rs. 120,000, 18% p.a. reducing interest and an upfront 1.5% principal-based fee of Rs. 1,800, every supplied currency amount matches exactly:

| Months | Monthly | Final instalment | Interest | Total repayable | Total customer cost | Nominal / effective annual cost |
|---:|---:|---:|---:|---:|---:|---:|
| 3 | 41,205.96 | 41,205.94 | 3,617.86 | 123,617.86 | 155,417.86 | 27.30% / 30.99% |
| 6 | 21,063.03 | 21,063.00 | 6,378.15 | 126,378.15 | 158,178.15 | 23.35% / 26.01% |
| 9 | 14,353.18 | 14,353.17 | 9,178.61 | 129,178.61 | 160,978.61 | 21.77% / 24.08% |
| 12 | 11,001.60 | 11,001.60 | 12,019.20 | 132,019.20 | 163,819.20 | 20.92% / 23.05% |

Percentage tests allow ±0.01 percentage points; currency tests compare exact integer cents.

- Zero rate and Rs. 120,000 principal over 12 months: Rs. 10,000 monthly, no interest.
- Rs. 100,000 at 18% over 12 months: Rs. 9,168 monthly, final Rs. 9,167.99, closing zero.
- The first plan at 12 months immediately after instalment six: outstanding Rs. 62,678.17.
- Bank blocks at 11% funding, 3% PD, 60% LGD and principal EAD: gross interest Rs. 12,019.20; funding Rs. 7,345.06; ECL Rs. 2,160.00; unadjusted subtotal Rs. 2,514.14. Expected-interest adjustment changes contribution before other fees/costs to Rs. 2,153.56.

`tests/unit/finance.test.ts` exercises these golden amounts, effective rates, zero principal, one month, zero/high rates, tiny rounding residuals, capitalised fees, early settlement and leap/year/month boundaries. Fixed-seed fast-check properties establish balance closure, principal/payment conservation, non-increasing row interest and decreasing monthly payments for product-sized principals. Strict decreases are not asserted for sub-cent changes that round to an identical monthly amount. Money formatting is round-tripped over the safe integer range without first converting the whole currency amount to a float.

`tests/unit/domain.test.ts` covers merchant fee conservation and subsidy/refund previews; monotonic contribution as PD, LGD or funding rises; waterfall reconciliation; seeded simulation; expiry, withdrawal, opt-in and tie ranking; every state-table edge and illegal transitions; and personal-identifier rejection. `npm test` executes these tests. Test-run outcomes are recorded in the reality ledger after the app's verification stage.
