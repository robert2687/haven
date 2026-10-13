import React, { useState } from 'react';
import {
  Target,
  Zap,
  Briefcase,
  TrendingUp,
  BookOpen,
  Activity,
  Heart,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { LifeCoachGoal, LifeCoachModuleType } from '../types';

interface LifeCoachViewProps {
  goals: LifeCoachGoal[];
  onUpdateGoals: (goals: LifeCoachGoal[]) => void;
  companionName?: string;
  onOpenChatWithPrompt?: (prompt: string) => void;
}

const MODULES: Array<{ id: LifeCoachModuleType; label: string; icon: any; color: string }> = [
  { id: 'business', label: 'Business Building', icon: TrendingUp, color: 'text-emerald-400' },
  { id: 'productivity', label: 'Productivity', icon: Zap, color: 'text-blue-400' },
  { id: 'career', label: 'Career Growth', icon: Briefcase, color: 'text-indigo-400' },
  { id: 'learning', label: 'Learning & Skills', icon: BookOpen, color: 'text-amber-400' },
  { id: 'fitness', label: 'Fitness & Energy', icon: Activity, color: 'text-rose-400' },
  { id: 'personal-growth', label: 'Personal Development', icon: Heart, color: 'text-purple-400' },
];

export const LifeCoachView: React.FC<LifeCoachViewProps> = ({
  goals,
  onUpdateGoals,
  companionName = 'Haven Coach',
  onOpenChatWithPrompt,
}) => {
  const [activeModule, setActiveModule] = useState<LifeCoachModuleType>('business');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [isAdvising, setIsAdvising] = useState(false);
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);

  // New goal form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<LifeCoachModuleType>('business');
  const [newAction, setNewAction] = useState('');
  const [newMetric, setNewMetric] = useState('');

  const currentGoal = goals.find((g) => g.id === selectedGoalId) || goals[0];

  const handleToggleStep = (goalId: string, stepId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      const updatedSteps = goal.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
      const completedCount = updatedSteps.filter((s) => s.done).length;
      const progress = updatedSteps.length > 0 ? Math.round((completedCount / updatedSteps.length) * 100) : 0;
      return {
        ...goal,
        steps: updatedSteps,
        progress,
      };
    });
    onUpdateGoals(updated);
  };

  const handleRequestCoachAdvice = async () => {
    if (!currentGoal) return;
    setIsAdvising(true);
    try {
      const res = await fetch('/api/life-coach/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: currentGoal.title,
          category: currentGoal.category,
          currentProgress: currentGoal.progress,
          steps: currentGoal.steps,
        }),
      });
      const data = await res.json();
      if (data.nextRecommendedAction) {
        const updated = goals.map((g) => {
          if (g.id !== currentGoal.id) return g;
          return {
            ...g,
            nextRecommendedAction: data.nextRecommendedAction,
            coachNotes: data.motivationalInsight
              ? `${data.motivationalInsight} Warning: ${data.pitfallWarning || ''}`
              : g.coachNotes,
          };
        });
        onUpdateGoals(updated);
      }
    } catch (err) {
      console.error('Failed to get coach advice:', err);
    } finally {
      setIsAdvising(false);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: LifeCoachGoal = {
      id: `goal-${Date.now()}`,
      category: newCategory,
      title: newTitle,
      progress: 10,
      nextRecommendedAction: newAction || 'Define first 15-minute milestone',
      steps: [
        { id: `s-${Date.now()}-1`, text: 'Outline key requirements', done: true },
        { id: `s-${Date.now()}-2`, text: newAction || 'Execute primary milestone', done: false },
        { id: `s-${Date.now()}-3`, text: 'Review feedback and adjust', done: false },
      ],
      metric: newMetric || 'Target: Complete in 30 days',
      coachNotes: 'Action creates momentum. Focus on the single next move.',
    };

    const updated = [newGoal, ...goals];
    onUpdateGoals(updated);
    setSelectedGoalId(newGoal.id);
    setIsNewGoalOpen(false);
    setNewTitle('');
    setNewAction('');
    setNewMetric('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              AI Life Coach
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
              Action-Oriented System
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Translating high-level ambitions into concrete execution: progress tracking, next actions, and accountability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewGoalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Module Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          const count = goals.filter((g) => g.category === m.id).length;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setActiveModule(m.id);
                const firstInCategory = goals.find((g) => g.category === m.id);
                if (firstInCategory) setSelectedGoalId(firstInCategory.id);
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-slate-800 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-[10.5px] font-mono text-slate-400">{count}</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 truncate">{m.label}</p>
            </button>
          );
        })}
      </div>

      {/* Main Action Hub */}
      {currentGoal ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card: Action Dashboard (User Brief Example Layout) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              {/* Category indicator line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-500" />

              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Active Goal
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {currentGoal.title}
                  </h2>
                  {currentGoal.metric && (
                    <p className="text-xs text-slate-400 mt-0.5">{currentGoal.metric}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Progress</span>
                  <span className="text-2xl font-black text-blue-400">{currentGoal.progress}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden mb-6 border border-slate-800">
                <div
                  className="bg-linear-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${currentGoal.progress}%` }}
                />
              </div>

              {/* Next Recommended Action Box */}
              <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-600/40 mb-6 relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                    Next Recommended Action:
                  </span>
                </div>
                <p className="text-base font-semibold text-white leading-snug">
                  {currentGoal.nextRecommendedAction}
                </p>

                <div className="mt-3 pt-3 border-t border-blue-800/40 flex items-center justify-between text-xs">
                  <span className="text-blue-300/80">Recommended by {companionName}</span>
                  <button
                    type="button"
                    onClick={handleRequestCoachAdvice}
                    disabled={isAdvising}
                    className="flex items-center gap-1.5 text-blue-300 hover:text-white font-medium"
                  >
                    {isAdvising ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Regenerate Strategy</span>
                  </button>
                </div>
              </div>

              {/* Action Steps Checklist */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Action Steps Checklist
                </h3>
                <div className="space-y-2">
                  {currentGoal.steps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleToggleStep(currentGoal.id, step.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        step.done
                          ? 'bg-slate-950/70 border-slate-800/80 text-slate-400 line-through'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-100 hover:bg-slate-900'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium">{step.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Coach Insights Box */}
            {currentGoal.coachNotes && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">Coach Perspective:</span>
                  {currentGoal.coachNotes}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: All Goals in this category */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Goals in Category
            </h3>

            <div className="space-y-2.5">
              {goals.map((g) => {
                const isSelected = g.id === currentGoal.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoalId(g.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-blue-500/80 ring-1 ring-blue-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {g.title}
                      </span>
                      <span className="text-[11px] font-mono text-blue-400 font-bold shrink-0">
                        {g.progress}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Next: {g.nextRecommendedAction}
                    </p>
                  </button>
                );
              })}
            </div>

            {onOpenChatWithPrompt && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 mt-4">
                <p className="text-xs text-indigo-200 mb-2 font-medium">
                  Need a debrief session on this goal?
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onOpenChatWithPrompt(
                      `Let's do an accountability check on my goal: "${currentGoal.title}" (Progress: ${currentGoal.progress}%). Next action is "${currentGoal.nextRecommendedAction}". What is the best strategy to complete this today?`
                    )
                  }
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <span>Debrief in Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No Goals Created Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set your first action-oriented milestone to begin tracking progress and receiving daily execution prompts.
          </p>
          <button
            type="button"
            onClick={() => setIsNewGoalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Create Goal
          </button>
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {isNewGoalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-1">Add Action-Oriented Goal</h3>
            <p className="text-xs text-slate-400 mb-4">
              Goals in Haven are tied to clear next actions rather than abstract intentions.
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Launch SaaS Product, Build 10km Running Base"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Module Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as LifeCoachModuleType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {MODULES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Immediate Next Recommended Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Publish landing page"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Metric or Deadline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50 Beta Users by Friday"
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewGoalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
