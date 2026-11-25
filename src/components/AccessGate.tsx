import React, { useState } from 'react';
import { Eye, EyeOff, Lock, XCircle } from 'lucide-react';
import { verifyClassroomPassword } from '../lib/accessAuth';
import { StudentProfile } from '../types/exercise';

interface AccessGateProps {
  onUnlock: (student: StudentProfile) => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({ onUnlock }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanGroup = group.trim();

    if (cleanName.length < 2) {
      setError('Escriu el teu nom i cognoms per registrar la pràctica.');
      return;
    }

    if (!password) {
      setError('Introdueix la contrasenya per accedir-hi.');
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const ok = await verifyClassroomPassword(password);
      if (ok) {
        onUnlock({ name: cleanName, group: cleanGroup });
      } else {
        setError('Contrasenya incorrecta. Torna-ho a provar.');
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Lock className="w-4 h-4" />
            <span>Accés per a l’alumnat</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Notació 10
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Identifica’t i introdueix la contrasenya facilitada pel
            professorat per començar a practicar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="student-name"
              className="block text-sm font-medium text-slate-700"
            >
              Nom i cognoms
            </label>
            <input
              id="student-name"
              type="text"
              autoFocus
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex: Marta Soler"
              className="w-full h-11 px-3.5 text-base bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="student-group"
              className="block text-sm font-medium text-slate-700"
            >
              Grup o classe
            </label>
            <input
              id="student-group"
              type="text"
              maxLength={40}
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Ex: 3r ESO A"
              className="w-full h-11 px-3.5 text-base bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="classroom-password"
              className="block text-sm font-medium text-slate-700"
            >
              Contrasenya
            </label>
            <div className="relative">
              <input
                id="classroom-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Introdueix la contrasenya"
                className="w-full h-11 pl-3.5 pr-11 text-base bg-white border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? 'Amagar contrasenya' : 'Mostrar contrasenya'
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-800"
            >
              <XCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={checking}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-colors cursor-pointer disabled:opacity-60"
          >
            {checking ? 'Verificant...' : 'Entrar a practicar'}
          </button>
        </form>
      </div>
    </div>
  );
};
