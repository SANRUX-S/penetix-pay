import {calculatePlan,daysBetween,earlySettlement,type Plan} from './finance';
import {sumMinor,percentMinor} from './money';
export function paymentSummary(plan:Plan,paidCount:number,demoDate:string){
 const paid=plan.schedule.slice(0,paidCount),remaining=plan.schedule.slice(paidCount),next=remaining[0];
 const outstandingMinor=paidCount===0?plan.financedMinor:plan.schedule[paidCount-1]?.balanceMinor??0;
 const previous=paidCount===0?plan.input.acceptedDate:plan.schedule[paidCount-1].dueDate;
 const settlementDate=demoDate<previous?previous:demoDate;
 return {outstandingMinor,remainingMinor:sumMinor(remaining.map(r=>r.paymentMinor)),paidMinor:sumMinor(paid.map(r=>r.paymentMinor)),paidCount,remaining,paid,next,progress:paidCount/plan.schedule.length*100,daysUntilDue:next?daysBetween(demoDate,next.dueDate):0,settlementDate,early:earlySettlement(plan,paidCount,settlementDate)};
}
export function listPlans(priceMinor:number,date:string){return [3,6,9,12].map(termMonths=>calculatePlan({priceMinor,downPaymentPct:20,annualRatePct:18,termMonths,feePct:1.5,acceptedDate:date},{calculateEffectiveCost:false}));}
export function comparePlanPrice(plan:Plan){return plan.totalCostMinor-plan.priceMinor;}
export function toMinor(text:string){const cleaned=text.trim();if(!/^\d+(\.\d{0,2})?$/.test(cleaned))throw new RangeError('Use a positive amount with up to two decimal places.');const [whole,fraction='']=cleaned.split('.');const value=Number(whole)*100+Number(fraction.padEnd(2,'0'));if(!Number.isSafeInteger(value)||value>100000000000)throw new RangeError('Amount is outside demo bounds.');return value;}
export function calendarMonth(date:string){const d=new Date(date+'T00:00:00Z'),year=d.getUTCFullYear(),month=d.getUTCMonth();const start=new Date(Date.UTC(year,month,1)).getUTCDay(),count=new Date(Date.UTC(year,month+1,0)).getUTCDate();return {label:new Intl.DateTimeFormat('en-LK',{month:'long',year:'numeric',timeZone:'Asia/Colombo'}).format(d),start,days:Array.from({length:count},(_,i)=>i+1),dueDay:d.getUTCDate()};}
export function flatRatePreview(plan:Plan){const interest=percentMinor(plan.financedMinor,plan.input.annualRatePct*plan.input.termMonths/12);return {totalRepayableMinor:sumMinor([plan.financedMinor,interest]),totalInterestMinor:interest};}
