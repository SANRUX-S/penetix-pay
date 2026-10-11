import { transition } from '../../domain';
import { demoTimestamp } from '../../lib/demo-clock';
import { assertSampleInput } from '../../lib/input-guard';
import { commandResponseSchema, mutationSchema, stateSchema, type Application, type AuditEntry, type DemoRole, type DemoState, type Mutation, type Order } from '../types';

const permissions:Record<Mutation['command'],DemoRole[]> = {
  submitApplication:['customer'],acceptApplication:['customer'],payInstalment:['customer'],repayEarly:['customer'],
  updateOrder:['merchant'],updateProduct:['merchant'],publishOffer:['merchant'],withdrawOffer:['merchant'],resolveDispute:['merchant'],overrideApplication:['bank'],
};
const actor=(role:DemoRole)=>role==='customer'?'Sample Aruni':role==='merchant'?'Sample merchant':'Fictional bank operator';
function audit(state:DemoState,from:string,to:string,reason:string):AuditEntry {
  const role=state.role!;
  return {actor:actor(role),role,from,to,reason,timestamp:demoTimestamp(state.demoDate)};
}
function selectedApplication(state:DemoState):Application {
  const application=[...state.applications].reverse().find(item=>item.status==='accepted');
  if(!application) throw new Error('There is no active sample plan.');
  return application;
}
function productFor(state:DemoState,id:string){ const product=state.products.find(item=>item.id===id);if(!product)throw new Error('Sample product was not found.');return product;}
function merchantOrder(state:DemoState,id:string){const order=state.orders.find(item=>item.id===id);if(!order||productFor(state,order.productId).merchantId!=='m1')throw new Error('This sample merchant cannot change this order.');return order;}

export function applyMutation(input:DemoState,mutationInput:Mutation,role:DemoRole) {
  const state=stateSchema.parse(structuredClone(input));
  const mutation=mutationSchema.parse(mutationInput);
  if(state.role!==role||!permissions[mutation.command].includes(role))throw new Error('This demo role cannot perform that action.');
  assertSampleInput(mutation);
  let resultId:string|undefined;
  if(mutation.command==='submitApplication') {
    const product=productFor(state,mutation.productId);
    if(!product.active)throw new Error('This sample product is inactive.');
    if(mutation.offerId){const offer=state.offers.find(item=>item.id===mutation.offerId);if(!offer||offer.withdrawn||offer.productId!==product.id||Date.parse(offer.validUntil)<Date.parse(demoTimestamp(state.demoDate))||!state.merchants.some(m=>m.id===offer.merchantId&&m.participatesInFindMyDeal))throw new Error('This voluntary sample offer is no longer available. Please choose another offer.');}
    const outcome=state.persona==='conditional'?'conditional':state.persona==='declined'?'declined':'approved';
    const status=outcome==='conditional'?'conditionally_approved':outcome==='declined'?'declined':'approved';
    resultId=`application-${state.applications.length+1}`;
    const entry:Application={id:resultId,productId:product.id,...(mutation.offerId?{offerId:mutation.offerId}:{}),terms:mutation.terms,status,
      decision:{outcome,reasonCodes:outcome==='conditional'?['DEMO_HIGHER_DEPOSIT']:outcome==='declined'?['DEMO_AFFORDABILITY_LIMIT']:['DEMO_SAMPLE_PROFILE'],simulated:true},createdAt:demoTimestamp(state.demoDate),
      audit:[audit(state,'draft','submitted','Sample application submitted'),{...audit(state,'submitted','under_review','Fictional rule evaluation'),role:'bank',actor:'Fictional demo decision'},
      {...audit(state,'under_review',status,'Simulated decision on a fictional sample profile'),role:'bank',actor:'Fictional demo decision'}],isSample:true};
    transition('application','draft','submitted');transition('application','submitted','under_review');transition('application','under_review',status);
    state.applications.push(entry);
  } else if(mutation.command==='acceptApplication') {
    const application=state.applications.find(item=>item.id===mutation.id);
    if(!application)throw new Error('Sample application was not found.');
    if(application.offerId){const offer=state.offers.find(o=>o.id===application.offerId);if(!offer||offer.withdrawn||Date.parse(offer.validUntil)<Date.parse(demoTimestamp(state.demoDate)))throw new Error('The sample offer has expired or was withdrawn. Please choose another offer.');}
    if(state.orders.some(item=>item.applicationId===application.id))throw new Error('This sample application already has an order.');
    if(application.status==='conditionally_approved')application.terms.downPaymentPct=Math.max(35,application.terms.downPaymentPct);
    transition('application',application.status,'accepted',{actor:actor(role),role,reason:'Customer accepted sample terms',timestamp:demoTimestamp(state.demoDate),revisedTerms:true});
    application.audit.push(audit(state,application.status,'accepted',application.decision.outcome==='conditional'?'Revised sample down payment accepted':'Sample terms accepted'));
    application.status='accepted';
    resultId=`order-${state.orders.length+1}`;
    const order:Order={id:resultId,productId:application.productId,applicationId:application.id,status:'financing_pending',createdAt:demoTimestamp(state.demoDate),audit:[audit(state,'placed','financing_pending','Sample financing confirmed; no money moves')],isSample:true};
    transition('order','placed','financing_pending');state.orders.push(order);state.paidCount=0;state.persona='active';
  } else if(mutation.command==='payInstalment'||mutation.command==='repayEarly') {
    const application=selectedApplication(state);
    if(state.paidCount>=application.terms.termMonths)throw new Error('This sample plan is already complete.');
    state.paidCount=mutation.command==='repayEarly'?application.terms.termMonths:state.paidCount+1;
    application.audit.push(audit(state,'accepted','accepted',mutation.command==='repayEarly'?'All remaining sample instalments settled early; no money moved':'Next sample instalment paid; no money moved'));
  } else if(mutation.command==='updateOrder') {
    const order=merchantOrder(state,mutation.id);
    transition('order',order.status,mutation.next);order.audit.push(audit(state,order.status,mutation.next,'Sample merchant order action'));order.status=mutation.next;
    if(order.status==='merchant_rejected'){transition('order','merchant_rejected','refunded');order.audit.push(audit(state,'merchant_rejected','refunded','Sample rejected order refund; no money moved'));order.status='refunded';}
  } else if(mutation.command==='updateProduct') {
    if(mutation.product.merchantId!=='m1')throw new Error('This sample merchant can edit its own products.');
    const existing=state.products.findIndex(item=>item.id===mutation.product.id);
    if(existing>=0&&state.products[existing].merchantId!=='m1')throw new Error('This product belongs to another sample merchant.');
    if(existing>=0)state.products[existing]=mutation.product;else state.products.push(mutation.product);
  } else if(mutation.command==='publishOffer') {
    if(mutation.offer.merchantId!=='m1'||productFor(state,mutation.offer.productId).merchantId!=='m1')throw new Error('This sample merchant can offer its own products.');
    if(Date.parse(mutation.offer.validUntil)<=Date.parse(demoTimestamp(state.demoDate)))throw new Error('Choose a validity date after the demo date.');
    if(!state.merchants.find(item=>item.id==='m1')?.participatesInFindMyDeal)throw new Error('This sample merchant has not opted in.');
    const existing=state.offers.findIndex(item=>item.id===mutation.offer.id);
    if(existing>=0&&state.offers[existing].merchantId!=='m1')throw new Error('This offer belongs to another sample merchant.');
    if(existing>=0)state.offers[existing]=mutation.offer;else state.offers.push(mutation.offer);
  } else if(mutation.command==='withdrawOffer') {
    const offer=state.offers.find(item=>item.id===mutation.id&&item.merchantId==='m1');if(!offer)throw new Error('Sample offer was not found.');
    if(state.applications.some(item=>item.offerId===offer.id&&item.status==='accepted'))throw new Error('An accepted sample offer cannot be withdrawn.');offer.withdrawn=true;
  } else if(mutation.command==='resolveDispute') {
    const dispute=state.disputes.find(item=>item.id===mutation.id);if(!dispute)throw new Error('Sample dispute was not found.');merchantOrder(state,dispute.orderId);
    if(dispute.status==='opened'){transition('dispute','opened','merchant_responded');dispute.audit.push(audit(state,'opened','merchant_responded','Sample merchant response'));dispute.status='merchant_responded';}
    transition('dispute',dispute.status,mutation.outcome);dispute.audit.push(audit(state,dispute.status,mutation.outcome,'Simulated resolution; no money moves'));dispute.status=mutation.outcome;
  } else if(mutation.command==='overrideApplication') {
    const application=state.applications.find(item=>item.id===mutation.id);if(!application)throw new Error('Sample application was not found.');
    const next=mutation.outcome==='conditional'?'conditionally_approved':mutation.outcome==='declined'?'declined':'approved';
    if(application.status!=='under_review'&&application.status!=='submitted')throw new Error('A simulated override is available for applications awaiting review. Terminal decisions remain in the audit trail.');
    if(application.status==='submitted'){transition('application','submitted','under_review');application.audit.push(audit(state,'submitted','under_review','Sample bank began manual review'));application.status='under_review';}
    transition('application',application.status,next);application.audit.push(audit(state,application.status,next,'Simulated bank-controlled override'));application.status=next;
    application.decision={outcome:mutation.outcome,reasonCodes:['DEMO_BANK_OVERRIDE'],simulated:true};
  }
  return commandResponseSchema.parse({state,...(resultId?{resultId}:{})});
}
