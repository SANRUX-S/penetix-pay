import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { addMonthsClamped, bankEconomics, calculatePlan, earlySettlement, flatComparison, merchantSettlement, money, parseMoney, sumMinor } from '../../src/domain';

const base = { priceMinor: 15_000_000, downPaymentPct: 20, annualRatePct: 18, feePct: 1.5, acceptedDate: '2026-10-12' };
const vectors = [
  { termMonths: 3, monthlyMinor: 4_120_596, finalMinor: 4_120_594, interestMinor: 361_786, repayableMinor: 12_361_786, costMinor: 15_541_786, nominal: 27.30, effective: 30.99 },
  { termMonths: 6, monthlyMinor: 2_106_303, finalMinor: 2_106_300, interestMinor: 637_815, repayableMinor: 12_637_815, costMinor: 15_817_815, nominal: 23.35, effective: 26.01 },
  { termMonths: 9, monthlyMinor: 1_435_318, finalMinor: 1_435_317, interestMinor: 917_861, repayableMinor: 12_917_861, costMinor: 16_097_861, nominal: 21.77, effective: 24.08 },
  { termMonths: 12, monthlyMinor: 1_100_160, finalMinor: 1_100_160, interestMinor: 1_201_920, repayableMinor: 13_201_920, costMinor: 16_381_920, nominal: 20.92, effective: 23.05 },
];

describe('published customer golden vectors', () => {
  it.each(vectors)('matches all currency amounts for $termMonths months', (vector) => {
    const plan = calculatePlan({ ...base, termMonths: vector.termMonths });
    expect(plan.downPaymentMinor).toBe(3_000_000);
    expect(plan.financedMinor).toBe(12_000_000);
    expect(plan.feeMinor).toBe(180_000);
    expect(plan.monthlyMinor).toBe(vector.monthlyMinor);
    expect(plan.schedule.at(-1)?.paymentMinor).toBe(vector.finalMinor);
    expect(plan.totalInterestMinor).toBe(vector.interestMinor);
    expect(plan.totalRepayableMinor).toBe(vector.repayableMinor);
    expect(plan.totalCostMinor).toBe(vector.costMinor);
    expect(Math.abs(plan.nominalCostPct - vector.nominal)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(plan.effectiveCostPct - vector.effective)).toBeLessThanOrEqual(0.01);
  });

  it('matches zero rate, residual cent and early repayment examples', () => {
    const zero = calculatePlan({ ...base, termMonths: 12, annualRatePct: 0, feePct: 0 });
    expect(zero.monthlyMinor).toBe(1_000_000);
    expect(zero.totalInterestMinor).toBe(0);
    expect(zero.effectiveCostPct).toBe(0);
    const hundred = calculatePlan({ ...base, termMonths: 12, priceMinor: 10_000_000, downPaymentPct: 0, feePct: 0 });
    expect(hundred.monthlyMinor).toBe(916_800);
    expect(hundred.schedule.at(-1)?.paymentMinor).toBe(916_799);
    expect(hundred.schedule.at(-1)?.balanceMinor).toBe(0);
    const annual = calculatePlan({ ...base, termMonths: 12 });
    const settled = earlySettlement(annual, 6, annual.schedule[5].dueDate);
    expect(settled.outstandingMinor).toBe(6_267_817);
    expect(settled.accruedInterestMinor).toBe(0);
    expect(settled.settlementMinor).toBe(6_267_817);
    expect(settled.remainingMinor).toBe(sumMinor(annual.schedule.slice(6).map((row) => row.paymentMinor)));
  });

  it('matches bank building blocks without mistaking a subtotal for contribution', () => {
    const plan = calculatePlan({ ...base, termMonths: 12 });
    const settlement = merchantSettlement({ priceMinor: base.priceMinor, feePct: 0, penetixSharePct: 0 });
    const result = bankEconomics(plan, settlement, { fundingRatePct: 11, pdPct: 3, lgdPct: 60, fixedCostMinor: 0, variableCostPct: 0 });
    expect(result.grossInterestMinor).toBe(1_201_920);
    expect(result.fundingMinor).toBe(734_506);
    expect(result.eclMinor).toBe(216_000);
    expect(result.grossInterestMinor - result.fundingMinor - result.eclMinor).toBe(251_414);
    expect(result.expectedInterestMinor).toBe(1_165_862);
    expect(result.contributionMinor).toBe(215_356);
    expect(result.contributionMinor).not.toBe(251_414);
    expect(result.breakEvenRatePct).not.toBeNull();
  });
});

describe('amortisation boundaries', () => {
  it('handles zero finance, one month, zero cents and high rates', () => {
    for (const input of [
      { ...base, termMonths: 12, downPaymentPct: 100 },
      { ...base, termMonths: 1 },
      { ...base, termMonths: 12, priceMinor: 0 },
      { ...base, termMonths: 12, annualRatePct: 1200 },
    ]) {
      const plan = calculatePlan(input);
      expect(plan.schedule.at(-1)?.balanceMinor).toBe(0);
      expect(sumMinor(plan.schedule.map((row) => row.principalMinor))).toBe(plan.financedMinor);
    }
  });

  it('capitalises the processing fee once and includes its financing interest', () => {
    const plan = calculatePlan({ ...base, termMonths: 12, feeTreatment: 'capitalised' });
    expect(plan.financedMinor).toBe(12_180_000);
    expect(plan.upfrontFeeMinor).toBe(0);
    expect(plan.totalCostMinor).toBe(plan.downPaymentMinor + plan.totalRepayableMinor);
    expect(plan.totalCostMinor - plan.priceMinor).toBe(plan.costOfCreditMinor);
    expect(plan.totalInterestMinor).toBeGreaterThan(vectors[3].interestMinor);
  });

  it('clears small principal without creating negative balances', () => {
    const plan = calculatePlan({ ...base, priceMinor: 1, downPaymentPct: 0, annualRatePct: 0, feePct: 0, termMonths: 12 });
    expect(plan.schedule.every((row) => row.balanceMinor >= 0)).toBe(true);
    expect(plan.schedule.at(-1)?.principalMinor).toBe(1);
    expect(plan.totalRepayableMinor).toBe(1);
  });

  it('uses actual days / 30 for accrued interest and preserves signed savings', () => {
    const plan = calculatePlan({ ...base, termMonths: 12 });
    const result = earlySettlement(plan, 6, '2027-04-27', 10_000);
    expect(result.accruedInterestMinor).toBe(47_009);
    expect(result.settlementMinor).toBe(6_324_826);
    expect(() => earlySettlement(plan, 6, '2027-04-11')).toThrow();
    const completed = earlySettlement(plan, 12, plan.schedule[11].dueDate, 10_000);
    expect(completed.settlementMinor).toBe(0);
  });

  it('explains flat-rate costs using the same principal and term', () => {
    const result = flatComparison({ ...base, termMonths: 12 });
    expect(result.flatInterestMinor).toBe(2_160_000);
    expect(result.flatRepayableMinor).toBeGreaterThan(result.reducing.totalRepayableMinor);
  });

  it.each([
    ['2027-01-31', 1, '2027-02-28'], ['2028-01-31', 1, '2028-02-29'],
    ['2028-01-31', 2, '2028-03-31'], ['2028-02-29', 12, '2029-02-28'],
    ['2026-12-31', 1, '2027-01-31'], ['2026-03-31', -1, '2026-02-28'],
  ])('clamps %s + %s months to %s', (date, months, expected) => {
    expect(addMonthsClamped(String(date), Number(months))).toBe(expected);
  });

  it('rejects invalid financial and calendar inputs', () => {
    for (const override of [{ priceMinor: 1.5 }, { downPaymentPct: 101 }, { annualRatePct: -1 }, { termMonths: 0 }, { feePct: -1 }, { acceptedDate: '2026-02-30' }]) {
      expect(() => calculatePlan({ ...base, termMonths: 12, ...override })).toThrow();
    }
  });
});

describe('financial properties', () => {
  it('conserves principal and interest, clears residuals and reduces interest', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 100_000_000 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 1, max: 24 }),
      (priceMinor, downPaymentPct, annualRatePct, termMonths) => {
        const plan = calculatePlan({ ...base, priceMinor, downPaymentPct, annualRatePct, termMonths }, { calculateEffectiveCost: false });
        expect(plan.schedule.at(-1)?.balanceMinor).toBe(0);
        expect(sumMinor(plan.schedule.map((row) => row.principalMinor))).toBe(plan.financedMinor);
        expect(sumMinor(plan.schedule.map((row) => row.paymentMinor))).toBe(plan.financedMinor + plan.totalInterestMinor);
        expect(plan.totalRepayableMinor).toBeGreaterThanOrEqual(plan.financedMinor);
        expect(plan.schedule.every((row, index, rows) => index === 0 || row.interestMinor <= rows[index - 1].interestMinor)).toBe(true);
      },
    ), { numRuns: 120, seed: 12062026 });
  });

  it('strictly reduces rounded monthly payments for product-sized principal as term grows', () => {
    fc.assert(fc.property(fc.integer({ min: 100_000, max: 100_000_000 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 1, max: 23 }), (priceMinor, annualRatePct, termMonths) => {
      const first = calculatePlan({ ...base, priceMinor, annualRatePct, termMonths, downPaymentPct: 0 }, { calculateEffectiveCost: false });
      const next = calculatePlan({ ...base, priceMinor, annualRatePct, termMonths: termMonths + 1, downPaymentPct: 0 }, { calculateEffectiveCost: false });
      expect(next.monthlyMinor).toBeLessThan(first.monthlyMinor);
    }), { numRuns: 100, seed: 812375 });
  });

  it('round-trips large and signed currency amounts without losing cents', () => {
    fc.assert(fc.property(fc.integer({ min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }), (minor) => {
      expect(parseMoney(money(minor))).toBe(minor);
    }), { numRuns: 100, seed: 430 });
    expect(money(15_000_000)).toBe('Rs. 150,000.00');
    expect(money(15_000_050, 'en-LK', 0)).toBe('Rs. 150,001');
  });
});
