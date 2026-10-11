import { assertMinor, percentMinor, sumMinor } from '../money';

export interface MerchantSettlementInput {
  priceMinor: number;
  feePct: number;
  flatFeeMinor?: number;
  subsidyMinor?: number;
  penetixSharePct: number;
}

export interface MerchantSettlement {
  feeMinor: number;
  netMinor: number;
  penetixMinor: number;
  bankMinor: number;
  subsidyMinor: number;
}

export function merchantSettlement(input: MerchantSettlementInput): MerchantSettlement {
  const flatFeeMinor = input.flatFeeMinor ?? 0;
  const subsidyMinor = input.subsidyMinor ?? 0;
  for (const amount of [input.priceMinor, flatFeeMinor, subsidyMinor]) {
    assertMinor(amount);
    if (amount < 0) throw new RangeError('Merchant amounts cannot be negative.');
  }
  for (const percentage of [input.feePct, input.penetixSharePct]) {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new RangeError('Merchant percentages must be from 0 to 100.');
  }
  const feeMinor = sumMinor([percentMinor(input.priceMinor, input.feePct), flatFeeMinor]);
  const netMinor = input.priceMinor - feeMinor - subsidyMinor;
  if (netMinor < 0) throw new RangeError('Fees and subsidy exceed the merchant price.');
  const penetixMinor = percentMinor(feeMinor, input.penetixSharePct);
  return { feeMinor, netMinor, penetixMinor, bankMinor: feeMinor - penetixMinor, subsidyMinor };
}

export function refundAdjustment(settlement: MerchantSettlement, priceOrOptions: number | { feeRefunded: boolean; alreadyPaid: boolean }, refundFee?: boolean) {
  const options = typeof priceOrOptions === 'number' ? { feeRefunded: refundFee ?? false, alreadyPaid: true } : priceOrOptions;
  if (typeof priceOrOptions === 'number') assertMinor(priceOrOptions);
  const retainedFeeMinor = options.feeRefunded ? 0 : settlement.feeMinor;
  const merchantDebitMinor = sumMinor([options.alreadyPaid ? settlement.netMinor : 0, retainedFeeMinor]);
  return { merchantDebitMinor, refundableFeeMinor: options.feeRefunded ? settlement.feeMinor : 0, merchantFeeReturnedMinor: options.feeRefunded ? settlement.feeMinor : 0, penetixReturnedMinor: options.feeRefunded ? settlement.penetixMinor : 0, bankReturnedMinor: options.feeRefunded ? settlement.bankMinor : 0, netAfterRefundMinor: -retainedFeeMinor, reversedSubsidyMinor: settlement.subsidyMinor };
}
