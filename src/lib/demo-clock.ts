export function todayColombo(): string {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  return ['year','month','day'].map(type => parts.find(part => part.type === type)?.value ?? '').join('-');
}
export function demoTimestamp(date:string):string { return `${date}T09:00:00+05:30`; }
export const featureFlags = { experimental: {findMyDeal: true}, demo: {presenterTools: true, realPayments: false} } as const;
