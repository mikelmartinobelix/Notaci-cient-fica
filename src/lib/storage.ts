import {
  AttemptRecord,
  CategoryProgress,
  EvaluationStatus,
  ExerciseCategory,
  Level,
  StoredProgress,
} from '../types/exercise';

const STORAGE_KEY = 'notacio10_progress_v1';

function createEmptyCategory(): CategoryProgress {
  return {
    attempted: 0,
    correct: 0,
    byLevel: {
      1: { attempted: 0, correct: 0 },
      2: { attempted: 0, correct: 0 },
      3: { attempted: 0, correct: 0 },
    },
  };
}

export function createEmptyProgress(): StoredProgress {
  return {
    totalAttempted: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    categories: {
      compare: createEmptyCategory(),
      find_exponent: createEmptyCategory(),
      add_sub: createEmptyCategory(),
      mul_div: createEmptyCategory(),
      context: createEmptyCategory(),
    },
    recentHistory: [],
  };
}

export function loadProgress(): StoredProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    const base = createEmptyProgress();
    if (!parsed || typeof parsed !== 'object') return base;

    return {
      totalAttempted: parsed.totalAttempted ?? 0,
      totalCorrect: parsed.totalCorrect ?? 0,
      currentStreak: parsed.currentStreak ?? 0,
      bestStreak: parsed.bestStreak ?? 0,
      categories: {
        compare: parsed.categories?.compare ?? createEmptyCategory(),
        find_exponent: parsed.categories?.find_exponent ?? createEmptyCategory(),
        add_sub: parsed.categories?.add_sub ?? createEmptyCategory(),
        mul_div: parsed.categories?.mul_div ?? createEmptyCategory(),
        context: parsed.categories?.context ?? createEmptyCategory(),
      },
      recentHistory: Array.isArray(parsed.recentHistory)
        ? parsed.recentHistory.slice(0, 30)
        : [],
    };
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress: StoredProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearProgress(): StoredProgress {
  const empty = createEmptyProgress();
  saveProgress(empty);
  return empty;
}

export function recordAttempt(
  prev: StoredProgress,
  entry: {
    exerciseId: string;
    category: ExerciseCategory;
    level: Level;
    summary: string;
    status: EvaluationStatus;
  }
): StoredProgress {
  const isCorrect = entry.status === 'correct';
  const nextStreak = isCorrect ? prev.currentStreak + 1 : 0;
  const nextBest = Math.max(prev.bestStreak, nextStreak);

  const prevCat = prev.categories[entry.category] ?? createEmptyCategory();
  const prevLvl = prevCat.byLevel[entry.level] ?? { attempted: 0, correct: 0 };

  const newRecord: AttemptRecord = {
    id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    exerciseId: entry.exerciseId,
    category: entry.category,
    level: entry.level,
    summary: entry.summary,
    status: entry.status,
    timestamp: Date.now(),
  };

  const next: StoredProgress = {
    totalAttempted: prev.totalAttempted + 1,
    totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
    currentStreak: nextStreak,
    bestStreak: nextBest,
    categories: {
      ...prev.categories,
      [entry.category]: {
        attempted: prevCat.attempted + 1,
        correct: prevCat.correct + (isCorrect ? 1 : 0),
        byLevel: {
          ...prevCat.byLevel,
          [entry.level]: {
            attempted: prevLvl.attempted + 1,
            correct: prevLvl.correct + (isCorrect ? 1 : 0),
          },
        },
      },
    },
    recentHistory: [newRecord, ...prev.recentHistory].slice(0, 30),
  };

  saveProgress(next);
  return next;
}
