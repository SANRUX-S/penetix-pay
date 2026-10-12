import type { Intent } from './core';

/**
 * Future bank adapters implement these server-side contracts after agreement,
 * provider certification and independent review. Never invoke via client roles.
 * Bank decisions are verified using credentials, signatures and replay protection.
 */
export interface BankFinancingAdapter {
  submitForUnderwriting(intent:Intent):Promise<{bankApplicationRef:string;status:'pending'}>;
  getDecision(bankApplicationRef:string):Promise<{outcome:'approved'|'declined'|'pending';eventRef:string}>;
  requestMerchantSettlement(intent:Intent):Promise<{settlementReference:string;status:'pending'}>;
  getSettlementStatus(settlementReference:string):Promise<{status:'settled'|'failed'|'pending';verifiedProviderReference?:string}>;
  requestRefund(intent:Intent):Promise<{refundReference:string;status:'pending'}>;
}
export interface TransactionRepository {
  /** Must be a SERIALIZABLE or appropriately locked DB transaction. */
  createOnce(intent:Intent):Promise<{intent:Intent;wasExisting:boolean}>;
  /** Must reject stale versions and repeated event IDs atomically. */
  recordTransition(next:Intent,eventId:string):Promise<void>;
}
/** All live financing is fail-closed until an approved bank is configured. */
export class BankConnectionUnavailable implements BankFinancingAdapter {
  private unavailable():never {throw new Error('Real financing unavailable: no approved bank integration configured.');}
  async submitForUnderwriting(_intent:Intent):Promise<{bankApplicationRef:string;status:'pending'}>{return this.unavailable();}
  async getDecision(_ref:string):Promise<{outcome:'approved'|'declined'|'pending';eventRef:string}>{return this.unavailable();}
  async requestMerchantSettlement(_intent:Intent):Promise<{settlementReference:string;status:'pending'}>{return this.unavailable();}
  async getSettlementStatus(_ref:string):Promise<{status:'settled'|'failed'|'pending';verifiedProviderReference?:string}>{return this.unavailable();}
  async requestRefund(_intent:Intent):Promise<{refundReference:string;status:'pending'}>{return this.unavailable();}
}
