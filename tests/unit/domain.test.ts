import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { allowedTransitions, bankEconomics, calculatePlan, compareDeals, inputGuard, merchantSettlement, portfolioVintage, rankOffers, refundAdjustment, sensitivity, simulatePortfolio, transition, transitions, type AuditEntry, type BankAssumptions, type ComparableOffer, type RankedDeal, type StateMachine } from '../../src/domain';

const input = { priceMinor: 15_000_000, downPaymentPct: 20, annualRatePct: 18, termMonths: 12, feePct: 1.5, acceptedDate: '2026-10-12' };
const assumptions: BankAssumptions = { fundingRatePct: 11, pdPct: 3, lgdPct: 60, fixedCostMinor: 50_000, variableCostPct: 0.5 };
const offer: ComparableOffer = { id: 'a', productId: 'sample-product', merchantId: 'sample-merchant', priceMinor: 15_000_000, deliveryFeeMinor: 20_000, deliveryDays: 3, warrantyMonths: 12, validUntil: '2027-01-01', optedIn: true, withdrawn: false, isSample: true };

describe('merchant settlement conservation', () => {
  it('itemises fee split and delivery subsidy', () => {
    const result = merchantSettlement({ priceMinor: 15_000_000, feePct: 4, flatFeeMinor: 10_000, subsidyMinor: 20_000, penetixSharePct: 30 });
    expect(result).toEqual({ feeMinor: 610_000, netMinor: 14_370_000, penetixMinor: 183_000, bankMinor: 427_000, subsidyMinor: 20_000 });
    expect(result.netMinor + result.feeMinor + result.subsidyMinor).toBe(15_000_000);
    expect(refundAdjustment(result, 15_000_000, true).merchantDebitMinor).toBe(result.netMinor);
    expect(refundAdjustment(result, 15_000_000, false).merchantFeeReturnedMinor).toBe(0);
    expect(refundAdjustment(result, { feeRefunded: true, alreadyPaid: true }).merchantDebitMinor).toBe(result.netMinor);
    expect(refundAdjustment(result, { feeRefunded: false, alreadyPaid: true }).merchantDebitMinor).toBe(result.netMinor + result.feeMinor);
    expect(refundAdjustment(result, { feeRefunded: false, alreadyPaid: false }).merchantDebitMinor).toBe(result.feeMinor);
    expect(refundAdjustment(result, { feeRefunded: true, alreadyPaid: false }).merchantDebitMinor).toBe(0);
    expect(() => merchantSettlement({ priceMinor: 100, feePct: 100, flatFeeMinor: 1, penetixSharePct: 10 })).toThrow();
  });

  it('conserves every cent of merchant fee under percentage rounding', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 100_000_000 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (priceMinor, feePct, penetixSharePct) => {
      const result = merchantSettlement({ priceMinor, feePct, penetixSharePct });
      expect(result.netMinor + result.feeMinor).toBe(priceMinor);
      expect(result.penetixMinor + result.bankMinor).toBe(result.feeMinor);
    }), { numRuns: 150, seed: 150000 });
  });
});

describe('bank cost sensitivity', () => {
  const plan = calculatePlan(input);
  const settlement = merchantSettlement({ priceMinor: input.priceMinor, feePct: 4, penetixSharePct: 30 });
  it('contribution never increases when any risk or funding assumption rises', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 99 }), fc.integer({ min: 0, max: 99 }), fc.integer({ min: 0, max: 99 }), (pdPct, lgdPct, fundingRatePct) => {
      const terms = { ...assumptions, pdPct, lgdPct, fundingRatePct };
      const value = bankEconomics(plan, settlement, terms, { solveRate: false }).contributionMinor;
      for (const key of ['pdPct', 'lgdPct', 'fundingRatePct'] as const) {
        expect(bankEconomics(plan, settlement, { ...terms, [key]: terms[key] + 1 }, { solveRate: false }).contributionMinor).toBeLessThanOrEqual(value);
      }
    }), { numRuns: 120, seed: 118 });
  });

  it('reconciles the full waterfall and average-balance exposure', () => {
    const result = bankEconomics(plan, settlement, assumptions);
    expect(result.contributionMinor).toBe(result.expectedInterestMinor + result.feeIncomeMinor - result.fundingMinor - result.eclMinor - result.operatingMinor);
    expect(result.penetixMinor).toBe(settlement.penetixMinor);
    const average = bankEconomics(plan, settlement, { ...assumptions, eadMode: 'average' });
    expect(average.eadMinor).toBeLessThan(result.eadMinor);
    expect(average.eclMinor).toBeLessThan(result.eclMinor);
    const nearBreakEven = bankEconomics(plan, settlement, { ...assumptions, pdPct: result.breakEvenPdPct }, { solveRate: false });
    expect(Math.abs(nearBreakEven.contributionMinor)).toBeLessThanOrEqual(2);
  });

  it('reproduces seeded simulation and sensitivity exactly', () => {
    const first = simulatePortfolio(plan, assumptions, { seed: 12062026, loans: 1000 });
    expect(first).toEqual(simulatePortfolio(plan, assumptions, { seed: 12062026, loans: 1000 }));
    expect(first.current + first.days1To30 + first.days31To60 + first.days60Plus).toBe(1000);
    expect(first).not.toEqual(simulatePortfolio(plan, assumptions, { seed: 4, loans: 1000 }));
    const vintage = portfolioVintage(plan, assumptions, { seed: 12062026, loans: 1000 });
    expect(vintage).toEqual(portfolioVintage(plan, assumptions, { seed: 12062026, loans: 1000 }));
    expect(vintage.at(-1)?.simulatedLossMinor).toBe(first.simulatedLossMinor);
    expect(vintage.at(-1)?.expectedLossMinor).toBe(first.expectedLossMinor);
    expect(vintage.at(-1)?.exposureMinor).toBe(0);
    expect(vintage.every((row, index) => index === 0 || row.simulatedLossMinor >= vintage[index - 1].simulatedLossMinor)).toBe(true);
    const grid = sensitivity(plan, settlement, assumptions, [0, 3, 10], [8, 11]);
    expect(grid).toHaveLength(6);
    expect(grid[0].contributionMinor).toBeGreaterThan(grid[5].contributionMinor);
  });
});

describe('deal comparison', () => {
  const params = { terms: input, date: '2026-10-12', productId: offer.productId };
  it('handles expiry, withdrawal, opt-in, single offer and no fitting budget', () => {
    const results = rankOffers([offer, { ...offer, id: 'expired', validUntil: '2026-09-01' }, { ...offer, id: 'withdrawn', withdrawn: true }, { ...offer, id: 'private', optedIn: false }], { ...params, limitMinor: 100 });
    expect(results.withinLimit).toHaveLength(0);
    expect(results.overLimit).toHaveLength(1);
    expect(results.overLimit[0].overageMinor).toBe(results.overLimit[0].totalFinancedCostMinor - 100);
    expect(rankOffers([{ ...offer, withdrawn: true }], params).all).toHaveLength(0);
    expect(rankOffers([{ ...offer, validUntil: '2026-01-01' }], params).all).toHaveLength(0);
  });

  it('orders ties by delivery fee, warranty and stable ID', () => {
    const ranked: RankedDeal = { ...offer, monthlyMinor: 1_000_000, totalRepayableMinor: 12_000_000, totalFinancedCostMinor: 15_000_000, overageMinor: 0 };
    expect(compareDeals({ ...ranked, deliveryFeeMinor: 0 }, ranked)).toBeLessThan(0);
    expect(compareDeals({ ...ranked, warrantyMonths: 24 }, ranked)).toBeLessThan(0);
    expect(compareDeals({ ...ranked, id: 'b' }, ranked)).toBeGreaterThan(0);
    expect(compareDeals({ ...ranked, deliveryDays: 1 }, ranked, 'delivery')).toBeLessThan(0);
    expect(compareDeals({ ...ranked, monthlyMinor: 900_000 }, ranked, 'monthly')).toBeLessThan(0);
  });
});

describe('legal state transitions and audit recording', () => {
  it('covers every allowed edge and rejects terminal-state changes', () => {
    for (const [kind, table] of Object.entries(transitions)) {
      for (const [current, nextValues] of Object.entries(table)) {
        for (const next of nextValues) expect(transition(kind as StateMachine, current, next)).toBe(next);
        if (nextValues.length === 0) expect(() => transition(kind as StateMachine, current, 'submitted')).toThrow();
      }
    }
    expect(() => transition('application', 'draft', 'approved')).toThrow();
    expect(() => transition('instalment', 'paid', 'overdue')).toThrow();
    expect(allowedTransitions('order', 'financing_pending')).toContain('merchant_accepted');
  });

  it('records actor, role, reason, time and both states', () => {
    const audit: AuditEntry[] = [];
    const context = { actor: 'sample-customer', role: 'customer', reason: 'Sample confirmation', timestamp: '2026-10-12T10:00:00Z', audit };
    expect(transition('application', 'draft', 'submitted', context)).toBe('submitted');
    expect(audit).toEqual([{ actor: context.actor, role: 'customer', reason: context.reason, timestamp: context.timestamp, from: 'draft', to: 'submitted' }]);
    expect(() => transition('application', 'conditionally_approved', 'accepted', context)).toThrow();
    expect(transition('application', 'conditionally_approved', 'accepted', { ...context, revisedTerms: true })).toBe('accepted');
  });
});

describe('personal-input guard', () => {
  it.each(['123456789V', '123456789x', '199012345678', '4111 1111 1111 1111', '+94 77 123 4567', '0771234567'])('rejects identifier-like text: %s', (text) => expect(inputGuard(text)).toBe(true));
  it.each(['Sample profile', 'Smartphone 128 GB', '150000', 'Sample order PX-0042'])('accepts harmless demo text: %s', (text) => expect(inputGuard(text)).toBe(false));
});
