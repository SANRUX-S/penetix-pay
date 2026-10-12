import { z } from 'zod';

/**
 * Core payment records. No borrowing or transfer is possible from this module.
 * All amounts are LKR cents (minor units). Production records must be stored
 * transactionally with optimistic locking and a unique idempotency key.
 */
export const paymentRequestSchema = z.object({
  merchantId: z.string().uuid(),
  merchantReference: z.string().regex(/^[A-Za-z0-9_-]{3,64}$/),
  idempotencyKey: z.string().uuid(),
  currency: z.literal('LKR'),
  amountMinor: z.number().int().min(100).max(100_000_000),
}).strict();
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

export const paymentStatusSchema = z.enum([
  'created', 'awaiting_bank', 'bank_approved', 'bank_declined',
  'settlement_pending', 'settled', 'settlement_failed', 'cancelled', 'refunded',
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export const paymentEventSchema = z.enum([
  'submit_to_bank', 'bank_approve', 'bank_decline', 'submit_settlement',
  'bank_settlement_confirmed', 'bank_settlement_failed', 'cancel',
  'bank_refund_confirmed',
]);
export type PaymentEvent = z.infer<typeof paymentEventSchema>;
export type Actor = 'merchant_api' | 'bank_adapter' | 'settlement_adapter' | 'platform_operator';
export type Intent = PaymentRequest & {
  id:string; version:number; status:PaymentStatus; createdAt:string; updatedAt:string;
  providerReference?:string;
};
export type AuditRecord = {
  eventId:string; intentId:string; actor:Actor; event:PaymentEvent;
  before:PaymentStatus; after:PaymentStatus; at:string; providerReference?:string;
};
export type TransitionResult = {intent:Intent; audit:AuditRecord};

type Rule = { from:PaymentStatus[]; to:PaymentStatus; actors:Actor[] };
const rules:Record<PaymentEvent,Rule> = {
  submit_to_bank: {from:['created'],to:'awaiting_bank',actors:['merchant_api']},
  bank_approve: {from:['awaiting_bank'],to:'bank_approved',actors:['bank_adapter']},
  bank_decline: {from:['awaiting_bank'],to:'bank_declined',actors:['bank_adapter']},
  submit_settlement: {from:['bank_approved'],to:'settlement_pending',actors:['settlement_adapter']},
  bank_settlement_confirmed: {from:['settlement_pending'],to:'settled',actors:['bank_adapter','settlement_adapter']},
  bank_settlement_failed: {from:['settlement_pending'],to:'settlement_failed',actors:['bank_adapter','settlement_adapter']},
  cancel: {from:['created','awaiting_bank','bank_approved','bank_declined','settlement_failed'],to:'cancelled',actors:['merchant_api','platform_operator']},
  bank_refund_confirmed: {from:['settled'],to:'refunded',actors:['bank_adapter','settlement_adapter']},
};
export function createIntent(input:unknown, id:string, now:string):Intent {
  const request=paymentRequestSchema.parse(input);
  if(!z.string().uuid().safeParse(id).success)throw new Error('Invalid intent id');
  if(!Number.isFinite(Date.parse(now)))throw new Error('Invalid timestamp');
  return {...request,id,version:1,status:'created',createdAt:now,updatedAt:now};
}
export function transition(input:Intent, event:PaymentEvent, actor:Actor, eventId:string, now:string, providerReference?:string):TransitionResult {
  const rule=rules[event];
  if(!rule.from.includes(input.status))throw new Error('Illegal payment status transition');
  if(!rule.actors.includes(actor))throw new Error('Actor not permitted to perform transition');
  if(!z.string().uuid().safeParse(eventId).success)throw new Error('Invalid event ID');
  if(!Number.isFinite(Date.parse(now)))throw new Error('Invalid timestamp');
  if(providerReference&& !/^[A-Za-z0-9_.:-]{3,128}$/.test(providerReference))throw new Error('Invalid provider reference');
  if(event==='bank_settlement_confirmed'&&!providerReference)throw new Error('Settlement confirmation needs a verified provider reference');
  const intent:Intent={...input,status:rule.to,version:input.version+1,updatedAt:now,...(providerReference?{providerReference}:{})};
  return {intent,audit:{eventId,intentId:input.id,actor,event,before:input.status,after:rule.to,at:now,...(providerReference?{providerReference}:{})}};
}
