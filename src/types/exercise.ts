export type Level = 1 | 2 | 3;

export type ExerciseCategory =
  | 'compare'
  | 'find_exponent'
  | 'add_sub'
  | 'mul_div'
  | 'context';

export type PracticeFilter = ExerciseCategory | 'mixed';

export type AppSection = 'practice' | 'explorer' | 'guide' | 'progress';

export interface StudentProfile {
  name: string;
  group: string;
}

export interface ExactNum {
  coeff: bigint;
  exp: number;
}

export interface DisplayTerm {
  kind: 'decimal' | 'sci' | 'unnormalized_sci';
  value: ExactNum;
  /** Optional custom display mantissa for unnormalized scientific forms like 45 × 10^3 */
  rawMantissa?: string;
  rawExp?: number;
}

export interface CompareExercise {
  id: string;
  category: 'compare';
  level: Level;
  prompt: string;
  left: DisplayTerm;
  right: DisplayTerm;
  correctRelation: '<' | '=' | '>';
  steps: string[];
  hint: string;
}

export type FindExponentSubMode =
  | 'missing_exp'       // e.g. 47 500 = 4,75 × 10^[?]
  | 'missing_mantissa'  // e.g. 730 000 = [?] × 10^5
  | 'adjust_exp'        // e.g. 620 × 10^4 = 6,2 × 10^[?]
  | 'full_convert';     // e.g. 0,00045 = [?] × 10^[?]

export interface FindExponentExercise {
  id: string;
  category: 'find_exponent';
  subMode: FindExponentSubMode;
  level: Level;
  prompt: string;
  sourceTerm: DisplayTerm;
  targetMantissa?: string;
  targetExp?: number;
  expectedValue: ExactNum;
  expectedExp: number;
  expectedMantissaStr: string;
  steps: string[];
  hint: string;
}

export interface OperationExercise {
  id: string;
  category: 'add_sub' | 'mul_div';
  operator: '+' | '-' | '×' | '÷';
  level: Level;
  prompt: string;
  left: DisplayTerm;
  right: DisplayTerm;
  expectedValue: ExactNum;
  steps: string[];
  hint: string;
}

export type ContextAnswerMode = 'sci' | 'exponent_only';

export interface ContextExercise {
  id: string;
  category: 'context';
  domainLabel: string;
  level: Level;
  title: string;
  story: string;
  question: string;
  answerMode: ContextAnswerMode;
  unit?: string;
  expectedValue: ExactNum;
  expectedExp: number;
  steps: string[];
  hint: string;
}

export type Exercise =
  | CompareExercise
  | FindExponentExercise
  | OperationExercise
  | ContextExercise;

export type EvaluationStatus = 'correct' | 'equivalent_unnormalized' | 'incorrect';

export interface EvaluationResult {
  status: EvaluationStatus;
  feedbackTitle: string;
  feedbackMessage: string;
}

export interface AttemptRecord {
  id: string;
  exerciseId: string;
  category: ExerciseCategory;
  level: Level;
  summary: string;
  status: EvaluationStatus;
  timestamp: number;
}

export interface CategoryProgress {
  attempted: number;
  correct: number;
  byLevel: Record<Level, { attempted: number; correct: number }>;
}

export interface StoredProgress {
  totalAttempted: number;
  totalCorrect: number;
  currentStreak: number;
  bestStreak: number;
  categories: Record<ExerciseCategory, CategoryProgress>;
  recentHistory: AttemptRecord[];
}
