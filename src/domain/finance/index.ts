import { D, assertMinor, percentMinor, roundedMinor, sumMinor } from '../money';

export interface PlanInput {
  priceMinor: number;
  downPaymentPct: number;
  annualRatePct: number;
  termMonths: number;
  feePct: number;
  feeTreatment?: 'upfront' | 'capitalised';
  acceptedDate: string;
}

export interface ScheduleRow {
  index: number;
  dueDate: string;
  openingMinor: number;
  paymentMinor: number;
  principalMinor: number;
  interestMinor: number;
  balanceMinor: number;
}

export interface Plan {
  input: PlanInput;
  priceMinor: number;
  downPaymentMinor: number;
  baseFinancedMinor: number;
  financedMinor: number;
  feeMinor: number;
  upfrontFeeMinor: number;
  monthlyMinor: number;
  totalInterestMinor: number;
  totalRepayableMinor: number;
  totalCostMinor: number;
  costOfCreditMinor: number;
  nominalCostPct: number;
  effectiveCostPct: number;
  schedule: ScheduleRow[];
}

export function parseDate(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError('Use a calendar date in YYYY-MM-DD form.');
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError('Invalid calendar date.');
  }
  return parsed;
}

export function addMonthsClamped(date: string, months: number): string {
  if (!Number.isInteger(months)) throw new RangeError('Month offset must be an integer.');
  const source = parseDate(date);
  const last = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months + 1, 0));
  const target = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), Math.min(source.getUTCDate(), last.getUTCDate())));
  return target.toISOString().slice(0, 10);
}

export function dateText(date: string, locale = 'en-LK', options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn', ...options, timeZone: 'Asia/Colombo' }).format(parseDate(date));
}

export function daysBetween(first: string, second: string): number {
  return Math.round((parseDate(second).getTime() - parseDate(first).getTime()) / 86_400_000);
}

function validate(input: PlanInput): void {
  assertMinor(input.priceMinor, 'price');
  if (input.priceMinor < 0) throw new RangeError('Price cannot be negative.');
  for (const [name, value] of [['down payment', input.downPaymentPct], ['fee', input.feePct]] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError(`${name} percentage must be from 0 to 100.`);
  }
  if (!Number.isFinite(input.annualRatePct) || input.annualRatePct < 0 || input.annualRatePct > 1200) throw new RangeError('Annual rate must be from 0 to 1200.');
  if (!Number.isInteger(input.termMonths) || input.termMonths < 1 || input.termMonths > 120) throw new RangeError('Term must be from 1 to 120 months.');
  if (input.feeTreatment && !['upfront', 'capitalised'].includes(input.feeTreatment)) throw new RangeError('Unknown fee treatment.');
  parseDate(input.acceptedDate);
}

function monthlyIrr(initialMinor: number, payments: readonly number[]): number {
  if (initialMinor <= 0 || payments.every((payment) => payment === 0)) return 0;
  const total = sumMinor(payments);
  if (total === initialMinor) return 0;
  const npv = (rate: InstanceType<typeof D>) => payments.reduce(
    (value, payment, index) => value.minus(new D(payment).div(new D(1).plus(rate).pow(index + 1))),
    new D(initialMinor),
  );
  let low = new D(0);
  let high = new D(1);
  while (npv(high).lt(0)) high = high.times(2);
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const midpoint = low.plus(high).div(2);
    if (npv(midpoint).lt(0)) low = midpoint;
    else high = midpoint;
  }
  return low.plus(high).div(2).toNumber();
}

export function calculatePlan(input: PlanInput, options: { calculateEffectiveCost?: boolean } = {}): Plan {
  validate(input);
  const treatment = input.feeTreatment ?? 'upfront';
  const downPaymentMinor = percentMinor(input.priceMinor, input.downPaymentPct);
  const baseFinancedMinor = input.priceMinor - downPaymentMinor;
  const feeMinor = percentMinor(baseFinancedMinor, input.feePct);
  if (treatment === 'upfront' && baseFinancedMinor > 0 && feeMinor >= baseFinancedMinor) throw new RangeError('Upfront fee must leave positive loan proceeds for the effective-cost calculation.');
  const upfrontFeeMinor = treatment === 'upfront' ? feeMinor : 0;
  const financedMinor = sumMinor([baseFinancedMinor, treatment === 'capitalised' ? feeMinor : 0]);
  const rate = new D(input.annualRatePct).div(1200);
  const power = new D(1).plus(rate).pow(input.termMonths);
  const emi = rate.isZero() ? new D(financedMinor).div(input.termMonths) : new D(financedMinor).times(rate).times(power).div(power.minus(1));
  const monthlyMinor = roundedMinor(emi);
  const schedule: ScheduleRow[] = [];
  let balance = financedMinor;
  for (let index = 1; index <= input.termMonths; index += 1) {
    const openingMinor = balance;
    const interestMinor = roundedMinor(new D(openingMinor).times(rate));
    const final = index === input.termMonths;
    const principalMinor = final ? openingMinor : Math.min(openingMinor, Math.max(0, monthlyMinor - interestMinor));
    const paymentMinor = sumMinor([principalMinor, interestMinor]);
    balance -= principalMinor;
    schedule.push({ index, dueDate: addMonthsClamped(input.acceptedDate, index), openingMinor, paymentMinor, principalMinor, interestMinor, balanceMinor: balance });
  }
  const totalInterestMinor = sumMinor(schedule.map((row) => row.interestMinor));
  const totalRepayableMinor = sumMinor(schedule.map((row) => row.paymentMinor));
  const totalCostMinor = sumMinor([downPaymentMinor, upfrontFeeMinor, totalRepayableMinor]);
  const initialMinor = treatment === 'upfront' ? baseFinancedMinor - feeMinor : baseFinancedMinor;
  const irr = options.calculateEffectiveCost === false ? 0 : monthlyIrr(initialMinor, schedule.map((row) => row.paymentMinor));
  const nominalCostPct = new D(irr).times(1200).toNumber();
  const effectiveCostPct = new D(1).plus(irr).pow(12).minus(1).times(100).toNumber();
  return { input: { ...input, feeTreatment: treatment }, priceMinor: input.priceMinor, downPaymentMinor, baseFinancedMinor, financedMinor, feeMinor, upfrontFeeMinor, monthlyMinor, totalInterestMinor, totalRepayableMinor, totalCostMinor, costOfCreditMinor: sumMinor([totalInterestMinor, feeMinor]), nominalCostPct, effectiveCostPct, schedule };
}

export function earlySettlement(plan: Plan, paidCount: number, date: string, feeMinor = 0) {
  if (!Number.isInteger(paidCount) || paidCount < 0 || paidCount > plan.schedule.length) throw new RangeError('Invalid paid instalment count.');
  assertMinor(feeMinor, 'settlement fee');
  if (feeMinor < 0) throw new RangeError('Settlement fee cannot be negative.');
  const previousDate = paidCount === 0 ? plan.input.acceptedDate : plan.schedule[paidCount - 1].dueDate;
  const days = daysBetween(previousDate, date);
  if (days < 0) throw new RangeError('Settlement date cannot precede the last paid date.');
  const outstandingMinor = paidCount === 0 ? plan.financedMinor : plan.schedule[paidCount - 1].balanceMinor;
  const remaining = plan.schedule.slice(paidCount);
  const accruedInterestMinor = roundedMinor(new D(outstandingMinor).times(plan.input.annualRatePct).div(1200).times(days).div(30));
  const settlementMinor = outstandingMinor === 0 ? 0 : sumMinor([outstandingMinor, accruedInterestMinor, feeMinor]);
  const interestSavedMinor = sumMinor(remaining.map((row) => row.interestMinor)) - accruedInterestMinor;
  const remainingMinor = sumMinor(remaining.map((row) => row.paymentMinor));
  return { outstandingMinor, accruedInterestMinor, settlementMinor, interestSavedMinor, remainingMinor };
}

export function flatComparison(input: PlanInput) {
  const reducing = calculatePlan(input);
  const flatInterestMinor = roundedMinor(new D(reducing.financedMinor).times(input.annualRatePct).div(100).times(input.termMonths).div(12));
  const flatRepayableMinor = sumMinor([reducing.financedMinor, flatInterestMinor]);
  return { reducing, flatInterestMinor, flatRepayableMinor, flatMonthlyMinor: roundedMinor(new D(flatRepayableMinor).div(input.termMonths)), flatTotalCostMinor: sumMinor([reducing.downPaymentMinor, reducing.upfrontFeeMinor, flatRepayableMinor]) };
}
