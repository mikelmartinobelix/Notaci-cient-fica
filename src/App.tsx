import { useState } from 'react';
import { AccessGate } from './components/AccessGate';
import { Header } from './components/Header';
import { PracticeWorkspace } from './components/PracticeWorkspace';
import { ProgressView } from './components/ProgressView';
import { QuickGuide } from './components/QuickGuide';
import { VisualExplorer } from './components/VisualExplorer';
import { clearProgress, loadProgress, recordAttempt } from './lib/storage';
import {
  AppSection,
  EvaluationStatus,
  ExerciseCategory,
  Level,
  PracticeFilter,
  StoredProgress,
  StudentProfile,
} from './types/exercise';

export default function App() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>('practice');
  const [filter, setFilter] = useState<PracticeFilter>('mixed');
  const [level, setLevel] = useState<Level>(1);
  const [seriesKey, setSeriesKey] = useState(1);
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());

  if (!student) {
    return <AccessGate onUnlock={(profile) => setStudent(profile)} />;
  }

  function handleNewSeries() {
    setActiveSection('practice');
    setSeriesKey((k) => k + 1);
  }

  function handleRecordAttempt(entry: {
    exerciseId: string;
    category: ExerciseCategory;
    level: Level;
    summary: string;
    status: EvaluationStatus;
  }) {
    setProgress((prev) => recordAttempt(prev, entry));
  }

  function handleResetProgress() {
    setProgress(clearProgress());
  }

  function handleStartPracticeFromProgress(cat: ExerciseCategory, lvl: Level) {
    setFilter(cat);
    setLevel(lvl);
    setSeriesKey((k) => k + 1);
    setActiveSection('practice');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onNewSeries={handleNewSeries}
      />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeSection === 'practice' && (
          <PracticeWorkspace
            student={student}
            filter={filter}
            level={level}
            seriesKey={seriesKey}
            progress={progress}
            onChangeFilter={setFilter}
            onChangeLevel={setLevel}
            onRestartSeries={handleNewSeries}
            onRecordAttempt={handleRecordAttempt}
          />
        )}

        {activeSection === 'explorer' && <VisualExplorer />}

        {activeSection === 'guide' && <QuickGuide />}

        {activeSection === 'progress' && (
          <ProgressView
            progress={progress}
            onResetProgress={handleResetProgress}
            onStartPractice={handleStartPracticeFromProgress}
          />
        )}
      </div>
    </div>
  );
}
