import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  formatExactAsDecimal,
  normalizeExact,
  parseDecimalToExact,
  parseSciInputToExact,
  simplifyExact,
  toSuperscript,
} from '../lib/sciMath';
import { ExactNum } from '../types/exercise';
import { DecimalShiftDiagram, SciNumber } from './MathDisplay';

const SCALE_ANCHORS: Array<{ exp: number; title: string; detail: string }> = [
  { exp: -10, title: 'Escala atòmica', detail: 'Diàmetre aproximat d’un àtom d’hidrogen (~1 × 10⁻¹⁰ m).' },
  { exp: -9, title: 'Escala nanomètrica', detail: 'Amplada de la doble hèlix de l’ADN (~2 × 10⁻⁹ m).' },
  { exp: -7, title: 'Virus i nanopartícules', detail: 'Mida típica d’un virus (~1 × 10⁻⁷ m).' },
  { exp: -6, title: 'Cèl·lules i bacteris', detail: 'Diàmetre d’un bacteri o glòbul vermell (~1 a 8 × 10⁻⁶ m).' },
  { exp: -3, title: 'Mil·límetres', detail: 'Gruix d’una targeta o gra de sorra (~1 × 10⁻³ m).' },
  { exp: 0, title: 'Unitats quotidianes', detail: 'Nombres entre 1 i 9,99 sense salts de coma.' },
  { exp: 3, title: 'Milers', detail: 'Metres en un quilòmetre o altitud d’una muntanya (~10³ m).' },
  { exp: 6, title: 'Milions', detail: 'Població d’una gran ciutat o distància continental (~10⁶ m).' },
  { exp: 8, title: 'Velocitat de la llum', detail: 'La llum recorre 3 × 10⁸ metres cada segon al buit.' },
  { exp: 11, title: 'Sistema Solar', detail: 'Distància mitjana de la Terra al Sol (~1,5 × 10¹¹ m).' },
];

function findClosestScaleAnchor(exp: number) {
  let best = SCALE_ANCHORS[0];
  let bestDist = Math.abs(exp - best.exp);
  for (const anchor of SCALE_ANCHORS) {
    const d = Math.abs(exp - anchor.exp);
    if (d < bestDist) {
      best = anchor;
      bestDist = d;
    }
  }
  return best;
}

export const VisualExplorer: React.FC = () => {
  // Interactive Slider Explorer state
  const [mantissaTenths, setMantissaTenths] = useState(34); // 3.4
  const [exponent, setExponent] = useState(4);

  // Free Normalizer state
  const [rawMantissa, setRawMantissa] = useState('450');
  const [rawExp, setRawExp] = useState('3');

  const sliderValue: ExactNum = useMemo(
    () => simplifyExact({ coeff: BigInt(mantissaTenths), exp: exponent - 1 }),
    [mantissaTenths, exponent]
  );

  const customValue = useMemo(
    () => parseSciInputToExact(rawMantissa, rawExp),
    [rawMantissa, rawExp]
  );

  const customNorm = useMemo(
    () => (customValue ? normalizeExact(customValue) : null),
    [customValue]
  );

  const rawMantissaParsed = useMemo(
    () => parseDecimalToExact(rawMantissa),
    [rawMantissa]
  );

  const customShiftSteps = useMemo(() => {
    if (!customValue || !customNorm || customNorm.sign === 0 || !rawMantissaParsed) {
      return null;
    }
    const rawExpNum = parseInt(rawExp.trim(), 10);
    if (Number.isNaN(rawExpNum)) return null;
    const diff = customNorm.exp - rawExpNum;
    if (diff === 0) {
      return 'Aquesta expressió ja compleix 1 ≤ |a| < 10. No cal desplaçar la coma.';
    }
    const dir = diff > 0 ? 'cap a l’esquerra' : 'cap a la dreta';
    const op = diff > 0 ? `sumem ${diff}` : `restem ${Math.abs(diff)}`;
    return `Movem la coma de ${rawMantissa.trim()} ${Math.abs(diff)} ${
      Math.abs(diff) === 1 ? 'posició' : 'posicions'
    } ${dir} fins a ${customNorm.mantissa}, i ${op} a l’exponent (${rawExpNum} → ${customNorm.exp}).`;
  }, [customValue, customNorm, rawMantissaParsed, rawMantissa, rawExp]);

  const anchor = findClosestScaleAnchor(exponent);

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Explorador visual de potències de 10
        </h1>
        <p className="mt-2 text-slate-600 leading-relaxed">
          Mou la mantissa i l’exponent per observar com es desplaça la coma
          decimal, o introdueix qualsevol expressió no estàndard per veure com es
          normalitza pas a pas.
        </p>
      </div>

      {/* Section 1: Interactive Mantissa & Exponent Sandbox */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Notació científica
              </div>
              <div className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900">
                <SciNumber value={sliderValue} />
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs font-medium text-slate-500">
                Format decimal equivalent
              </div>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-semibold text-blue-700 tabular-nums break-all">
                {formatExactAsDecimal(sliderValue)}
              </div>
            </div>
          </div>

          <DecimalShiftDiagram value={sliderValue} />

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-800">{anchor.title}: </span>
            <span className="text-slate-600">{anchor.detail}</span>
          </div>
        </div>

        {/* Control Deck */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <h2 className="font-display text-base font-bold text-slate-900">
            Controls interactius
          </h2>

          {/* Mantissa Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="mantissa-slider" className="font-medium text-slate-700">
                Mantissa (a)
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {(mantissaTenths / 10).toFixed(1).replace('.', ',')}
              </span>
            </div>
            <input
              id="mantissa-slider"
              type="range"
              min={10}
              max={99}
              step={1}
              value={mantissaTenths}
              onChange={(e) => setMantissaTenths(Number(e.target.value))}
              className="w-full accent-blue-700 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>1,0</span>
              <span>5,0</span>
              <span>9,9</span>
            </div>
          </div>

          {/* Exponent Slider & Stepper */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="exp-slider" className="font-medium text-slate-700">
                Exponent (n)
              </label>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExponent((e) => Math.max(-9, e - 1))}
                  aria-label="Disminuir exponent"
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-mono font-semibold text-blue-700 tabular-nums">
                  {exponent}
                </span>
                <button
                  type="button"
                  onClick={() => setExponent((e) => Math.min(9, e + 1))}
                  aria-label="Augmentar exponent"
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <input
              id="exp-slider"
              type="range"
              min={-9}
              max={9}
              step={1}
              value={exponent}
              onChange={(e) => setExponent(Number(e.target.value))}
              className="w-full accent-blue-700 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>10⁻⁹</span>
              <span>10⁰</span>
              <span>10⁹</span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Exemples ràpids
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '4,5 × 10⁻⁴', m: 45, e: -4 },
                { label: '3,0 × 10⁸', m: 30, e: 8 },
                { label: '7,5 × 10⁻⁶', m: 75, e: -6 },
                { label: '1,2 × 10⁵', m: 12, e: 5 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setMantissaTenths(preset.m);
                    setExponent(preset.e);
                  }}
                  className="px-2.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Normalizer */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Normalitzador d’expressions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Introdueix un nombre qualsevol (per exemple{' '}
            <span className="font-mono">450 × 10³</span> o{' '}
            <span className="font-mono">0,025 × 10⁻²</span>) per obtenir-ne la
            forma científica estàndard i el format decimal.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="inline-flex items-center gap-2 font-mono">
            <input
              type="text"
              value={rawMantissa}
              onChange={(e) => setRawMantissa(e.target.value)}
              aria-label="Mantissa inicial"
              className="w-32 h-11 px-3 text-center text-lg font-semibold bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
            />
            <span className="text-slate-500 text-lg">×</span>
            <span className="text-xl font-semibold text-slate-900">10</span>
            <input
              type="text"
              value={rawExp}
              onChange={(e) => setRawExp(e.target.value)}
              aria-label="Exponent inicial"
              className="w-20 h-10 px-2 text-center text-base font-semibold bg-white border border-slate-300 rounded-md -translate-y-2 focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="hidden md:block text-slate-400 font-mono text-xl">=</div>

          {customValue && customNorm ? (
            <div className="flex flex-wrap items-baseline gap-6">
              <div>
                <div className="text-xs text-slate-500">Notació científica</div>
                <div className="text-2xl font-bold text-slate-900">
                  <SciNumber value={customValue} />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Format decimal</div>
                <div className="font-mono text-lg font-semibold text-slate-700 tabular-nums">
                  {formatExactAsDecimal(customValue)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-700 font-medium">
              Introdueix una mantissa decimal vàlida i un exponent enter (ex: 450 i 3).
            </div>
          )}
        </div>

        {customShiftSteps && customNorm && (
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Explicació: </span>
            {customShiftSteps} (Resultat:{' '}
            <span className="font-mono font-semibold text-blue-700">
              {customNorm.mantissa} × 10{toSuperscript(customNorm.exp)}
            </span>
            ).
          </p>
        )}
      </section>
    </div>
  );
};
