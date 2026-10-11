import { calculatePlan, type Plan } from '../finance';
import { D, assertMinor, percentMinor, roundedMinor, scaleMinor, sumMinor } from '../money';
import type { MerchantSettlement } from '../pricing';

export interface BankAssumptions {
  fundingRatePct: number;
  pdPct: number;
  lgdPct: number;
  fixedCostMinor: number;
  variableCostPct: number;
  eadMode?: 'financed' | 'average';
}
export interface BankEconomics {
  grossInterestMinor: number;
  expectedInterestMinor: number;
  grossRevenueMinor: number;
  fundingMinor: number;
  eclMinor: number;
  operatingMinor: number;
  feeIncomeMinor: number;
  penetixMinor: number;
  contributionMinor: number;
  eadMinor: number;
  breakEvenPdPct: number;
  breakEvenRatePct: number | null;
}

function validate(assumptions: BankAssumptions): void {
  assertMinor(assumptions.fixedCostMinor, 'fixed operating cost');
  if (assumptions.fixedCostMinor < 0) throw new RangeError('Fixed operating cost cannot be negative.');
  for (const [name, percentage] of [['PD', assumptions.pdPct], ['LGD', assumptions.lgdPct], ['variable cost', assumptions.variableCostPct], ['funding rate', assumptions.fundingRatePct]] as const) {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new RangeError(`${name} must be from 0 to 100.`);
  }
}

function blocks(plan: Plan, settlement: MerchantSettlement, assumptions: BankAssumptions) {
  const openingSum = sumMinor(plan.schedule.map((row) => row.openingMinor));
  const eadMinor = assumptions.eadMode === 'average' ? roundedMinor(new D(openingSum).div(plan.schedule.length)) : plan.financedMinor;
  const fundingMinor = roundedMinor(new D(openingSum).times(assumptions.fundingRatePct).div(1200));
  const eclMinor = roundedMinor(new D(eadMinor).times(assumptions.pdPct).times(assumptions.lgdPct).div(10_000));
  const expectedInterestMinor = percentMinor(plan.totalInterestMinor, new D(100).minus(assumptions.pdPct).toNumber());
  const operatingMinor = sumMinor([assumptions.fixedCostMinor, percentMinor(plan.financedMinor, assumptions.variableCostPct)]);
  const contributionMinor = sumMinor([expectedInterestMinor, settlement.bankMinor, -fundingMinor, -eclMinor, -operatingMinor]);
  return { grossInterestMinor: plan.totalInterestMinor, expectedInterestMinor, grossRevenueMinor: sumMinor([plan.totalInterestMinor, settlement.bankMinor]), fundingMinor, eclMinor, operatingMinor, feeIncomeMinor: settlement.bankMinor, penetixMinor: settlement.penetixMinor, contributionMinor, eadMinor };
}

export function bankEconomics(plan: Plan, settlement: MerchantSettlement, assumptions: BankAssumptions, options: { solveRate?: boolean } = {}): BankEconomics {
  validate(assumptions);
  const result = blocks(plan, settlement, assumptions);
  const numerator = new D(result.grossInterestMinor).plus(result.feeIncomeMinor).minus(result.fundingMinor).minus(result.operatingMinor);
  const denominator = new D(result.grossInterestMinor).plus(new D(result.eadMinor).times(assumptions.lgdPct).div(100));
  const breakEvenPdPct = denominator.isZero() ? (numerator.gte(0) ? 100 : 0) : numerator.div(denominator).times(100).toNumber();
  let breakEvenRatePct: number | null = null;
  if (options.solveRate !== false) {
    const contributionAt = (annualRatePct: number) => blocks(calculatePlan({ ...plan.input, annualRatePct }, { calculateEffectiveCost: false }), settlement, assumptions).contributionMinor;
    if (contributionAt(0) >= 0) breakEvenRatePct = 0;
    else if (contributionAt(1200) >= 0) {
      let low = new D(0);
      let high = new D(1200);
      for (let iteration = 0; iteration < 36; iteration += 1) {
        const midpoint = low.plus(high).div(2);
        if (contributionAt(midpoint.toNumber()) < 0) low = midpoint;
        else high = midpoint;
      }
      breakEvenRatePct = high.toNumber();
    }
  }
  return { ...result, breakEvenPdPct, breakEvenRatePct };
}

export function portfolioTotals(economics: BankEconomics, volume: number) {
  return {
    loans: volume,
    grossInterestMinor: scaleMinor(economics.grossInterestMinor, volume),
    expectedInterestMinor: scaleMinor(economics.expectedInterestMinor, volume),
    grossRevenueMinor: scaleMinor(economics.grossRevenueMinor, volume),
    fundingMinor: scaleMinor(economics.fundingMinor, volume),
    eclMinor: scaleMinor(economics.eclMinor, volume),
    operatingMinor: scaleMinor(economics.operatingMinor, volume),
    feeIncomeMinor: scaleMinor(economics.feeIncomeMinor, volume),
    penetixMinor: scaleMinor(economics.penetixMinor, volume),
    contributionMinor: scaleMinor(economics.contributionMinor, volume),
    exposureMinor: scaleMinor(economics.eadMinor, volume),
  };
}

export function sensitivity(plan: Plan, settlement: MerchantSettlement, assumptions: BankAssumptions, pdValues: readonly number[], fundingValues: readonly number[]) {
  return pdValues.flatMap((pdPct) => fundingValues.map((fundingRatePct) => ({ pdPct, fundingRatePct, contributionMinor: bankEconomics(plan, settlement, { ...assumptions, pdPct, fundingRatePct }, { solveRate: false }).contributionMinor })));
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function simulatePortfolio(plan: Plan, assumptions: BankAssumptions, options: { seed: number; loans: number }) {
  validate(assumptions);
  if (!Number.isSafeInteger(options.seed)) throw new RangeError('Simulation seed must be a safe integer.');
  if (!Number.isInteger(options.loans) || options.loans < 0 || options.loans > 100_000) throw new RangeError('Simulation loan count must be from 0 to 100,000.');
  const random = seededRandom(options.seed);
  const count = { current: 0, days1To30: 0, days31To60: 0, days60Plus: 0 };
  let defaults = 0;
  for (let index = 0; index < options.loans; index += 1) {
    const draw = random();
    const probability = new D(assumptions.pdPct).div(100).toNumber();
    if (draw < probability) { defaults += 1; count.days60Plus += 1; }
    else if (draw < Math.min(1, probability * 2)) count.days31To60 += 1;
    else if (draw < Math.min(1, probability * 3)) count.days1To30 += 1;
    else count.current += 1;
  }
  const openingSum = sumMinor(plan.schedule.map((row) => row.openingMinor));
  const eadMinor = assumptions.eadMode === 'average' ? roundedMinor(new D(openingSum).div(plan.schedule.length)) : plan.financedMinor;
  const perDefaultLossMinor = percentMinor(eadMinor, assumptions.lgdPct);
  const expectedLossMinor = roundedMinor(new D(eadMinor).times(options.loans).times(assumptions.pdPct).times(assumptions.lgdPct).div(10_000));
  return { ...count, defaults, loans: options.loans, seed: options.seed, expectedLossMinor, simulatedLossMinor: scaleMinor(perDefaultLossMinor, defaults), exposureMinor: scaleMinor(eadMinor, options.loans), isSample: true as const };
}

export function portfolioVintage(plan: Plan, assumptions: BankAssumptions, options: { seed: number; loans: number }) {
  const portfolio = simulatePortfolio(plan, assumptions, options);
  const random = seededRandom(options.seed ^ 0x0F19A6E);
  const allocations = Array<number>(plan.schedule.length).fill(0);
  for (let index = 0; index < portfolio.defaults; index += 1) allocations[Math.floor(random() * allocations.length)] += 1;
  const eadMinor = assumptions.eadMode === 'average' ? roundedMinor(new D(sumMinor(plan.schedule.map((row) => row.openingMinor))).div(plan.schedule.length)) : plan.financedMinor;
  const lossPerDefaultMinor = percentMinor(eadMinor, assumptions.lgdPct);
  let defaultsToDate = 0;
  return plan.schedule.map((row, index) => {
    defaultsToDate += allocations[index];
    return { month: index + 1, expectedLossMinor: roundedMinor(new D(portfolio.expectedLossMinor).times(index + 1).div(plan.schedule.length)), simulatedLossMinor: scaleMinor(lossPerDefaultMinor, defaultsToDate), exposureMinor: scaleMinor(row.balanceMinor, options.loans - defaultsToDate), isSample: true as const };
  });
}

export const scenarioPresets: Record<'base' | 'conservative' | 'stress', BankAssumptions & { isSample: true }> = {
  base: { fundingRatePct: 11, pdPct: 3, lgdPct: 60, fixedCostMinor: 50_000, variableCostPct: 0.5, isSample: true },
  conservative: { fundingRatePct: 14, pdPct: 6, lgdPct: 65, fixedCostMinor: 75_000, variableCostPct: 0.75, isSample: true },
  stress: { fundingRatePct: 18, pdPct: 12, lgdPct: 80, fixedCostMinor: 100_000, variableCostPct: 1, isSample: true },
};
