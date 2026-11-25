import React from 'react';
import { DisplayTerm, ExactNum } from '../types/exercise';
import {
  formatExactAsDecimal,
  normalizeExact,
  simplifyExact,
} from '../lib/sciMath';

interface SciNumberProps {
  value: ExactNum;
  className?: string;
}

export const SciNumber: React.FC<SciNumberProps> = ({ value, className = '' }) => {
  const norm = normalizeExact(value);
  if (norm.sign === 0) {
    return <span className={`font-mono tabular-nums ${className}`}>0</span>;
  }

  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`}>
      <span>{norm.mantissa}</span>
      <span className="mx-1.5 text-slate-400 font-normal">×</span>
      <span>10</span>
      <sup className="ml-0.5 text-[0.72em] font-semibold leading-none text-blue-700 -translate-y-[0.38em]">
        {norm.exp}
      </sup>
    </span>
  );
};

interface DisplayTermViewProps {
  term: DisplayTerm;
  className?: string;
}

export const DisplayTermView: React.FC<DisplayTermViewProps> = ({
  term,
  className = '',
}) => {
  if (term.kind === 'decimal') {
    return (
      <span className={`font-mono tabular-nums ${className}`}>
        {formatExactAsDecimal(term.value)}
      </span>
    );
  }

  if (
    term.kind === 'unnormalized_sci' &&
    term.rawMantissa !== undefined &&
    term.rawExp !== undefined
  ) {
    return (
      <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`}>
        <span>{term.rawMantissa}</span>
        <span className="mx-1.5 text-slate-400 font-normal">×</span>
        <span>10</span>
        <sup className="ml-0.5 text-[0.72em] font-semibold leading-none text-blue-700 -translate-y-[0.38em]">
          {term.rawExp}
        </sup>
      </span>
    );
  }

  return <SciNumber value={term.value} className={className} />;
};

interface DecimalShiftDiagramProps {
  value: ExactNum;
}

/**
 * Renders a visual digit-by-digit place-value diagram showing how the decimal comma shifts
 * between the decimal form and standard scientific notation (1 <= |a| < 10).
 */
export const DecimalShiftDiagram: React.FC<DecimalShiftDiagramProps> = ({ value }) => {
  const s = simplifyExact(value);
  const norm = normalizeExact(s);

  if (norm.sign === 0) {
    return null;
  }

  // Only show visual digit grid if total digits needed is reasonable (<= 14 positions)
  const digits = norm.digits;
  const exp = norm.exp;

  if (Math.abs(exp) > 10 || digits.length > 8) {
    return (
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <span>
          Desplaçament de la coma:{' '}
          <strong className="font-mono text-slate-900">
            {Math.abs(exp)} posicions {exp >= 0 ? 'cap a l’esquerra' : 'cap a la dreta'}
          </strong>
          {exp >= 0 ? ' (exponent positiu).' : ' (exponent negatiu).'}
        </span>
      </div>
    );
  }

  // Build ordered cells from highest power of 10 down to lowest needed
  const minPow = Math.min(0, exp - (digits.length - 1));
  const maxPow = Math.max(0, exp);

  const cells: Array<{ pow: number; digit: string; isSig: boolean }> = [];
  for (let p = maxPow; p >= minPow; p--) {
    const idxFromLead = exp - p;
    const ch =
      idxFromLead >= 0 && idxFromLead < digits.length ? digits[idxFromLead] : '0';
    const isSig = idxFromLead >= 0 && idxFromLead < digits.length;
    cells.push({ pow: p, digit: ch, isSig });
  }

  // Original decimal comma sits right after pow === 0 (between pow 0 and pow -1)
  // Scientific notation comma sits right after pow === exp (between pow exp and exp - 1)
  const sciCommaAfterIdx = cells.findIndex((c) => c.pow === exp);
  const decCommaAfterIdx = cells.findIndex((c) => c.pow === 0);

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-600">
          Visualització del desplaçament de la coma
        </span>
        <span className="text-xs font-mono text-slate-600 tabular-nums">
          {exp === 0
            ? '0 salts (ja normalitzat)'
            : `${Math.abs(exp)} ${Math.abs(exp) === 1 ? 'salt' : 'salts'} ${
                exp > 0 ? '← esquerra (+)' : '→ dreta (-)'
              }`}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex items-center gap-1 font-mono text-base tabular-nums">
          {norm.sign < 0 && (
            <span className="px-1.5 py-1 text-slate-700 font-semibold">-</span>
          )}
          {cells.map((cell, idx) => {
            const hasSciComma = idx === sciCommaAfterIdx && idx < cells.length - 1 && digits.length > 1;
            const hasDecComma = idx === decCommaAfterIdx && minPow < 0;
            const isBetweenCommas =
              exp > 0
                ? cell.pow < exp && cell.pow >= 0
                : exp < 0
                ? cell.pow < 0 && cell.pow >= exp
                : false;

            return (
              <React.Fragment key={cell.pow}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-9 flex items-center justify-center rounded-md border text-sm font-semibold ${
                      cell.pow === exp
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : isBetweenCommas
                        ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                        : cell.isSig
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    {cell.digit}
                  </div>
                  <span className="mt-1 text-[10px] text-slate-400">
                    10<sup>{cell.pow}</sup>
                  </span>
                </div>

                {/* Show scientific comma marker and/or decimal comma marker */}
                {(hasSciComma || hasDecComma || (exp > 0 && idx === decCommaAfterIdx)) && (
                  <div className="flex flex-col items-center justify-center px-0.5 self-start pt-1.5">
                    {hasSciComma && (
                      <span
                        title="Coma en notació científica"
                        className="text-blue-700 font-bold text-lg leading-none"
                      >
                        ,
                      </span>
                    )}
                    {hasDecComma && idx !== sciCommaAfterIdx && (
                      <span
                        title="Coma en format decimal"
                        className="text-slate-500 font-bold text-lg leading-none"
                      >
                        ,
                      </span>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span>
          <strong className="font-medium text-blue-700">Casella blava:</strong> primera xifra significativa (1 ≤ a &lt; 10)
        </span>
        {exp !== 0 && (
          <span>
            <strong className="font-medium text-amber-700">Caselles grogues:</strong> posicions recorregudes ({Math.abs(exp)})
          </span>
        )}
      </div>
    </div>
  );
};
