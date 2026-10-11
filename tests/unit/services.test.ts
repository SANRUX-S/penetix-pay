import {describe,expect,it} from 'vitest';
import {initialSnapshot,defaultTerms} from '../../src/data/fixtures';
import {applyMutation} from '../../src/services/mock/mutations';
import {stateSchema,preferencesSchema} from '../../src/services/types';
import {resemblesPersonalDetails} from '../../src/lib/input-guard';
describe('demo services and validation',()=>{
  it('validates deterministic fixture snapshots with no customer plan for a new persona',()=>{
    const options={persona:'active' as const,demoDate:'2026-10-12'};
    expect(initialSnapshot(options)).toEqual(initialSnapshot(options));
    expect(stateSchema.parse(initialSnapshot(options)).paidCount).toBe(4);
    expect(initialSnapshot({persona:'new'}).applications).toHaveLength(0);
  });
  it('completes a sample purchase, persists audit entries and records mock payment progress',()=>{
    let state=initialSnapshot({role:'customer',persona:'new',demoDate:'2026-10-12'});
    const submission=applyMutation(state,{command:'submitApplication',productId:'smartphone',terms:defaultTerms},'customer');
    state=submission.state;const applicationId=submission.resultId!;
    expect(state.applications[0].decision.simulated).toBe(true);
    const accepted=applyMutation(state,{command:'acceptApplication',id:applicationId},'customer');
    state=accepted.state;
    expect(state.orders[0].status).toBe('financing_pending');
    state=applyMutation(state,{command:'payInstalment'},'customer').state;
    expect(state.paidCount).toBe(1);
    expect(state.applications[0].audit.at(-1)?.reason).toContain('no money moved');
    state=applyMutation(state,{command:'repayEarly'},'customer').state;
    expect(state.paidCount).toBe(12);
    expect(()=>applyMutation(state,{command:'payInstalment'},'customer')).toThrow('already complete');
  });
  it('revises conditional terms and preserves the decision audit',()=>{
    const initial=initialSnapshot({role:'customer',persona:'conditional'});
    const result=applyMutation(initial,{command:'acceptApplication',id:'application-sample'},'customer');
    expect(result.state.applications[0].terms.downPaymentPct).toBe(35);
    expect(result.state.applications[0].audit.at(-1)?.reason).toContain('Revised');
  });
  it('rejects cross-role commands, inaccessible products and illegal transitions',()=>{
    const merchant=initialSnapshot({role:'merchant'});
    expect(()=>applyMutation(merchant,{command:'submitApplication',productId:'smartphone',terms:defaultTerms},'merchant')).toThrow('role');
    expect(()=>applyMutation(merchant,{command:'updateProduct',product:{...merchant.products[3],name:'Sample edit'}},'merchant')).toThrow('own products');
    expect(()=>applyMutation(merchant,{command:'updateOrder',id:'order-sample',next:'placed'},'merchant')).toThrow('Illegal');
  });
  it('rejects expired and withdrawn offers, including withdrawals before acceptance',()=>{
    let state=initialSnapshot({role:'customer',persona:'new',demoDate:'2026-10-12'});
    state.offers[0].withdrawn=true;
    expect(()=>applyMutation(state,{command:'submitApplication',productId:'smartphone',terms:defaultTerms,offerId:state.offers[0].id},'customer')).toThrow('no longer available');
    state.offers[0].withdrawn=false;state.offers[0].validUntil='2026-01-01T00:00:00+05:30';
    expect(()=>applyMutation(state,{command:'submitApplication',productId:'smartphone',terms:defaultTerms,offerId:state.offers[0].id},'customer')).toThrow('no longer available');
    state.offers[0].validUntil='2027-12-31T00:00:00+05:30';
    const submitted=applyMutation(state,{command:'submitApplication',productId:'smartphone',terms:defaultTerms,offerId:state.offers[0].id},'customer');
    state=submitted.state;state.offers[0].withdrawn=true;
    expect(()=>applyMutation(state,{command:'acceptApplication',id:submitted.resultId!},'customer')).toThrow('expired or was withdrawn');
  });
  it('bank override changes only reviewable applications and appends audit',()=>{
    const initial=initialSnapshot({role:'bank'});
    const result=applyMutation(initial,{command:'overrideApplication',id:'application-review',outcome:'approved'},'bank');
    const application=result.state.applications.find(item=>item.id==='application-review')!;
    expect(application.status).toBe('approved');expect(application.audit.at(-1)?.role).toBe('bank');
    expect(()=>applyMutation(initial,{command:'overrideApplication',id:'application-sample',outcome:'declined'},'bank')).toThrow('awaiting review');
  });
  it('rejects invalid snapshots, preferences and identity-shaped input',()=>{
    expect(stateSchema.safeParse({...initialSnapshot(),paidCount:40}).success).toBe(false);
    const initial=initialSnapshot();
    expect(preferencesSchema.safeParse({locale:'en',persona:'active',demoDate:'2026-02-31',latency:300,simulateError:false,showFormulas:false}).success).toBe(false);
    expect(resemblesPersonalDetails('123456789V')).toBe(true);
    expect(resemblesPersonalDetails('1234 5678 9012 3456')).toBe(true);
    expect(stateSchema.safeParse({...initial,products:[{...initial.products[0],name:'123456789012'}]}).success).toBe(false);
  });
});
