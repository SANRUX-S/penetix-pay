import { z } from 'zod';
import { personalDetailsMessage, resemblesPersonalDetails } from '../lib/input-guard';

export const roleSchema = z.enum(['customer', 'merchant', 'bank']);
export type DemoRole = z.infer<typeof roleSchema>;
export const personaSchema = z.enum(['new', 'active', 'conditional', 'declined', 'overdue']);
export const localeSchema = z.enum(['en', 'si', 'ta', 'pseudo']);
const id = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {const date=new Date(`${v}T00:00:00Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===v;}, 'Choose a valid demo date.');
const timestamp = z.string().datetime({ offset: true });
const sample = z.literal(true);
export const moneySchema = z.object({ minor: z.number().int().nonnegative().max(100_000_000_000) }).strict();
const text = z.string().min(1).max(300).refine(value=>!resemblesPersonalDetails(value),personalDetailsMessage);
export const termsSchema = z.object({
  termMonths: z.union([z.literal(3), z.literal(6), z.literal(9), z.literal(12)]),
  downPaymentPct: z.number().min(0).max(100), annualRatePct: z.number().min(0).max(60), feePct: z.number().min(0).max(15),
}).strict();
export type PlanTerms = z.infer<typeof termsSchema>;
export const auditSchema = z.object({ actor: text, role: roleSchema, from: text, to: text, reason: text, timestamp }).strict();
export type AuditEntry = z.infer<typeof auditSchema>;
export const productSchema = z.object({
  id, name: text, categoryId: z.enum(['electronics', 'home', 'lifestyle']), merchantId: id,
  listPrice: moneySchema, warrantyMonths: z.number().int().min(0).max(120), description: text,
  active: z.boolean(), images: z.array(z.string().regex(/^\/products\/[a-z0-9-]+\.svg$/)).min(1).max(3), isSample: sample,
}).strict();
export type Product = z.infer<typeof productSchema>;
export const merchantSchema = z.object({id, displayName: text, participatesInFindMyDeal: z.boolean(), isSample: sample}).strict();
export type Merchant = z.infer<typeof merchantSchema>;
export const offerSchema = z.object({id, productId: id, merchantId: id, price: moneySchema, deliveryFee: moneySchema,
  deliveryDays: z.number().int().min(0).max(60), warrantyMonths: z.number().int().min(0).max(120), validUntil: timestamp,
  withdrawn: z.boolean(), isSample: sample}).strict();
export type Offer = z.infer<typeof offerSchema>;
export const decisionSchema = z.object({outcome:z.enum(['approved','conditional','declined']),reasonCodes:z.array(text).max(8),simulated:z.literal(true)}).strict();
export type SimulatedDecision = z.infer<typeof decisionSchema>;
export const applicationStatusSchema = z.enum(['draft','submitted','under_review','approved','conditionally_approved','declined','accepted','expired','withdrawn']);
export const applicationSchema = z.object({id,productId:id,offerId:id.optional(),terms:termsSchema,status:applicationStatusSchema,
  decision:decisionSchema,createdAt:timestamp,audit:z.array(auditSchema).max(200),isSample:sample}).strict();
export type Application = z.infer<typeof applicationSchema>;
export const orderStatusSchema = z.enum(['placed','financing_pending','merchant_accepted','merchant_rejected','dispatched','delivered','settled','refund_requested','refund_approved','refund_rejected','refunded']);
export const orderSchema = z.object({id,productId:id,applicationId:id,status:orderStatusSchema,createdAt:timestamp,audit:z.array(auditSchema).max(200),isSample:sample}).strict();
export type Order = z.infer<typeof orderSchema>;
export const disputeSchema = z.object({id,orderId:id,status:z.enum(['opened','merchant_responded','resolved_customer','resolved_merchant']),
  reason:text,amount:moneySchema,createdAt:timestamp,audit:z.array(auditSchema).max(200),isSample:sample}).strict();
export type Dispute = z.infer<typeof disputeSchema>;
export const preferencesSchema = z.object({locale:localeSchema,persona:personaSchema,demoDate:dateSchema,
  latency:z.number().int().min(300).max(1500),simulateError:z.boolean(),showFormulas:z.boolean()}).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export const stateSchema = preferencesSchema.extend({role:roleSchema.nullable(),products:z.array(productSchema).max(100),
  merchants:z.array(merchantSchema).max(20),offers:z.array(offerSchema).max(100),applications:z.array(applicationSchema).max(100),
  orders:z.array(orderSchema).max(100),disputes:z.array(disputeSchema).max(100),paidCount:z.number().int().min(0).max(12)}).strict();
export type DemoState = z.infer<typeof stateSchema>;
export const mutationSchema = z.discriminatedUnion('command',[
  z.object({command:z.literal('submitApplication'),productId:id,terms:termsSchema,offerId:id.optional()}).strict(),
  z.object({command:z.literal('acceptApplication'),id}).strict(),
  z.object({command:z.literal('payInstalment')}).strict(),
  z.object({command:z.literal('repayEarly')}).strict(),
  z.object({command:z.literal('updateOrder'),id,next:orderStatusSchema}).strict(),
  z.object({command:z.literal('updateProduct'),product:productSchema}).strict(),
  z.object({command:z.literal('publishOffer'),offer:offerSchema}).strict(),
  z.object({command:z.literal('withdrawOffer'),id}).strict(),
  z.object({command:z.literal('resolveDispute'),id,outcome:z.enum(['resolved_customer','resolved_merchant'])}).strict(),
  z.object({command:z.literal('overrideApplication'),id,outcome:z.enum(['approved','conditional','declined'])}).strict(),
]);
export type Mutation = z.infer<typeof mutationSchema>;
export const commandRequestSchema = z.object({mutation:mutationSchema,state:stateSchema,latency:z.number().int().min(300).max(1500),simulateError:z.boolean()}).strict();
export const commandResponseSchema = z.object({state:stateSchema,resultId:id.optional()}).strict();
export const errorResponseSchema = z.object({error:z.string().min(1).max(300)}).strict();
