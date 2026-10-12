import {createIntent,transition,type Intent,type AuditRecord} from './core';

/**
 * Developer-only Rs. 10 end-to-end sandbox walk-through. No cards, money,
 * banking connections, persisted account or customer information are touched.
 */
export function simulateTenRupeePayment():{intent:Intent;history:AuditRecord[];simulated:true;moneyMoved:false}{
  const clock='2026-10-12T04:00:00.000Z';
  let intent=createIntent({
    merchantId:'11111111-1111-4111-8111-111111111111',
    merchantReference:'TEST-RS10',
    idempotencyKey:'22222222-2222-4222-8222-222222222222',
    currency:'LKR',
    amountMinor:1000,
  },'33333333-3333-4333-8333-333333333333',clock);
  const history:AuditRecord[]=[];
  const events=[
    ['submit_to_bank','merchant_api',undefined],
    ['bank_approve','bank_adapter',undefined],
    ['submit_settlement','settlement_adapter',undefined],
    ['bank_settlement_confirmed','bank_adapter','SANDBOX-ONLY-001'],
  ] as const;
  events.forEach(([event,actor,ref],i)=>{
    const result=transition(intent,event,actor,`44444444-4444-4444-8444-${String(i+1).padStart(12,'0')}`,clock,ref);
    intent=result.intent;history.push(result.audit);
  });
  return {intent,history,simulated:true,moneyMoved:false};
}
