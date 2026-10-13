import React, { useState, useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Circle,
  Send,
  Loader2,
  Calendar,
  Heart,
  Flame,
  Coffee,
  BookOpen,
} from 'lucide-react';
import {
  CompanionProfile,
  UserProfile,
  MorningRoutineData,
  EveningRoutineData,
} from '../types';

interface DailyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionProfile;
  user: UserProfile;
  initialMode?: 'morning' | 'evening';
  onSendToChat: (message: string) => void;
}

export const DailyRoutineModal: React.FC<DailyRoutineModalProps> = ({
  isOpen,
  onClose,
  companion,
  user,
  initialMode = 'morning',
  onSendToChat,
}) => {
  const [mode, setMode] = useState<'morning' | 'evening'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [morningData, setMorningData] = useState<MorningRoutineData | null>(null);
  const [eveningData, setEveningData] = useState<EveningRoutineData | null>(null);
  const [completedPriorities, setCompletedPriorities] = useState<number[]>([]);
  const [userEveningNote, setUserEveningNote] = useState('');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRoutine = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/daily-companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            companionName: companion.name,
            userName: user.name,
            relationship: companion.relationship,
            structuredMemory: companion.structuredMemory,
            moodIntelligence: companion.moodIntelligence,
          }),
        });
        const data = await res.json();
        if (mode === 'morning') {
          setMorningData(data);
        } else {
          setEveningData(data);
        }
      } catch (err) {
        console.error('Failed to load daily routine', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, [isOpen, mode, companion, user]);

  if (!isOpen) return null;

  const togglePriority = (idx: number) => {
    setCompletedPriorities((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleShareMorning = () => {
    if (!morningData) return;
    const priorityList = morningData.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n');
    const msg = `🌅 Morning intention with ${companion.name}:\n\n${morningData.companionGreeting}\n\nToday's priorities:\n${priorityList}\n\nFocus: "${morningData.motivationQuote}"`;
    onSendToChat(msg);
    onClose();
  };

  const handleShareEvening = () => {
    if (!eveningData) return;
    const wins = eveningData.winsOfTheDay.join(', ');
    const note = userEveningNote.trim() ? `\nMy note: "${userEveningNote.trim()}"` : '';
    const msg = `🌙 Evening debrief with ${companion.name}:\n\nWins: ${wins}\nTomorrow's plan: ${eveningData.tomorrowPlanning}${note}`;
    onSendToChat(msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-2xl ${
                mode === 'morning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {mode === 'morning' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Daily Companion Mode</h2>
              <p className="text-[11px] text-slate-400">
                Morning intention & evening reflection with {companion.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Switch */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('morning')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'morning'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Morning Momentum</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('evening')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'evening'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Evening Reflection</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs text-slate-300 font-medium">
                {companion.name} is preparing your {mode} routine...
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Reviewing your startup goals, priorities, and emotional rhythm
              </p>
            </div>
          ) : mode === 'morning' && morningData ? (
            <div className="space-y-4">
              {/* Companion Morning Greeting */}
              <div className="p-3.5 bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-900/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <img
                    src={companion.avatar}
                    alt={companion.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400/30"
                  />
                  <span className="text-xs font-semibold text-amber-200">{companion.name}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{morningData.companionGreeting}"
                </p>
              </div>

              {/* Top Priorities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daily Top Priorities</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {completedPriorities.length}/{morningData.priorities.length} checked
                  </span>
                </div>

                <div className="space-y-1.5">
                  {morningData.priorities.map((item, idx) => {
                    const isDone = completedPriorities.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => togglePriority(idx)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          isDone
                            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 line-through'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs leading-relaxed">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Overview & Flow */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Suggested Daily Rhythm</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {morningData.scheduleOverview}
                </p>
              </div>

              {/* Motivation & Pep Talk */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Daily Motivation</span>
                </span>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{morningData.motivationQuote}"
                </p>
              </div>

              {/* Goal Reminders */}
              {morningData.goalReminders && morningData.goalReminders.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Active Goal Focus
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {morningData.goalReminders.map((g, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300"
                      >
                        🎯 {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : mode === 'evening' && eveningData ? (
            <div className="space-y-4">
              {/* Companion Evening Reflection */}
              <div className="p-3.5 bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-900/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <img
                    src={companion.avatar}
                    alt={companion.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-400/30"
                  />
                  <span className="text-xs font-semibold text-indigo-200">{companion.name}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{eveningData.companionReflection}"
                </p>
              </div>

              {/* Wins of the Day */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wins of the Day (Celebrate Progress)</span>
                </h4>
                <div className="space-y-1.5">
                  {eveningData.winsOfTheDay.map((win, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 flex items-start gap-2"
                    >
                      <span className="text-emerald-400">✨</span>
                      <span>{win}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lessons Learned */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Lessons Learned & Grace</span>
                </span>
                {eveningData.lessonsLearned.map((lesson, idx) => (
                  <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                    • {lesson}
                  </p>
                ))}
              </div>

              {/* Gratitude Prompts */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Gratitude Anchors</span>
                </span>
                {eveningData.gratitudePrompts.map((gratitude, idx) => (
                  <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                    🌱 {gratitude}
                  </p>
                ))}
              </div>

              {/* User Reflection Note Input */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Your Reflection Note
                </label>
                <textarea
                  rows={2}
                  value={userEveningNote}
                  onChange={(e) => setUserEveningNote(e.target.value)}
                  placeholder="How did you really feel today? Any thoughts you want to let go of?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Tomorrow's Planning */}
              <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-900/40 text-xs text-indigo-200">
                <span className="font-semibold block mb-0.5">Tomorrow's Setup:</span>
                {eveningData.tomorrowPlanning}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={mode === 'morning' ? handleShareMorning : handleShareEvening}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              mode === 'morning'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Debrief with {companion.name} in Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
