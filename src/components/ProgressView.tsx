import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { CATEGORY_LABELS, LEVEL_LABELS } from '../lib/exerciseGenerator';
import { ExerciseCategory, Level, StoredProgress } from '../types/exercise';

interface ProgressViewProps {
  progress: StoredProgress;
  onResetProgress: () => void;
  onStartPractice: (cat: ExerciseCategory, level: Level) => void;
}

const CATEGORIES: ExerciseCategory[] = [
  'compare',
  'find_exponent',
  'add_sub',
  'mul_div',
  'context',
];

const LEVELS: Level[] = [1, 2, 3];

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  onResetProgress,
  onStartPractice,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const accuracy =
    progress.totalAttempted > 0
      ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Progrés de pràctica
          </h1>
          <p className="mt-1 text-slate-600">
            Resum d’encerts per tipologia i nivell desat en aquest navegador.
          </p>
        </div>

        {progress.totalAttempted > 0 && (
          <div>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Reiniciar estadístiques</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs font-medium text-red-900">
                  Esborrar tot l’historial?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Cancel·lar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Exercicis resolts
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {progress.totalAttempted}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Encerts exactes
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
            {progress.totalCorrect}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Precisió global</div>
          <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            {accuracy}%
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Millor ratxa d’encerts
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {progress.bestStreak}
          </div>
        </div>
      </div>

      {/* Matrix by Category and Level */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-bold text-slate-900">
            Rendiment per tipologia i nivell
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Tipologia</th>
                {LEVELS.map((lvl) => (
                  <th key={lvl} className="py-3 px-4">
                    {LEVEL_LABELS[lvl].short} ({LEVEL_LABELS[lvl].title})
                  </th>
                ))}
                <th className="py-3 px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CATEGORIES.map((cat) => {
                const catData = progress.categories[cat];
                const catPct =
                  catData.attempted > 0
                    ? Math.round((catData.correct / catData.attempted) * 100)
                    : null;

                return (
                  <tr key={cat} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {CATEGORY_LABELS[cat]}
                    </td>
                    {LEVELS.map((lvl) => {
                      const d = catData.byLevel[lvl];
                      return (
                        <td key={lvl} className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => onStartPractice(cat, lvl)}
                            title={`Practicar ${CATEGORY_LABELS[cat]} · ${LEVEL_LABELS[lvl].short}`}
                            className="font-mono tabular-nums text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:border-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            {d.attempted > 0
                              ? `${d.correct}/${d.attempted} (${Math.round(
                                  (d.correct / d.attempted) * 100
                                )}%)`
                              : 'Practicar'}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-3.5 px-6 text-right font-mono tabular-nums text-slate-700">
                      {catPct !== null
                        ? `${catData.correct}/${catData.attempted} · ${catPct}%`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Attempts Log */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900">
          Historial recent
        </h2>

        {progress.recentHistory.length === 0 ? (
          <p className="text-sm text-slate-500">
            Encara no has resolt cap exercici. Ves a la pestanya «Pràctica» per
            començar.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {progress.recentHistory.slice(0, 12).map((item) => (
              <li
                key={item.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-mono text-slate-900 truncate">
                    {item.summary}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {CATEGORY_LABELS[item.category]} · {LEVEL_LABELS[item.level].short}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 ${
                    item.status === 'correct'
                      ? 'text-emerald-700'
                      : item.status === 'equivalent_unnormalized'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {item.status === 'correct'
                    ? 'Correcte'
                    : item.status === 'equivalent_unnormalized'
                    ? 'No normalitzat'
                    : 'Incorrecte'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
