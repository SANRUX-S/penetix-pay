import { calculatePlan, type PlanInput } from '../finance';
import { sumMinor } from '../money';

export type DealSort = 'total' | 'monthly' | 'warranty' | 'delivery';
export interface ComparableOffer {
  id: string;
  productId: string;
  merchantId: string;
  priceMinor: number;
  deliveryFeeMinor: number;
  deliveryDays: number;
  warrantyMonths?: number;
  validUntil: string;
  withdrawn: boolean;
  optedIn: boolean;
  isSample: true;
}
export interface RankedDeal extends ComparableOffer { monthlyMinor: number; totalRepayableMinor: number; totalFinancedCostMinor: number; overageMinor: number }

export function compareDeals(a: RankedDeal, b: RankedDeal, sort: DealSort = 'total'): number {
  const primary = sort === 'monthly' ? a.monthlyMinor - b.monthlyMinor : sort === 'warranty' ? (b.warrantyMonths ?? 0) - (a.warrantyMonths ?? 0) : sort === 'delivery' ? a.deliveryDays - b.deliveryDays : a.totalFinancedCostMinor - b.totalFinancedCostMinor;
  return primary || a.deliveryFeeMinor - b.deliveryFeeMinor || (b.warrantyMonths ?? 0) - (a.warrantyMonths ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function rankOffers(offers: readonly ComparableOffer[], input: {
  terms: Omit<PlanInput, 'priceMinor'>;
  date: string;
  limitMinor?: number;
  limitMode?: 'total' | 'monthly';
  sort?: DealSort;
  productId?: string;
}) {
  const now = Date.parse(input.date);
  if (!Number.isFinite(now)) throw new RangeError('Invalid comparison date.');
  const available = offers.filter((offer) => offer.optedIn && !offer.withdrawn && Date.parse(offer.validUntil) >= now && (!input.productId || offer.productId === input.productId));
  const ranked: RankedDeal[] = available.map((offer) => {
    const plan = calculatePlan({ ...input.terms, priceMinor: offer.priceMinor });
    const totalFinancedCostMinor = sumMinor([plan.totalCostMinor, offer.deliveryFeeMinor]);
    const budgetAmount = input.limitMode === 'monthly' ? plan.monthlyMinor : totalFinancedCostMinor;
    const overageMinor = input.limitMinor === undefined ? 0 : Math.max(0, budgetAmount - input.limitMinor);
    return { ...offer, monthlyMinor: plan.monthlyMinor, totalRepayableMinor: plan.totalRepayableMinor, totalFinancedCostMinor, overageMinor };
  }).sort((a, b) => compareDeals(a, b, input.sort));
  return { withinLimit: ranked.filter((offer) => offer.overageMinor === 0), overLimit: ranked.filter((offer) => offer.overageMinor > 0), all: ranked };
}

export function differenceFromHighest(deal: RankedDeal, shown: readonly RankedDeal[]): number {
  const highest = shown.reduce((maximum, offer) => Math.max(maximum, offer.totalFinancedCostMinor), deal.totalFinancedCostMinor);
  return highest - deal.totalFinancedCostMinor;
}
