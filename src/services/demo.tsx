'use client';
import {createContext,useContext,useEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
import {initialSnapshot} from '../data/fixtures';
import {MockAdapter} from './mock/adapter';
import {preferencesSchema,stateSchema,type Application,type DemoRole,type DemoState,type Offer,type Order,type PlanTerms,type Preferences,type Product,type SimulatedDecision} from './types';
export type {Product,Offer,Application,Order,Merchant,Dispute,PlanTerms,DemoState,DemoRole} from './types';

const SESSION_KEY='penetix-pay:demo-session:v2';
const PREFERENCES_KEY='penetix-pay:preferences:v2';
type ContextValue={state:DemoState;ready:boolean;error:string|null;setPreference:(key:keyof Preferences,value:unknown)=>void;
  switchRole:(role:DemoRole)=>Promise<void>;reset:()=>void;submitApplication:(productId:string,terms:PlanTerms,offerId?:string)=>Promise<Application>;
  acceptApplication:(id:string)=>Promise<Order>;payInstalment:()=>Promise<void>;repayEarly:()=>Promise<void>;
  updateOrder:(id:string,next:Order['status'])=>Promise<void>;updateProduct:(product:Product)=>Promise<void>;publishOffer:(offer:Offer)=>Promise<void>;
  withdrawOffer:(id:string)=>Promise<void>;resolveDispute:(id:string,outcome:'resolved_customer'|'resolved_merchant')=>Promise<void>;
  overrideApplication:(id:string,outcome:SimulatedDecision['outcome'])=>Promise<void>;retry:()=>void;};
const DemoContext=createContext<ContextValue|null>(null);
function preferences(state:DemoState):Preferences{return {locale:state.locale,persona:state.persona,demoDate:state.demoDate,latency:state.latency,simulateError:state.simulateError,showFormulas:state.showFormulas};}
class DemoStore {
  private snapshot:{state:DemoState;ready:boolean;error:string|null}={state:initialSnapshot(),ready:false,error:null};
  private serverSnapshot=this.snapshot;
  private listeners=new Set<()=>void>();
  readonly adapter=new MockAdapter(()=>this.snapshot.state,next=>this.commit(next));
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  getSnapshot=()=>this.snapshot;
  getServerSnapshot=()=>this.serverSnapshot;
  private emit(){this.listeners.forEach(listener=>listener());}
  private setError(error:string|null){this.snapshot={...this.snapshot,error};this.emit();}
  private persist(){
    if(!this.snapshot.ready)return;
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(stateSchema.parse(this.snapshot.state)));localStorage.setItem(PREFERENCES_KEY,JSON.stringify(preferencesSchema.parse(preferences(this.snapshot.state))));}
    catch{/* The demo remains interactive when browser storage is unavailable. */}
  }
  private commit(next:DemoState){this.snapshot={...this.snapshot,state:stateSchema.parse(next)};this.persist();this.emit();}
  hydrate=()=>{
    if(this.snapshot.ready)return;
    let next=this.snapshot.state;
    try{
      const saved=sessionStorage.getItem(SESSION_KEY);
      const savedPreferences=localStorage.getItem(PREFERENCES_KEY);
      const parsedPreferences=savedPreferences?preferencesSchema.safeParse(JSON.parse(savedPreferences)):null;
      const snapshot=saved?stateSchema.safeParse(JSON.parse(saved)):null;
      next=snapshot?.success?snapshot.data:initialSnapshot(parsedPreferences?.success?parsedPreferences.data:{});
    }catch{try{sessionStorage.removeItem(SESSION_KEY);localStorage.removeItem(PREFERENCES_KEY);}catch{}}
    this.snapshot={state:next,ready:true,error:next.simulateError?'Simulated network error. Turn off the presenter error toggle to continue.':null};this.emit();
  };
  setPreference=(key:keyof Preferences,value:unknown)=>{
    const current=this.snapshot.state;
    const parsed=preferencesSchema.safeParse({...preferences(current),[key]:value});
    if(!parsed.success){this.setError(parsed.error.issues[0]?.message??'Choose a valid demo setting.');return;}
    const next=parsed.data;
    if(key==='persona'){
      const seed=initialSnapshot({...next,role:current.role,demoDate:next.persona==='overdue'?'2026-12-20':next.demoDate});
      this.commit({...seed,products:current.products,merchants:current.merchants,offers:current.offers});
    }else this.commit({...current,...next});
    this.setError(next.simulateError?'Simulated network error. Turn off the presenter error toggle to continue.':null);
  };
  reset=()=>{this.commit(initialSnapshot({role:this.snapshot.state.role}));this.setError(null);};
  async run<T>(action:()=>Promise<T>):Promise<T>{this.setError(null);try{return await action();}catch(reason){const message=reason instanceof Error?reason.message:'The sample action failed. Please retry.';this.setError(message);throw reason;}}
  retry=()=>{this.setError(null);if(this.snapshot.state.simulateError)this.setPreference('simulateError',false);};
}
export function DemoProvider({children}:{children:ReactNode}){
  const [store]=useState(()=>new DemoStore());
  const {state,ready,error}=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
  useEffect(()=>store.hydrate(),[store]);
  const adapter=store.adapter;
  const run=<T,>(action:()=>Promise<T>)=>store.run(action);
  const setPreference=store.setPreference;
  const reset=store.reset;
  const value:ContextValue={state,ready,error,setPreference,reset,
    switchRole:role=>run(()=>adapter.switchRole(role)),submitApplication:(productId,terms,offerId)=>run(()=>adapter.submitApplication(productId,terms,offerId)),
    acceptApplication:id=>run(()=>adapter.acceptApplication(id)),payInstalment:()=>run(()=>adapter.payInstalment()),repayEarly:()=>run(()=>adapter.repayEarly()),
    updateOrder:(id,next)=>run(()=>adapter.updateOrder(id,next)),updateProduct:product=>run(()=>adapter.updateProduct(product)),publishOffer:offer=>run(()=>adapter.publishOffer(offer)),
    withdrawOffer:id=>run(()=>adapter.withdrawOffer(id)),resolveDispute:(id,outcome)=>run(()=>adapter.resolveDispute(id,outcome)),overrideApplication:(id,outcome)=>run(()=>adapter.overrideApplication(id,outcome)),
    retry:store.retry,
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
export function useDemo(){const context=useContext(DemoContext);if(!context)throw new Error('The demo service must be inside DemoProvider.');return context;}
