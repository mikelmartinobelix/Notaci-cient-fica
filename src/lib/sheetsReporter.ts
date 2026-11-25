import { SHEETS_WEBHOOK_URL } from '../config/sheets';
import { CATEGORY_LABELS, LEVEL_LABELS } from './exerciseGenerator';
import { Level, PracticeFilter, StudentProfile } from '../types/exercise';

export interface SheetsSeriesPayload {
  studentName: string;
  studentGroup: string;
  filter: PracticeFilter;
  level: Level;
  attempted: number;
  correct: number;
  accuracyPct: number;
  bestStreak: number;
  completedSeries: boolean;
}

export function isSheetsReportingEnabled(): boolean {
  return SHEETS_WEBHOOK_URL.trim().startsWith('https://');
}

export async function sendSeriesToSheets(
  student: StudentProfile,
  data: Omit<SheetsSeriesPayload, 'studentName' | 'studentGroup'>
): Promise<boolean> {
  const url = SHEETS_WEBHOOK_URL.trim();
  if (!url.startsWith('https://')) {
    return false;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    nom: student.name.trim().slice(0, 100),
    grup: student.group.trim().slice(0, 40),
    tipologia: CATEGORY_LABELS[data.filter],
    nivell: `${LEVEL_LABELS[data.level].short} (${LEVEL_LABELS[data.level].title})`,
    resolts: data.attempted,
    encerts: data.correct,
    precisio: data.accuracyPct,
    ratxa: data.bestStreak,
    estat: data.completedSeries ? 'Sèrie completa' : 'Enviament parcial',
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}
