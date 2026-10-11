export const PERSONAL_DETAILS_MESSAGE = "Please don't enter real personal or card details in this demo. Use a sample profile.";

/** Returns true when text resembles personal identifiers and should be rejected. */
export function inputGuard(text: string): boolean {
  if (/\b\d{9}[vVxX]\b/.test(text)) return true;
  const numberRuns = text.match(/\+?\d(?:[\s()-]*\d){7,}/g) ?? [];
  return numberRuns.some((run) => {
    const digits = run.replace(/\D/g, '');
    return digits.length >= 10 || (run.startsWith('+') && digits.length >= 8);
  });
}

export interface FictionalDecision {
  outcome: 'approved' | 'conditional' | 'declined';
  reasonCodes: string[];
  conditions?: { minimumDownPaymentPct: number }[];
  simulated: true;
}

export function simulateDecision(persona: string, financedMinor: number, downPaymentPct: number): FictionalDecision {
  if (persona === 'declined' || financedMinor > 40_000_000) return { outcome: 'declined', reasonCodes: ['DEMO_AMOUNT_LIMIT'], simulated: true };
  if ((persona === 'conditional' || financedMinor > 20_000_000) && downPaymentPct < 30) return { outcome: 'conditional', reasonCodes: ['DEMO_REVISED_DOWN_PAYMENT'], conditions: [{ minimumDownPaymentPct: 30 }], simulated: true };
  return { outcome: 'approved', reasonCodes: ['DEMO_PROFILE_PATH'], simulated: true };
}
