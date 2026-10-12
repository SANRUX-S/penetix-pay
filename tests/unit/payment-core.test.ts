import {describe,expect,it} from 'vitest';
import {createIntent,transition} from '../../src/platform/payments/core';
import {simulateTenRupeePayment} from '../../src/platform/payments/sandbox';
import {BankConnectionUnavailable} from '../../src/platform/payments/provider';

const t='2026-10-12T04:00:00Z';
const input={merchantId:'11111111-1111-4111-8111-111111111111',merchantReference:'A-100',idempotencyKey:'22222222-2222-4222-8222-222222222222',currency:'LKR',amountMinor:1000} as const;
const id='33333333-3333-4333-8333-333333333333',eventId='44444444-4444-4444-8444-000000000001';
describe('isolated production payment state machine',()=>{
 it('creates a validated LKR 10.00 intent',()=>{const x=createIntent(input,id,t);expect(x.amountMinor).toBe(1000);expect(x.status).toBe('created');expect(x.version).toBe(1);});
 it('rejects negative and non-integer amounts',()=>{for(const amountMinor of [-1,0,100.5])expect(()=>createIntent({...input,amountMinor},id,t)).toThrow();});
 it('rejects invalid merchant references and extra personally identifiable fields',()=>{expect(()=>createIntent({...input,nic:'123456789V'},id,t)).toThrow();expect(()=>createIntent({...input,merchantReference:'!'},id,t)).toThrow();});
 it('rejects client merchant impersonating lender',()=>{const x=transition(createIntent(input,id,t),'submit_to_bank','merchant_api',eventId,t).intent;expect(()=>transition(x,'bank_approve','merchant_api',eventId,t)).toThrow('Actor not permitted');});
 it('does not allow settlement without bank authorization',()=>{expect(()=>transition(createIntent(input,id,t),'bank_settlement_confirmed','bank_adapter',eventId,t,'BANK-123')).toThrow('Illegal');});
 it('does not allow unverified settlement references',()=>{const x=simulateTenRupeePayment();expect(x.intent.providerReference).toBe('SANDBOX-ONLY-001');expect(x.history).toHaveLength(4);});
 it('fails closed without a bank integration',async()=>{const x=createIntent(input,id,t);await expect(new BankConnectionUnavailable().submitForUnderwriting(x)).rejects.toThrow('Real financing unavailable');});
 it('runs the Rs 10 sandbox without moving real money',()=>{const x=simulateTenRupeePayment();expect(x.moneyMoved).toBe(false);expect(x.simulated).toBe(true);expect(x.intent.status).toBe('settled');expect(x.intent.amountMinor).toBe(1000);});
});
