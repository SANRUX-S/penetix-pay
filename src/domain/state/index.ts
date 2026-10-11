export const transitions = {
  application: {
    draft: ['submitted', 'withdrawn'],
    submitted: ['under_review', 'withdrawn'],
    under_review: ['approved', 'conditionally_approved', 'declined'],
    approved: ['accepted', 'expired', 'withdrawn'],
    conditionally_approved: ['accepted', 'declined', 'withdrawn'],
    declined: [], accepted: [], expired: [], withdrawn: [],
  },
  order: {
    placed: ['financing_pending', 'refund_requested'],
    financing_pending: ['merchant_accepted', 'merchant_rejected', 'refund_requested'],
    merchant_accepted: ['dispatched', 'merchant_rejected', 'refund_requested'],
    merchant_rejected: ['refunded'],
    dispatched: ['delivered', 'refund_requested'],
    delivered: ['settled', 'refund_requested'],
    settled: ['refund_requested'],
    refund_requested: ['refund_approved', 'refund_rejected'],
    refund_approved: ['refunded'],
    refund_rejected: ['dispatched', 'delivered', 'settled'],
    refunded: [],
  },
  instalment: { scheduled: ['due', 'settled_early'], due: ['paid', 'overdue', 'settled_early'], overdue: ['paid', 'settled_early'], paid: [], settled_early: [] },
  settlement: { pending: ['scheduled', 'clawed_back'], scheduled: ['paid', 'clawed_back'], paid: ['clawed_back'], clawed_back: [] },
  dispute: { opened: ['merchant_responded'], merchant_responded: ['resolved_customer', 'resolved_merchant'], resolved_customer: [], resolved_merchant: [] },
} as const;

export type StateMachine = keyof typeof transitions;
export interface AuditEntry { actor: string; role: string; from: string; to: string; reason: string; timestamp: string }
export interface AuditContext { actor: string; role: string; reason: string; timestamp: string; audit?: AuditEntry[]; revisedTerms?: boolean }

export function allowedTransitions(kind: StateMachine, current: string): readonly string[] {
  const table = transitions[kind] as Record<string, readonly string[]>;
  return table[current] ?? [];
}

export function transition<T extends string>(kind: StateMachine, current: string, next: T, context?: AuditContext): T {
  if (!allowedTransitions(kind, current).includes(next)) throw new Error(`Illegal ${kind} transition: ${current} → ${next}.`);
  if (kind === 'application' && current === 'conditionally_approved' && next === 'accepted' && context && !context.revisedTerms) {
    throw new Error('Revised terms must be confirmed before accepting the conditional decision.');
  }
  if (context) {
    if (!context.actor.trim() || !context.role.trim() || !context.reason.trim() || !Number.isFinite(Date.parse(context.timestamp))) throw new Error('A transition requires complete audit information.');
    context.audit?.push({ actor: context.actor, role: context.role, from: current, to: next, reason: context.reason, timestamp: context.timestamp });
  }
  return next;
}

/** The caller persists both the returned state and entry as one mock-session operation. */
export function auditedTransition(kind: StateMachine, current: string, next: string, context: AuditContext) {
  const state = transition(kind, current, next, context);
  const entry: AuditEntry = { actor: context.actor, role: context.role, from: current, to: next, reason: context.reason, timestamp: context.timestamp };
  return { state, entry };
}
