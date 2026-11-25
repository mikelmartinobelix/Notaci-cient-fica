import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  RotateCcw,
  SkipForward,
  XCircle,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  LEVEL_LABELS,
  generateExercise,
} from '../lib/exerciseGenerator';
import {
  compareExact,
  formatExactAsDecimal,
  formatSciUnicode,
  isStandardMantissaString,
  parseDecimalToExact,
  parseSciInputToExact,
} from '../lib/sciMath';
import {
  AttemptRecord,
  EvaluationResult,
  EvaluationStatus,
  Exercise,
  ExerciseCategory,
  Level,
  PracticeFilter,
  StoredProgress,
} from '../types/exercise';
import { DecimalShiftDiagram, DisplayTermView, SciNumber } from './MathDisplay';

const SERIES_LENGTH = 10;

const FILTER_OPTIONS: PracticeFilter[] = [
  'mixed',
  'compare',
  'find_exponent',
  'add_sub',
  'mul_div',
  'context',
];

const LEVEL_OPTIONS: Level[] = [1, 2, 3];

interface PracticeWorkspaceProps {
  filter: PracticeFilter;
  level: Level;
  seriesKey: number;
  progress: StoredProgress;
  onChangeFilter: (f: PracticeFilter) => void;
  onChangeLevel: (l: Level) => void;
  onRestartSeries: () => void;
  onRecordAttempt: (entry: {
    exerciseId: string;
    category: ExerciseCategory;
    level: Level;
    summary: string;
    status: EvaluationStatus;
  }) => void;
}

interface RuleContent {
  title: string;
  formula: string;
  explanation: string;
  example: string;
}

function getContextualRule(category: ExerciseCategory): RuleContent {
  switch (category) {
    case 'compare':
      return {
        title: 'Regla de comparació',
        formula: '1 ≤ |a| < 10  →  compara n',
        explanation:
          'Amb dos nombres positius en notació científica estàndard, el que té l’exponent més gran sempre és major.',
        example: '8,7 × 10⁴ < 1,4 × 10⁵  (perquè 4 < 5)',
      };
    case 'find_exponent':
      return {
        title: 'Desplaçament de la coma',
        formula: '← esquerra (+n)  |  → dreta (-n)',
        explanation:
          'Cada salt de la coma cap a l’esquerra suma 1 a l’exponent; cada salt cap a la dreta resta 1.',
        example: '0,0047 = 4,7 × 10⁻³  (3 salts a la dreta)',
      };
    case 'add_sub':
      return {
        title: 'Suma i resta',
        formula: 'Iguala les potències de 10',
        explanation:
          'No sumis ni restis exponents! Passa tots dos termes a la mateixa potència de 10 i opera només les mantisses.',
        example: '3×10⁴ + 2×10³ = 3×10⁴ + 0,2×10⁴ = 3,2×10⁴',
      };
    case 'mul_div':
      return {
        title: 'Multiplicació i divisió',
        formula: '10ᵃ × 10ᵇ = 10ᵃ⁺ᵇ  |  10ᵃ ÷ 10ᵇ = 10ᵃ⁻ᵇ',
        explanation:
          'Opera les mantisses per una banda i aplica les propietats de les potències de base 10 per l’altra. Normalitza al final.',
        example: '(4×10³) × (3×10⁵) = 12×10⁸ = 1,2×10⁹',
      };
    case 'context':
      return {
        title: 'Resolució en context',
        formula: 'Unitats coherents → Notació científica',
        explanation:
          'Comprova primer que totes les dades estiguin en la mateixa unitat (m, kg, s) abans de multiplicar o dividir.',
        example: '15 min = 900 s = 9 × 10² s',
      };
  }
}

export const PracticeWorkspace: React.FC<PracticeWorkspaceProps> = ({
  filter,
  level,
  seriesKey,
  progress,
  onChangeFilter,
  onChangeLevel,
  onRestartSeries,
  onRecordAttempt,
}) => {
  const [exerciseIndex, setExerciseIndex] = useState(1);
  const [exercise, setExercise] = useState<Exercise>(() =>
    generateExercise(filter, level)
  );
  const [seriesAttempts, setSeriesAttempts] = useState<AttemptRecord[]>([]);
  const [seriesFinished, setSeriesFinished] = useState(false);

  // Input states
  const [selectedRelation, setSelectedRelation] = useState<'<' | '=' | '>' | null>(
    null
  );
  const [mantissaInput, setMantissaInput] = useState('');
  const [expInput, setExpInput] = useState('');

  // Evaluation & UI state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSteps, setShowSteps] = useState(true);

  const mantissaRef = useRef<HTMLInputElement | null>(null);
  const expRef = useRef<HTMLInputElement | null>(null);

  // Reset series when filter, level, or seriesKey changes
  useEffect(() => {
    setExerciseIndex(1);
    setExercise(generateExercise(filter, level));
    setSeriesAttempts([]);
    setSeriesFinished(false);
    resetInputs();
  }, [filter, level, seriesKey]);

  function resetInputs() {
    setSelectedRelation(null);
    setMantissaInput('');
    setExpInput('');
    setEvaluation(null);
    setInputError(null);
    setShowHint(false);
    setShowSteps(true);
  }

  // Focus primary input on new exercise
  useEffect(() => {
    if (seriesFinished || evaluation) return;
    const timer = window.setTimeout(() => {
      if (
        exercise.category === 'find_exponent' &&
        (exercise.subMode === 'missing_exp' || exercise.subMode === 'adjust_exp')
      ) {
        expRef.current?.focus();
      } else if (
        exercise.category === 'context' &&
        exercise.answerMode === 'exponent_only'
      ) {
        expRef.current?.focus();
      } else if (exercise.category !== 'compare') {
        mantissaRef.current?.focus();
      }
    }, 40);
    return () => window.clearTimeout(timer);
  }, [exercise, seriesFinished, evaluation]);

  function toggleExponentSign() {
    if (evaluation) return;
    setExpInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return '-';
      if (trimmed.startsWith('-')) return trimmed.slice(1);
      if (trimmed.startsWith('+')) return '-' + trimmed.slice(1);
      return '-' + trimmed;
    });
    expRef.current?.focus();
  }

  function buildExerciseSummary(ex: Exercise): string {
    if (ex.category === 'compare') {
      const l =
        ex.left.kind === 'decimal'
          ? formatExactAsDecimal(ex.left.value)
          : formatSciUnicode(ex.left.value);
      const r =
        ex.right.kind === 'decimal'
          ? formatExactAsDecimal(ex.right.value)
          : formatSciUnicode(ex.right.value);
      return `${l} ${ex.correctRelation} ${r}`;
    }
    if (ex.category === 'find_exponent') {
      return `${formatSciUnicode(ex.expectedValue)}`;
    }
    if (ex.category === 'context') {
      return `${ex.title}: ${formatSciUnicode(ex.expectedValue)}`;
    }
    return `${formatSciUnicode(ex.left.value)} ${ex.operator} ${formatSciUnicode(ex.right.value)} = ${formatSciUnicode(ex.expectedValue)}`;
  }

  function evaluateAnswer(relationOverride?: '<' | '=' | '>') {
    if (evaluation) return;
    setInputError(null);

    let result: EvaluationResult;

    if (exercise.category === 'compare') {
      const chosen = relationOverride ?? selectedRelation;
      if (!chosen) {
        setInputError('Selecciona una de les tres relacions (<, = o >).');
        return;
      }
      if (chosen === exercise.correctRelation) {
        result = {
          status: 'correct',
          feedbackTitle: 'Correcte',
          feedbackMessage: 'La comparació és exacta.',
        };
      } else {
        result = {
          status: 'incorrect',
          feedbackTitle: 'Incorrecte',
          feedbackMessage: `La relació correcta és «${exercise.correctRelation}». Revisa els passos de comparació a continuació.`,
        };
      }
    } else if (exercise.category === 'find_exponent') {
      if (
        exercise.subMode === 'missing_exp' ||
        exercise.subMode === 'adjust_exp'
      ) {
        const cleaned = expInput.trim().replace(/\s+/g, '');
        if (!/^[+-]?\d+$/.test(cleaned)) {
          setInputError('Introdueix un nombre enter vàlid per a l’exponent (ex: 4 o -3).');
          return;
        }
        const parsedExp = parseInt(cleaned, 10);
        if (parsedExp === exercise.expectedExp) {
          result = {
            status: 'correct',
            feedbackTitle: 'Correcte',
            feedbackMessage: `L’exponent ${exercise.expectedExp} completa exactament la igualtat.`,
          };
        } else {
          result = {
            status: 'incorrect',
            feedbackTitle: 'Incorrecte',
            feedbackMessage: `L’exponent correcte és ${exercise.expectedExp} (has escrit ${parsedExp}).`,
          };
        }
      } else if (exercise.subMode === 'missing_mantissa') {
        const parsedM = parseDecimalToExact(mantissaInput);
        if (!parsedM) {
          setInputError('Introdueix un valor decimal vàlid per a la mantissa.');
          return;
        }
        const userCombined = parseSciInputToExact(
          mantissaInput,
          String(exercise.targetExp ?? 0)
        );
        if (userCombined && compareExact(userCombined, exercise.expectedValue) === 0) {
          result = {
            status: 'correct',
            feedbackTitle: 'Correcte',
            feedbackMessage: `La mantissa ${exercise.expectedMantissaStr} ajusta perfectament la potència 10^${exercise.targetExp}.`,
          };
        } else {
          result = {
            status: 'incorrect',
            feedbackTitle: 'Incorrecte',
            feedbackMessage: `El factor correcte és ${exercise.expectedMantissaStr}.`,
          };
        }
      } else {
        // full_convert
        const userVal = parseSciInputToExact(mantissaInput, expInput);
        if (!userVal) {
          setInputError(
            'Completa tant la mantissa (ex: 4,75) com l’exponent enter (ex: -3).'
          );
          return;
        }
        if (compareExact(userVal, exercise.expectedValue) === 0) {
          if (isStandardMantissaString(mantissaInput)) {
            result = {
              status: 'correct',
              feedbackTitle: 'Correcte',
              feedbackMessage: 'Conversió a notació científica perfecta.',
            };
          } else {
            result = {
              status: 'equivalent_unnormalized',
              feedbackTitle: 'Equivalent però no normalitzat',
              feedbackMessage: `El valor numèric coincideix, però en notació científica estàndard la mantissa ha de complir 1 ≤ |a| < 10: ${formatSciUnicode(exercise.expectedValue)}.`,
            };
          }
        } else {
          result = {
            status: 'incorrect',
            feedbackTitle: 'Incorrecte',
            feedbackMessage: `La notació científica correcta és ${formatSciUnicode(exercise.expectedValue)}.`,
          };
        }
      }
    } else if (exercise.category === 'context') {
      if (exercise.answerMode === 'exponent_only') {
        const cleaned = expInput.trim().replace(/\s+/g, '');
        if (!/^[+-]?\d+$/.test(cleaned)) {
          setInputError('Introdueix un nombre enter vàlid per a l’exponent.');
          return;
        }
        const parsedExp = parseInt(cleaned, 10);
        if (parsedExp === exercise.expectedExp) {
          result = {
            status: 'correct',
            feedbackTitle: 'Correcte',
            feedbackMessage: `L’exponent és ${exercise.expectedExp}.`,
          };
        } else {
          result = {
            status: 'incorrect',
            feedbackTitle: 'Incorrecte',
            feedbackMessage: `L’exponent correcte és ${exercise.expectedExp}.`,
          };
        }
      } else {
        const userVal = parseSciInputToExact(mantissaInput, expInput);
        if (!userVal) {
          setInputError(
            'Introdueix la mantissa i l’exponent enter per donar la resposta en notació científica.'
          );
          return;
        }
        if (compareExact(userVal, exercise.expectedValue) === 0) {
          if (isStandardMantissaString(mantissaInput)) {
            result = {
              status: 'correct',
              feedbackTitle: 'Correcte',
              feedbackMessage: 'Problema resolt correctament.',
            };
          } else {
            result = {
              status: 'equivalent_unnormalized',
              feedbackTitle: 'Equivalent però no normalitzat',
              feedbackMessage: `El valor és correcte, però expressa la mantissa entre 1 i 10: ${formatSciUnicode(exercise.expectedValue)}${exercise.unit ? ` ${exercise.unit}` : ''}.`,
            };
          }
        } else {
          result = {
            status: 'incorrect',
            feedbackTitle: 'Incorrecte',
            feedbackMessage: `La resposta correcta és ${formatSciUnicode(exercise.expectedValue)}${exercise.unit ? ` ${exercise.unit}` : ''}.`,
          };
        }
      }
    } else {
      // add_sub or mul_div
      const userVal = parseSciInputToExact(mantissaInput, expInput);
      if (!userVal) {
        setInputError(
          'Introdueix la mantissa (ex: 3,2) i l’exponent enter de 10 (ex: 5 o -2).'
        );
        return;
      }
      if (compareExact(userVal, exercise.expectedValue) === 0) {
        if (isStandardMantissaString(mantissaInput)) {
          result = {
            status: 'correct',
            feedbackTitle: 'Correcte',
            feedbackMessage: 'Càlcul i normalització exactes.',
          };
        } else {
          result = {
            status: 'equivalent_unnormalized',
            feedbackTitle: 'Equivalent però no normalitzat',
            feedbackMessage: `El resultat numèric és equivalent, però falta ajustar la coma perquè 1 ≤ |a| < 10: ${formatSciUnicode(exercise.expectedValue)}.`,
          };
        }
      } else {
        result = {
          status: 'incorrect',
          feedbackTitle: 'Incorrecte',
          feedbackMessage: `El resultat correcte és ${formatSciUnicode(exercise.expectedValue)}.`,
        };
      }
    }

    setEvaluation(result);
    const summary = buildExerciseSummary(exercise);
    const record: AttemptRecord = {
      id: `sess-${Date.now()}`,
      exerciseId: exercise.id,
      category: exercise.category,
      level: exercise.level,
      summary,
      status: result.status,
      timestamp: Date.now(),
    };
    setSeriesAttempts((prev) => [record, ...prev]);
    onRecordAttempt({
      exerciseId: exercise.id,
      category: exercise.category,
      level: exercise.level,
      summary,
      status: result.status,
    });
  }

  function handleNextExercise() {
    if (exerciseIndex >= SERIES_LENGTH && evaluation) {
      setSeriesFinished(true);
      return;
    }
    if (evaluation) {
      setExerciseIndex((prev) => prev + 1);
    }
    setExercise(generateExercise(filter, level));
    resetInputs();
  }

  // Keyboard shortcuts for fast practice
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (seriesFinished) return;
      if (e.key === 'Enter') {
        if (evaluation) {
          e.preventDefault();
          handleNextExercise();
        } else if (exercise.category !== 'compare' || selectedRelation) {
          e.preventDefault();
          evaluateAnswer();
        }
      } else if (exercise.category === 'compare' && !evaluation) {
        if (e.key === '<' || e.key === '1') {
          e.preventDefault();
          setSelectedRelation('<');
        } else if (e.key === '=' || e.key === '2') {
          e.preventDefault();
          setSelectedRelation('=');
        } else if (e.key === '>' || e.key === '3') {
          e.preventDefault();
          setSelectedRelation('>');
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const seriesCorrectCount = seriesAttempts.filter(
    (a) => a.status === 'correct'
  ).length;
  const rule = getContextualRule(exercise.category);

  const showShiftDiagram =
    evaluation !== null &&
    (exercise.category === 'find_exponent' ||
      (exercise.category === 'compare' &&
        (exercise.left.kind === 'decimal' || exercise.right.kind === 'decimal')));

  const diagramTargetValue =
    exercise.category === 'find_exponent'
      ? exercise.expectedValue
      : exercise.category === 'compare'
      ? exercise.left.kind === 'decimal'
        ? exercise.left.value
        : exercise.right.value
      : null;

  return (
    <div className="space-y-6">
      {/* Control Filter Bar */}
      <section
        aria-label="Configuració de la pràctica"
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200"
      >
        {/* Typology Filter Buttons */}
        <div
          role="group"
          aria-label="Tipologia d'exercicis"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeFilter(opt)}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {CATEGORY_LABELS[opt]}
              </button>
            );
          })}
        </div>

        {/* Level Segmented Control */}
        <div
          role="group"
          aria-label="Nivell de dificultat"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start lg:self-auto"
        >
          {LEVEL_OPTIONS.map((lvl) => {
            const active = level === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onChangeLevel(lvl)}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700 ${
                  active
                    ? 'bg-blue-700 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {LEVEL_LABELS[lvl].short} · {LEVEL_LABELS[lvl].title}
              </button>
            );
          })}
        </div>
      </section>

      {/* Two-Zone Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* Left/Main Interactive Exercise Stage */}
        <main className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          {seriesFinished ? (
            <div className="py-4 space-y-6">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {CATEGORY_LABELS[filter]} · {LEVEL_LABELS[level].short}:{' '}
                  {LEVEL_LABELS[level].title}
                </p>
                <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900">
                  Sèrie completada
                </h1>
                <p className="mt-2 text-slate-600">
                  Has resolt els {SERIES_LENGTH} exercicis d’aquesta ronda. Pots
                  iniciar una sèrie nova o canviar de tipologia i nivell.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Encerts exactes</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {seriesCorrectCount} / {SERIES_LENGTH}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Precisió de la sèrie</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-blue-700 tabular-nums">
                    {Math.round((seriesCorrectCount / SERIES_LENGTH) * 100)}%
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Millor ratxa global</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {progress.bestStreak}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onRestartSeries}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Començar una altra sèrie</span>
                </button>
                {level < 3 && (
                  <button
                    type="button"
                    onClick={() => onChangeLevel((level + 1) as Level)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Pujar al Nivell {level + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              {/* Quiet Unboxed Metadata Line */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    {CATEGORY_LABELS[exercise.category]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {LEVEL_LABELS[exercise.level].short}:{' '}
                    {LEVEL_LABELS[exercise.level].title}
                  </span>
                  {exercise.category === 'context' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{exercise.domainLabel}</span>
                    </>
                  )}
                </div>
                <span className="font-mono tabular-nums font-medium text-slate-600">
                  Exercici {exerciseIndex} de {SERIES_LENGTH}
                </span>
              </div>

              {/* Exercise Prompt / Context Story */}
              {exercise.category === 'context' ? (
                <div className="space-y-3">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    {exercise.title}
                  </h1>
                  <p className="text-base leading-relaxed text-slate-700">
                    {exercise.story}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {exercise.question}
                  </p>
                </div>
              ) : (
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 text-balance">
                  {exercise.prompt}
                </h1>
              )}

              {/* Mathematical Display & Interactive Answer Input */}
              {exercise.category === 'compare' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 py-6 px-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-2xl sm:text-3xl font-semibold text-slate-900 text-center">
                      <DisplayTermView term={exercise.left} />
                    </div>

                    <div
                      aria-label="Relació seleccionada"
                      className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-bold shrink-0 ${
                        evaluation
                          ? evaluation.status === 'correct'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                            : 'bg-red-50 border-red-600 text-red-800'
                          : selectedRelation
                          ? 'bg-blue-50 border-blue-700 text-blue-800'
                          : 'bg-white border-dashed border-slate-300 text-slate-400'
                      }`}
                    >
                      {selectedRelation ?? '?'}
                    </div>

                    <div className="text-2xl sm:text-3xl font-semibold text-slate-900 text-center">
                      <DisplayTermView term={exercise.right} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {(
                      [
                        { sym: '<', label: 'Menor que' },
                        { sym: '=', label: 'Igual a' },
                        { sym: '>', label: 'Major que' },
                      ] as const
                    ).map((btn) => {
                      const active = selectedRelation === btn.sym;
                      return (
                        <button
                          key={btn.sym}
                          type="button"
                          disabled={Boolean(evaluation)}
                          onClick={() => {
                            setSelectedRelation(btn.sym);
                            setInputError(null);
                          }}
                          className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg border transition-colors cursor-pointer disabled:cursor-default ${
                            active
                              ? 'bg-blue-700 border-blue-700 text-white'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-mono text-2xl font-bold leading-none">
                            {btn.sym}
                          </span>
                          <span
                            className={`mt-1.5 text-xs font-medium ${
                              active ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {btn.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {exercise.category === 'find_exponent' && (
                <div className="py-6 px-5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xl sm:text-2xl font-mono tabular-nums text-slate-900">
                    <DisplayTermView term={exercise.sourceTerm} className="font-semibold" />
                    <span className="text-slate-400 font-normal">=</span>

                    {(exercise.subMode === 'missing_exp' ||
                      exercise.subMode === 'adjust_exp') && (
                      <div className="inline-flex items-baseline gap-1.5">
                        <span className="font-semibold">{exercise.targetMantissa}</span>
                        <span className="text-slate-400">×</span>
                        <span className="font-semibold">10</span>
                        <div className="inline-flex items-center gap-1 -translate-y-2.5">
                          <input
                            ref={expRef}
                            type="text"
                            inputMode="text"
                            disabled={Boolean(evaluation)}
                            value={expInput}
                            onChange={(e) => {
                              setExpInput(e.target.value);
                              setInputError(null);
                            }}
                            placeholder="n"
                            aria-label="Exponent de 10"
                            className="w-16 h-10 px-2 text-center text-base font-mono font-semibold bg-white border-2 border-blue-300 rounded-md focus:border-blue-700 focus:outline-none disabled:bg-slate-100"
                          />
                          <button
                            type="button"
                            disabled={Boolean(evaluation)}
                            onClick={toggleExponentSign}
                            title="Canviar signe (+/-)"
                            aria-label="Canviar signe de l'exponent"
                            className="h-10 px-2 text-xs font-mono font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                          >
                            ±
                          </button>
                        </div>
                      </div>
                    )}

                    {exercise.subMode === 'missing_mantissa' && (
                      <div className="inline-flex items-baseline gap-1.5">
                        <input
                          ref={mantissaRef}
                          type="text"
                          inputMode="decimal"
                          disabled={Boolean(evaluation)}
                          value={mantissaInput}
                          onChange={(e) => {
                            setMantissaInput(e.target.value);
                            setInputError(null);
                          }}
                          placeholder="factor"
                          aria-label="Mantissa o factor"
                          className="w-28 h-11 px-3 text-center text-lg font-mono font-semibold bg-white border-2 border-blue-300 rounded-lg focus:border-blue-700 focus:outline-none disabled:bg-slate-100"
                        />
                        <span className="text-slate-400">×</span>
                        <span className="font-semibold">10</span>
                        <sup className="text-sm font-semibold text-blue-700 -translate-y-2.5">
                          {exercise.targetExp}
                        </sup>
                      </div>
                    )}

                    {exercise.subMode === 'full_convert' && (
                      <SciInputFields
                        mantissaRef={mantissaRef}
                        expRef={expRef}
                        mantissa={mantissaInput}
                        exponent={expInput}
                        disabled={Boolean(evaluation)}
                        onMantissaChange={(v) => {
                          setMantissaInput(v);
                          setInputError(null);
                        }}
                        onExpChange={(v) => {
                          setExpInput(v);
                          setInputError(null);
                        }}
                        onToggleSign={toggleExponentSign}
                      />
                    )}
                  </div>
                </div>
              )}

              {(exercise.category === 'add_sub' ||
                exercise.category === 'mul_div') && (
                <div className="py-6 px-5 rounded-xl bg-slate-50 border border-slate-200 space-y-5">
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xl sm:text-2xl text-slate-900">
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                      <DisplayTermView term={exercise.left} className="font-semibold" />
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-2xl px-1">
                      {exercise.operator}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                      <DisplayTermView term={exercise.right} className="font-semibold" />
                    </span>
                    <span className="font-mono text-slate-400 text-2xl">=</span>
                  </div>

                  <div className="flex justify-center">
                    <SciInputFields
                      mantissaRef={mantissaRef}
                      expRef={expRef}
                      mantissa={mantissaInput}
                      exponent={expInput}
                      disabled={Boolean(evaluation)}
                      onMantissaChange={(v) => {
                        setMantissaInput(v);
                        setInputError(null);
                      }}
                      onExpChange={(v) => {
                        setExpInput(v);
                        setInputError(null);
                      }}
                      onToggleSign={toggleExponentSign}
                    />
                  </div>
                </div>
              )}

              {exercise.category === 'context' && (
                <div className="py-5 px-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm font-medium text-slate-600">
                    {exercise.answerMode === 'exponent_only'
                      ? 'Introdueix el valor de l’exponent n:'
                      : 'Resposta en notació científica:'}
                  </div>
                  <div className="flex items-center gap-3">
                    {exercise.answerMode === 'exponent_only' ? (
                      <div className="inline-flex items-center gap-2 font-mono text-xl">
                        <span className="text-slate-600">n =</span>
                        <input
                          ref={expRef}
                          type="text"
                          inputMode="text"
                          disabled={Boolean(evaluation)}
                          value={expInput}
                          onChange={(e) => {
                            setExpInput(e.target.value);
                            setInputError(null);
                          }}
                          placeholder="exponent"
                          aria-label="Exponent n"
                          className="w-24 h-11 px-3 text-center text-lg font-mono font-semibold bg-white border-2 border-blue-300 rounded-lg focus:border-blue-700 focus:outline-none disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          disabled={Boolean(evaluation)}
                          onClick={toggleExponentSign}
                          className="h-11 px-3 text-sm font-mono font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                        >
                          ±
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <SciInputFields
                          mantissaRef={mantissaRef}
                          expRef={expRef}
                          mantissa={mantissaInput}
                          exponent={expInput}
                          disabled={Boolean(evaluation)}
                          onMantissaChange={(v) => {
                            setMantissaInput(v);
                            setInputError(null);
                          }}
                          onExpChange={(v) => {
                            setExpInput(v);
                            setInputError(null);
                          }}
                          onToggleSign={toggleExponentSign}
                        />
                        {exercise.unit && (
                          <span className="text-base font-medium text-slate-700">
                            {exercise.unit}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {inputError && (
                <p
                  role="alert"
                  className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5"
                >
                  {inputError}
                </p>
              )}

              {/* Hint Drawer */}
              {showHint && !evaluation && (
                <div className="rounded-lg bg-amber-50/70 border border-amber-200 px-4 py-3 text-sm text-amber-950">
                  <span className="font-semibold">Pista: </span>
                  {exercise.hint}
                </div>
              )}

              {/* Primary Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  {!evaluation ? (
                    <button
                      type="button"
                      onClick={() => evaluateAnswer()}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Comprovar resposta
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextExercise}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>
                        {exerciseIndex >= SERIES_LENGTH
                          ? 'Veure resum de la sèrie'
                          : 'Següent exercici'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {!evaluation && (
                    <button
                      type="button"
                      onClick={() => setShowHint((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <span>{showHint ? 'Amagar pista' : 'Pista'}</span>
                    </button>
                  )}
                </div>

                {!evaluation && (
                  <button
                    type="button"
                    onClick={handleNextExercise}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Canviar d’exercici</span>
                  </button>
                )}
              </div>

              {/* Evaluation Feedback & Step-by-Step Resolution */}
              {evaluation && (
                <div
                  className={`rounded-xl border p-5 space-y-4 ${
                    evaluation.status === 'correct'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : evaluation.status === 'equivalent_unnormalized'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-red-50/60 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {evaluation.status === 'correct' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    )}
                    {evaluation.status === 'equivalent_unnormalized' && (
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    {evaluation.status === 'incorrect' && (
                      <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          evaluation.status === 'correct'
                            ? 'text-emerald-900'
                            : evaluation.status === 'equivalent_unnormalized'
                            ? 'text-amber-900'
                            : 'text-red-900'
                        }`}
                      >
                        {evaluation.feedbackTitle}
                      </div>
                      <p className="mt-1 text-sm text-slate-800">
                        {evaluation.feedbackMessage}
                      </p>
                    </div>
                  </div>

                  {/* Step-by-step toggleable breakdown */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setShowSteps((s) => !s)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Resolució pas a pas</span>
                      {showSteps ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showSteps && (
                      <div className="mt-3 space-y-3">
                        <ol className="space-y-1.5 text-sm text-slate-700 list-decimal list-inside">
                          {exercise.steps.map((step, i) => (
                            <li key={i} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>

                        {showShiftDiagram && diagramTargetValue && (
                          <div className="pt-2">
                            <DecimalShiftDiagram value={diagramTargetValue} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Control & Concept Deck */}
        <aside className="space-y-6">
          {/* Session Metrics Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Estat de la sessió
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {seriesAttempts.length} / {SERIES_LENGTH}
              </span>
            </div>

            {/* Clean linear progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-700 transition-transform duration-200 origin-left"
                style={{
                  transform: `scaleX(${Math.min(
                    1,
                    seriesAttempts.length / SERIES_LENGTH
                  )})`,
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <div className="text-xs text-slate-500">Encerts</div>
                <div className="mt-0.5 font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {seriesCorrectCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Ratxa actual</div>
                <div className="mt-0.5 font-mono text-lg font-bold text-blue-700 tabular-nums">
                  {progress.currentStreak}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Rècord</div>
                <div className="mt-0.5 font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {progress.bestStreak}
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Concept Rule Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="text-xs font-medium text-slate-500">
              Recordatori del tema
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">
              {rule.title}
            </h2>
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs font-semibold text-blue-800">
              {rule.formula}
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {rule.explanation}
            </p>
            <div className="pt-1 text-xs font-mono text-slate-700">
              <span className="font-sans font-semibold text-slate-500">
                Exemple:{' '}
              </span>
              {rule.example}
            </div>
          </div>

          {/* Recent Series History */}
          {seriesAttempts.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                Últims exercicis
              </h2>
              <ul className="divide-y divide-slate-100">
                {seriesAttempts.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-mono text-slate-700 truncate">
                      {item.summary}
                    </span>
                    <span
                      className={`shrink-0 font-semibold ${
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
                        ? 'Normalitzar'
                        : 'Error'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

interface SciInputFieldsProps {
  mantissaRef: React.RefObject<HTMLInputElement | null>;
  expRef: React.RefObject<HTMLInputElement | null>;
  mantissa: string;
  exponent: string;
  disabled: boolean;
  onMantissaChange: (val: string) => void;
  onExpChange: (val: string) => void;
  onToggleSign: () => void;
}

const SciInputFields: React.FC<SciInputFieldsProps> = ({
  mantissaRef,
  expRef,
  mantissa,
  exponent,
  disabled,
  onMantissaChange,
  onExpChange,
  onToggleSign,
}) => {
  return (
    <div className="inline-flex items-center gap-2 font-mono tabular-nums">
      <input
        ref={mantissaRef}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={mantissa}
        onChange={(e) => onMantissaChange(e.target.value)}
        placeholder="a"
        aria-label="Mantissa (entre 1 i 10)"
        className="w-28 h-11 px-3 text-center text-lg font-semibold bg-white border-2 border-blue-300 rounded-lg focus:border-blue-700 focus:outline-none disabled:bg-slate-100"
      />
      <span className="text-slate-500 text-lg font-medium">×</span>
      <span className="text-xl font-semibold text-slate-900">10</span>
      <div className="inline-flex items-center gap-1 -translate-y-2.5">
        <input
          ref={expRef}
          type="text"
          inputMode="text"
          disabled={disabled}
          value={exponent}
          onChange={(e) => onExpChange(e.target.value)}
          placeholder="n"
          aria-label="Exponent de 10"
          className="w-16 h-10 px-2 text-center text-base font-semibold bg-white border-2 border-blue-300 rounded-md focus:border-blue-700 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleSign}
          title="Canviar signe (+/-)"
          aria-label="Canviar signe de l'exponent"
          className="h-10 px-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer disabled:opacity-50"
        >
          ±
        </button>
      </div>
    </div>
  );
};
