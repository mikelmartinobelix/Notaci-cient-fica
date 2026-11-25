import React from 'react';

export const QuickGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Guia ràpida de notació científica
        </h1>
        <p className="mt-2 text-slate-600 leading-relaxed">
          Tot el que cal recordar per escriure, comparar i operar amb nombres
          molt grans o molt petits sense perdre el fil dels exponents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="text-xs font-semibold text-blue-700">
            01. Estructura estàndard
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Forma general: a × 10ⁿ
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Un nombre està ben escrit en notació científica quan la{' '}
            <strong className="text-slate-900">mantissa a</strong> té una sola
            xifra diferent de zero davant la coma (és a dir,{' '}
            <span className="font-mono text-slate-900">1 ≤ |a| &lt; 10</span>) i{' '}
            <strong className="text-slate-900">n</strong> és un nombre enter.
          </p>
          <div className="pt-2 space-y-1.5 text-sm font-mono">
            <div className="text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Correcte: 4,75 × 10⁶  |  -2,1 × 10⁻⁴
            </div>
            <div className="text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              No normalitzat: 47,5 × 10⁵  |  0,21 × 10⁻³
            </div>
          </div>
        </article>

        {/* Card 2 */}
        <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="text-xs font-semibold text-blue-700">
            02. Signe de l’exponent
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Nombres grans vs. nombres petits
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Si el nombre original és major o igual que 10, l’exponent és{' '}
            <strong className="text-slate-900">positiu</strong> (la coma es mou
            a l’esquerra). Si és entre 0 i 1, l’exponent és{' '}
            <strong className="text-slate-900">negatiu</strong> (la coma es mou
            a la dreta).
          </p>
          <div className="pt-2 space-y-1.5 text-sm font-mono text-slate-800">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              520 000 = 5,2 × 10⁵  (5 salts ←)
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              0,000 52 = 5,2 × 10⁻⁴  (4 salts →)
            </div>
          </div>
        </article>

        {/* Card 3 */}
        <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="text-xs font-semibold text-blue-700">
            03. Suma i resta
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Primer igualar exponents
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Per sumar o restar, ambdós termes han de tenir exactament la
            mateixa potència de 10. Transforma el terme d’exponent menor perquè
            coincideixi amb el major, opera les mantisses i normalitza si cal.
          </p>
          <div className="pt-2 text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 space-y-1">
            <div>3,2 × 10⁵ + 4 × 10⁴</div>
            <div>= 3,2 × 10⁵ + 0,4 × 10⁵</div>
            <div className="font-semibold text-blue-800">= 3,6 × 10⁵</div>
          </div>
        </article>

        {/* Card 4 */}
        <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="text-xs font-semibold text-blue-700">
            04. Multiplicació i divisió
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Mantisses a banda, exponents a banda
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Multiplica o divideix les mantisses normalment. En les potències de
            10, <strong className="text-slate-900">suma els exponents</strong>{' '}
            si multipliques i <strong className="text-slate-900">resta’ls</strong>{' '}
            si divideixes.
          </p>
          <div className="pt-2 text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 space-y-1">
            <div>(4 × 10³) × (5 × 10⁻⁷) = 20 × 10⁻⁴ = 2 × 10⁻³</div>
            <div>(1,5 × 10⁻²) ÷ (3 × 10⁻⁵) = 0,5 × 10³ = 5 × 10²</div>
          </div>
        </article>
      </div>

      {/* Common Traps Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Errors freqüents que convé vigilar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-slate-900">
              Comparar mirant només la mantissa
            </h3>
            <p className="text-slate-600 leading-relaxed">
              <span className="font-mono text-slate-800">9,2 × 10⁻⁵</span> és
              més petit que{' '}
              <span className="font-mono text-slate-800">1,4 × 10⁻⁴</span>{' '}
              perquè <span className="font-mono">-5 &lt; -4</span>.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-slate-900">
              Oblidar el doble signe menys en dividir
            </h3>
            <p className="text-slate-600 leading-relaxed">
              En calcular{' '}
              <span className="font-mono text-slate-800">10⁻³ ÷ 10⁻⁶</span>,
              l’exponent és <span className="font-mono">-3 - (-6) = +3</span>,
              no -9.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-slate-900">
              Deixar mantisses fora de [1, 10)
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Si obtens <span className="font-mono text-slate-800">0,4 × 10⁶</span>{' '}
              o <span className="font-mono text-slate-800">12 × 10⁴</span>,
              ajusta la coma i l’exponent al pas final.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
