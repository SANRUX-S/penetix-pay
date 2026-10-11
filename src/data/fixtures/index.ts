import type { Application, DemoState, Dispute, Merchant, Offer, Order, Product } from '../../services/types';
import { demoTimestamp, todayColombo } from '../../lib/demo-clock';

export const sampleProfile = {id:'sample-aruni',firstName:'Aruni',displayName:'Aruni · fictional sample profile',isSample:true} as const;
export const merchants:Merchant[] = [
  {id:'m1',displayName:'Sample Home Electronics',participatesInFindMyDeal:true,isSample:true},
  {id:'m2',displayName:'Sample Everyday Store',participatesInFindMyDeal:true,isSample:true},
  {id:'m3',displayName:'Sample Living Studio',participatesInFindMyDeal:false,isSample:true},
];
const illustration = (id:string) => ['front','angle','detail'].map(view=>`/products/${id}-${view}.svg`);
export const products:Product[] = [
  {id:'smartphone',name:'Smartphone 128 GB',categoryId:'electronics',merchantId:'m1',listPrice:{minor:15_000_000},warrantyMonths:12,description:'A bright everyday display, generous storage and a clean, simple design. Fictional sample product.',active:true,images:illustration('smartphone'),isSample:true},
  {id:'washing-machine',name:'Front-load washing machine 8 kg',categoryId:'home',merchantId:'m1',listPrice:{minor:18_500_000},warrantyMonths:24,description:'A spacious drum and simple wash settings for your everyday laundry. Fictional sample product.',active:true,images:illustration('washing-machine'),isSample:true},
  {id:'laptop',name:'Everyday laptop 14-inch',categoryId:'electronics',merchantId:'m1',listPrice:{minor:22_500_000},warrantyMonths:12,description:'A slim, portable computer for study, work and daily tasks. Fictional sample product.',active:true,images:illustration('laptop'),isSample:true},
  {id:'headphones',name:'Wireless over-ear headphones',categoryId:'electronics',merchantId:'m2',listPrice:{minor:2_400_000},warrantyMonths:6,description:'Comfortable cushions and a compact fold for listening on the move. Fictional sample product.',active:true,images:illustration('headphones'),isSample:true},
  {id:'refrigerator',name:'Double-door refrigerator 260 L',categoryId:'home',merchantId:'m1',listPrice:{minor:21_000_000},warrantyMonths:24,description:'Thoughtful shelf space for fresh food and a separate freezer. Fictional sample product.',active:true,images:illustration('refrigerator'),isSample:true},
  {id:'office-chair',name:'Adjustable office chair',categoryId:'lifestyle',merchantId:'m3',listPrice:{minor:4_500_000},warrantyMonths:12,description:'A supportive back, adjustable height and a calm, minimal silhouette. Fictional sample product.',active:true,images:illustration('office-chair'),isSample:true},
];
export const offers:Offer[] = [
  {id:'offer-home-phone',productId:'smartphone',merchantId:'m1',price:{minor:14_700_000},deliveryFee:{minor:0},deliveryDays:3,warrantyMonths:12,validUntil:'2027-12-31T18:00:00+05:30',withdrawn:false,isSample:true},
  {id:'offer-everyday-phone',productId:'smartphone',merchantId:'m2',price:{minor:14_500_000},deliveryFee:{minor:150_000},deliveryDays:5,warrantyMonths:18,validUntil:'2027-12-31T18:00:00+05:30',withdrawn:false,isSample:true},
  {id:'offer-home-laptop',productId:'laptop',merchantId:'m1',price:{minor:22_000_000},deliveryFee:{minor:0},deliveryDays:3,warrantyMonths:24,validUntil:'2027-12-31T18:00:00+05:30',withdrawn:false,isSample:true},
];
export const defaultTerms = {termMonths:12 as const,downPaymentPct:20,annualRatePct:18,feePct:1.5};
function audit(from:string,to:string,date:string,role:'customer'|'merchant'|'bank'='customer',reason='Seeded fictional demonstration') {
  return {actor:role==='customer'?'Sample Aruni':role==='merchant'?'Sample merchant':'Fictional bank operator',role,from,to,reason,timestamp:demoTimestamp(date)};
}
export function initialSnapshot(options:Partial<Pick<DemoState,'role'|'persona'|'demoDate'|'locale'|'latency'|'simulateError'|'showFormulas'>> = {}):DemoState {
  const persona=options.persona??'active';
  const date=options.demoDate??todayColombo();
  const active=persona==='active'||persona==='overdue';
  const createdAt='2026-06-12T09:00:00+05:30';
  const decision = persona==='conditional'?'conditional':persona==='declined'?'declined':'approved';
  const applications:Application[] = persona==='new'?[]:[{id:'application-sample',productId:'smartphone',terms:{...defaultTerms},
    status:active?'accepted':decision==='conditional'?'conditionally_approved':'declined',
    decision:{outcome:decision,reasonCodes:decision==='conditional'?['DEMO_HIGHER_DEPOSIT']:decision==='declined'?['DEMO_AFFORDABILITY_LIMIT']:['DEMO_SAMPLE_PROFILE'],simulated:true},
    createdAt,audit:[audit('draft','submitted','2026-06-12'),audit('submitted','under_review','2026-06-12','bank'),audit('under_review',decision==='conditional'?'conditionally_approved':decision==='declined'?'declined':'approved','2026-06-12','bank'),...(active?[audit('approved','accepted','2026-06-12')]:[])],isSample:true}];
  if(active)applications.push({id:'application-review',productId:'laptop',terms:{termMonths:6,downPaymentPct:25,annualRatePct:18,feePct:1.5},status:'under_review',
    decision:{outcome:'conditional',reasonCodes:['DEMO_MANUAL_REVIEW'],simulated:true},createdAt:demoTimestamp(date),audit:[audit('draft','submitted',date),audit('submitted','under_review',date,'bank')],isSample:true});
  const orders:Order[]=active?[{id:'order-sample',productId:'smartphone',applicationId:'application-sample',status:'delivered',createdAt,
    audit:[audit('placed','financing_pending','2026-06-12'),audit('financing_pending','merchant_accepted','2026-06-13','merchant'),audit('merchant_accepted','dispatched','2026-06-14','merchant'),audit('dispatched','delivered','2026-06-16','merchant')],isSample:true}]:[];
  const disputes:Dispute[]=active?[{id:'dispute-sample',orderId:'order-sample',status:'opened',reason:'Sample customer asks to review a delivery charge.',amount:{minor:150_000},createdAt:'2026-06-18T09:00:00+05:30',audit:[],isSample:true}]:[];
  return {role:options.role??null,persona,demoDate:persona==='overdue'?(options.demoDate??'2026-12-20'):date,locale:options.locale??'en',latency:options.latency??300,
    simulateError:options.simulateError??false,showFormulas:options.showFormulas??false,products:structuredClone(products),merchants:structuredClone(merchants),
    offers:structuredClone(offers),applications,orders,disputes,paidCount:active?4:0};
}
