import Decimal from 'decimal.js';

export type Money = { minor: number };
export const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function assertMinor(value: number, name = 'amount'): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be integer cents within the safe range.`);
}

export function roundedMinor(value: Decimal.Value): number {
  const rounded = new D(value).toDecimalPlaces(0, D.ROUND_HALF_UP).toNumber();
  assertMinor(rounded);
  return rounded;
}

export function minorFromMajor(value: Decimal.Value): number {
  return roundedMinor(new D(value).times(100));
}

export const toMinor = minorFromMajor;

export function scaleMinor(minor: number, count: number): number {
  assertMinor(minor);
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('Count must be a non-negative integer.');
  return roundedMinor(new D(minor).times(count));
}

export function percentMinor(value: number, pct: number): number {
  assertMinor(value);
  if (!Number.isFinite(pct)) throw new RangeError('Percentage must be finite.');
  return roundedMinor(new D(value).times(pct).div(100));
}

export function sumMinor(values: readonly number[]): number {
  const total = values.reduce((sum, value) => {
    assertMinor(value);
    return sum.plus(value);
  }, new D(0));
  return roundedMinor(total);
}

/** Formats integer cents without first converting the whole amount to a float. */
export function money(minor: number, locale = 'en-LK', fractionDigits: 0 | 2 = 2): string {
  assertMinor(minor);
  const absolute = new D(minor).abs();
  const displayMinor = fractionDigits === 0 ? absolute.div(100).toDecimalPlaces(0).times(100) : absolute;
  const whole = BigInt(displayMinor.div(100).floor().toFixed(0));
  const formatter = new Intl.NumberFormat(locale, { numberingSystem: 'latn', maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(locale, { numberingSystem: 'latn', minimumFractionDigits: 1 })
    .formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
  const fraction = fractionDigits === 2 ? `${decimal}${displayMinor.mod(100).toFixed(0).padStart(2, '0')}` : '';
  return `Rs. ${minor < 0 ? '-' : ''}${formatter.format(whole)}${fraction}`;
}

export function parseMoney(formatted: string): number {
  const raw = formatted.replace(/^Rs\.\s*/, '').replace(/,/g, '').trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) throw new RangeError('Invalid rupee amount.');
  return minorFromMajor(raw);
}
