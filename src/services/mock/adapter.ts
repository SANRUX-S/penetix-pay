import {z} from 'zod';
import {initialSnapshot} from '../../data/fixtures';
import {commandResponseSchema,errorResponseSchema,roleSchema,type Application,type DemoRole,type DemoState,type Mutation,type Offer,type Order,type PlanTerms,type Product,type SimulatedDecision} from '../types';
import type {CatalogPort,FinancingPort,IdentityPort,NotificationPort,PaymentPort,SettlementPort} from '../ports';

const sessionResponse=z.object({role:roleSchema,simulated:z.literal(true)}).strict();
export class MockAdapter implements CatalogPort,FinancingPort,PaymentPort,SettlementPort,IdentityPort,NotificationPort {
  constructor(private current:()=>DemoState,private commit:(state:DemoState)=>void){}
  getSnapshot(){return initialSnapshot();}
  async switchRole(role:DemoRole):Promise<void>{
    const response=await fetch('/api/mock/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role}),credentials:'same-origin'});
    if(!response.ok)throw new Error('Demo role switch failed. Please retry.');
    sessionResponse.parse(await response.json());this.commit({...this.current(),role});
  }
  private async command(mutation:Mutation){
    const state=this.current();
    const response=await fetch('/api/mock/command',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
      body:JSON.stringify({mutation,state,latency:state.latency,simulateError:state.simulateError})});
    if(!response.ok){const body=errorResponseSchema.safeParse(await response.json().catch(()=>null));throw new Error(body.success?body.data.error:'The sample action failed. Please retry.');}
    const result=commandResponseSchema.parse(await response.json());this.commit(result.state);return result;
  }
  async submitApplication(productId:string,terms:PlanTerms,offerId?:string):Promise<Application>{const result=await this.command({command:'submitApplication',productId,terms,...(offerId?{offerId}:{})});return result.state.applications.find(item=>item.id===result.resultId)!;}
  async acceptApplication(id:string):Promise<Order>{const result=await this.command({command:'acceptApplication',id});return result.state.orders.find(item=>item.id===result.resultId)!;}
  async payInstalment(){await this.command({command:'payInstalment'});}
  async repayEarly(){await this.command({command:'repayEarly'});}
  async updateOrder(id:string,next:Order['status']){await this.command({command:'updateOrder',id,next});}
  async updateProduct(product:Product){await this.command({command:'updateProduct',product});}
  async publishOffer(offer:Offer){await this.command({command:'publishOffer',offer});}
  async withdrawOffer(id:string){await this.command({command:'withdrawOffer',id});}
  async resolveDispute(id:string,outcome:'resolved_customer'|'resolved_merchant'){await this.command({command:'resolveDispute',id,outcome});}
  async overrideApplication(id:string,outcome:SimulatedDecision['outcome']){await this.command({command:'overrideApplication',id,outcome});}
  async notify(message:string):Promise<{simulated:true;message:string}>{return {simulated:true,message};}
}
