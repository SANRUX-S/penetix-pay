export const personalDetailsMessage = "Please don't enter real personal or card details in this demo. Use a sample profile.";
export function resemblesPersonalDetails(value: string): boolean {
  const normalized = value.replace(/[\s-]/g, '');
  return /\b\d{9}[vVxX]\b/.test(normalized) || /\d{12}/.test(normalized) || /\d{13,19}/.test(normalized) || /\+?\d{10,11}/.test(normalized);
}
export function assertSampleInput(value: unknown): void {
  if (typeof value === 'string' && resemblesPersonalDetails(value)) throw new Error(personalDetailsMessage);
  if (Array.isArray(value)) value.forEach(assertSampleInput);
  else if (value && typeof value === 'object') for (const [key, entry] of Object.entries(value)) {
    if (['createdAt','timestamp','validUntil','demoDate','images'].includes(key)) continue;
    assertSampleInput(entry);
  }
}
