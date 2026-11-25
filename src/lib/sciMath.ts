import { ExactNum } from '../types/exercise';

/**
 * Removes trailing decimal zeros from BigInt coefficient while adjusting exp.
 */
export function simplifyExact(num: ExactNum): ExactNum {
  if (num.coeff === 0n) {
    return { coeff: 0n, exp: 0 };
  }
  let coeff = num.coeff;
  let exp = num.exp;
  while (coeff % 10n === 0n) {
    coeff /= 10n;
    exp += 1;
  }
  return { coeff, exp };
}

/**
 * Parses a decimal string (accepting both ',' and '.') into an ExactNum.
 * Also supports spaces as thousands separators.
 */
export function parseDecimalToExact(raw: string): ExactNum | null {
  const cleaned = raw.trim().replace(/\s+/g, '').replace(',', '.');
  if (!cleaned) return null;

  // Support optional e/E scientific string just in case
  const sciMatch = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))[eE]([+-]?\d+)$/.exec(cleaned);
  if (sciMatch) {
    const base = parseDecimalToExact(sciMatch[1]);
    const extraExp = parseInt(sciMatch[2], 10);
    if (!base || Number.isNaN(extraExp)) return null;
    return simplifyExact({ coeff: base.coeff, exp: base.exp + extraExp });
  }

  const match = /^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))$/.exec(cleaned);
  if (!match) return null;

  const sign = match[1] === '-' ? -1n : 1n;
  const intPart = match[2] ?? '';
  const fracPart = match[3] ?? match[4] ?? '';
  const combined = intPart + fracPart;
  if (!combined) return null;

  const coeff = sign * BigInt(combined);
  const exp = -fracPart.length;
  return simplifyExact({ coeff, exp });
}

/**
 * Parses mantissa string and integer exponent string into ExactNum.
 */
export function parseSciInputToExact(
  mantissaRaw: string,
  expRaw: string
): ExactNum | null {
  const mantissa = parseDecimalToExact(mantissaRaw);
  if (!mantissa) return null;

  const expClean = expRaw.trim().replace(/\s+/g, '');
  if (!/^[+-]?\d+$/.test(expClean)) return null;

  const expInt = parseInt(expClean, 10);
  if (!Number.isSafeInteger(expInt) || Math.abs(expInt) > 1000) return null;

  return simplifyExact({
    coeff: mantissa.coeff,
    exp: mantissa.exp + expInt,
  });
}

/**
 * Checks whether a raw mantissa string satisfies 1 <= |a| < 10.
 */
export function isStandardMantissaString(mantissaRaw: string): boolean {
  const parsed = parseDecimalToExact(mantissaRaw);
  if (!parsed || parsed.coeff === 0n) return false;
  const norm = normalizeExact(parsed);
  return norm.exp === 0;
}

export interface NormalizedSci {
  sign: 1 | -1 | 0;
  /** Unsigned digit string without decimal point, e.g. "345" */
  digits: string;
  /** Signed Catalan mantissa string, e.g. "-3,45" */
  mantissa: string;
  /** Unsigned Catalan mantissa string, e.g. "3,45" */
  mantissaAbs: string;
  /** Scientific exponent n such that 1 <= |mantissa| < 10 */
  exp: number;
}

/**
 * Normalizes an ExactNum into canonical scientific notation a × 10^n with 1 <= |a| < 10.
 */
export function normalizeExact(input: ExactNum): NormalizedSci {
  const s = simplifyExact(input);
  if (s.coeff === 0n) {
    return {
      sign: 0,
      digits: '0',
      mantissa: '0',
      mantissaAbs: '0',
      exp: 0,
    };
  }

  const sign: 1 | -1 = s.coeff < 0n ? -1 : 1;
  const absDigits = (s.coeff < 0n ? -s.coeff : s.coeff).toString();
  const exp = s.exp + (absDigits.length - 1);

  const mantissaAbs =
    absDigits.length === 1
      ? absDigits
      : `${absDigits[0]},${absDigits.slice(1)}`;
  const mantissa = sign < 0 ? `-${mantissaAbs}` : mantissaAbs;

  return {
    sign,
    digits: absDigits,
    mantissa,
    mantissaAbs,
    exp,
  };
}

/**
 * Formats an ExactNum as a readable Catalan decimal string (with thin space grouping for large/small numbers).
 */
export function formatExactAsDecimal(
  input: ExactNum,
  useGrouping = true
): string {
  const s = simplifyExact(input);
  if (s.coeff === 0n) return '0';

  const neg = s.coeff < 0n;
  const digits = (neg ? -s.coeff : s.coeff).toString();

  let intPart = '';
  let fracPart = '';

  if (s.exp >= 0) {
    intPart = digits + '0'.repeat(s.exp);
  } else {
    const decimalPos = digits.length + s.exp;
    if (decimalPos > 0) {
      intPart = digits.slice(0, decimalPos);
      fracPart = digits.slice(decimalPos);
    } else {
      intPart = '0';
      fracPart = '0'.repeat(-decimalPos) + digits;
    }
  }

  if (useGrouping) {
    if (intPart.length >= 5) {
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    if (fracPart.length >= 5) {
      fracPart = fracPart.replace(/(\d{3})(?=\d)/g, '$1 ');
    }
  }

  const body = fracPart.length > 0 ? `${intPart},${fracPart}` : intPart;
  return neg ? `-${body}` : body;
}

/**
 * Formats an ExactNum as plain-text Catalan scientific notation, e.g. "3,45 × 10^4".
 */
export function formatSciPlainText(input: ExactNum): string {
  const norm = normalizeExact(input);
  if (norm.sign === 0) return '0';
  return `${norm.mantissa} × 10^${norm.exp}`;
}

/**
 * Converts integer exponent to Unicode superscript string for plain-text explanations.
 */
export function toSuperscript(n: number): string {
  const map: Record<string, string> = {
    '-': '⁻',
    '+': '⁺',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return n
    .toString()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('');
}

export function formatSciUnicode(input: ExactNum): string {
  const norm = normalizeExact(input);
  if (norm.sign === 0) return '0';
  return `${norm.mantissa} × 10${toSuperscript(norm.exp)}`;
}

export function compareExact(a: ExactNum, b: ExactNum): -1 | 0 | 1 {
  const sa = simplifyExact(a);
  const sb = simplifyExact(b);
  if (sa.coeff === 0n && sb.coeff === 0n) return 0;

  const minExp = Math.min(sa.exp, sb.exp);
  const aScaled = sa.coeff * 10n ** BigInt(sa.exp - minExp);
  const bScaled = sb.coeff * 10n ** BigInt(sb.exp - minExp);

  if (aScaled < bScaled) return -1;
  if (aScaled > bScaled) return 1;
  return 0;
}

export function addExact(a: ExactNum, b: ExactNum): ExactNum {
  const minExp = Math.min(a.exp, b.exp);
  const aScaled = a.coeff * 10n ** BigInt(a.exp - minExp);
  const bScaled = b.coeff * 10n ** BigInt(b.exp - minExp);
  return simplifyExact({ coeff: aScaled + bScaled, exp: minExp });
}

export function subExact(a: ExactNum, b: ExactNum): ExactNum {
  const minExp = Math.min(a.exp, b.exp);
  const aScaled = a.coeff * 10n ** BigInt(a.exp - minExp);
  const bScaled = b.coeff * 10n ** BigInt(b.exp - minExp);
  return simplifyExact({ coeff: aScaled - bScaled, exp: minExp });
}

export function mulExact(a: ExactNum, b: ExactNum): ExactNum {
  return simplifyExact({ coeff: a.coeff * b.coeff, exp: a.exp + b.exp });
}

/**
 * Exact division for terminating decimal results (supports denominators of form 2^p * 5^q,
 * or falls back cleanly to 6 significant digits if needed).
 */
export function divExact(a: ExactNum, b: ExactNum): ExactNum {
  if (b.coeff === 0n) {
    throw new Error('Divisió per zero');
  }
  if (a.coeff === 0n) {
    return { coeff: 0n, exp: 0 };
  }
  // Scale numerator by 10^12 so terminating divisions up to 12 decimals remain exact
  const scale = 12;
  const scaledNum = a.coeff * 10n ** BigInt(scale);
  const q = scaledNum / b.coeff;
  return simplifyExact({ coeff: q, exp: a.exp - b.exp - scale });
}

/**
 * Scales an ExactNum to be expressed with a specific target power of 10: returned string × 10^targetExp.
 */
export function formatMantissaAtExponent(
  input: ExactNum,
  targetExp: number
): string {
  const s = simplifyExact(input);
  if (s.coeff === 0n) return '0';
  const shifted: ExactNum = { coeff: s.coeff, exp: s.exp - targetExp };
  return formatExactAsDecimal(shifted, false);
}
