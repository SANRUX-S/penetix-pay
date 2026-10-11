import type {Application,DemoRole,DemoState,Offer,Order,PlanTerms,Product,SimulatedDecision} from '../types';
export interface CatalogPort { getSnapshot():DemoState; updateProduct(product:Product):Promise<void>; publishOffer(offer:Offer):Promise<void>; withdrawOffer(id:string):Promise<void>; }
export interface FinancingPort { submitApplication(productId:string,terms:PlanTerms,offerId?:string):Promise<Application>;acceptApplication(id:string):Promise<Order>;overrideApplication(id:string,outcome:SimulatedDecision['outcome']):Promise<void>; }
export interface PaymentPort { payInstalment():Promise<void>;repayEarly():Promise<void>; }
export interface SettlementPort {updateOrder(id:string,next:Order['status']):Promise<void>;resolveDispute(id:string,outcome:'resolved_customer'|'resolved_merchant'):Promise<void>;}
export interface IdentityPort {switchRole(role:DemoRole):Promise<void>;}
export interface NotificationPort {notify(message:string):Promise<{simulated:true;message:string}>;}
