import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Plane,
  Home,
  Rocket,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
} from 'lucide-react';
import { DreamPlan, TimelineEvent } from '../types';

interface DreamBoardViewProps {
  dreams: DreamPlan[];
  timeline: TimelineEvent[];
  onUpdateDreams: (dreams: DreamPlan[]) => void;
  onUpdateTimeline: (timeline: TimelineEvent[]) => void;
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const DreamBoardView: React.FC<DreamBoardViewProps> = ({
  dreams,
  timeline,
  onUpdateDreams,
  onUpdateTimeline,
  onOpenChatWithPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'dreams' | 'timeline'>('dreams');
  const [isNewDreamOpen, setIsNewDreamOpen] = useState(false);
  const [isNewTimelineOpen, setIsNewTimelineOpen] = useState(false);

  // New dream state
  const [dreamTitle, setDreamTitle] = useState('');
  const [dreamYear, setDreamYear] = useState('2026');
  const [dreamCategory, setDreamCategory] = useState<'business' | 'lifestyle' | 'travel' | 'craft' | 'financial'>('business');
  const [dreamReminder, setDreamReminder] = useState('');

  // New timeline event state
  const [eventYear, setEventYear] = useState('2026');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCategory, setEventCategory] = useState<'startup' | 'milestone' | 'habit' | 'personal'>('startup');

  const handleToggleMilestone = (dreamId: string, milestoneId: string) => {
    const updated = dreams.map((d) => {
      if (d.id !== dreamId) return d;
      const updatedMilestones = d.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completed = updatedMilestones.filter((m) => m.completed).length;
      const progress = updatedMilestones.length > 0 ? Math.round((completed / updatedMilestones.length) * 100) : 0;
      return {
        ...d,
        milestones: updatedMilestones,
        progress,
      };
    });
    onUpdateDreams(updated);
  };

  const handleCreateDream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dreamTitle.trim()) return;

    const newDream: DreamPlan = {
      id: `dream-${Date.now()}`,
      title: dreamTitle,
      category: dreamCategory,
      targetYear: dreamYear,
      progress: 20,
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Define foundation & research', completed: true, targetDate: 'Q1' },
        { id: `m-${Date.now()}-2`, title: 'Execute primary milestone sprint', completed: false, targetDate: 'Q2' },
        { id: `m-${Date.now()}-3`, title: 'Complete full vision realization', completed: false, targetDate: dreamYear },
      ],
      actionPlan: [
        'Break into weekly non-negotiable execution blocks',
        'Protect mental energy by scheduling dedicated focus time',
      ],
      motivationalReminder: dreamReminder || 'Your ambitions define your reality. Keep building.',
    };

    onUpdateDreams([newDream, ...dreams]);
    setIsNewDreamOpen(false);
    setDreamTitle('');
    setDreamReminder('');
  };

  const handleCreateTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      year: eventYear,
      title: eventTitle,
      description: eventDesc || 'Key life milestone captured in Haven.',
      category: eventCategory,
    };

    onUpdateTimeline([...timeline, newEvent]);
    setIsNewTimelineOpen(false);
    setEventTitle('');
    setEventDesc('');
  };

  // Group timeline by year
  const timelineYears = Array.from(new Set(timeline.map((t) => t.year))).sort();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-amber-400" />
              Dream Board & Life Planning
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
              Evolving Life Story
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Define lifelong aspirations, track sequential milestones, and visualize your life arc across time.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('dreams')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'dreams' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dream Board
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'timeline' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Life Timeline
          </button>
        </div>
      </div>

      {activeTab === 'dreams' ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Long-Term Aspirations ({dreams.length})
            </span>
            <button
              type="button"
              onClick={() => setIsNewDreamOpen(true)}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dream</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dreams.map((dream) => (
              <div
                key={dream.id}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      Target: {dream.targetYear}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {dream.progress}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {dream.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-4 border border-slate-800">
                    <div
                      className="bg-linear-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all"
                      style={{ width: `${dream.progress}%` }}
                    />
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Milestones
                    </span>
                    {dream.milestones.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMilestone(dream.id, m.id)}
                        className="w-full flex items-center gap-2 text-left text-xs py-1 text-slate-300 hover:text-white"
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className={`truncate ${m.completed ? 'line-through text-slate-400' : ''}`}>
                          {m.title}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Motivational reminder */}
                  {dream.motivationalReminder && (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 italic">
                      "{dream.motivationalReminder}"
                    </div>
                  )}
                </div>

                {onOpenChatWithPrompt && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenChatWithPrompt(
                        `Let's discuss my dream: "${dream.title}" (target year ${dream.targetYear}). How should I break down the next milestone?`
                      )
                    }
                    className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    <span>Strategize with Companion</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Life Timeline View */
        <div className="max-w-2xl mx-auto py-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Your Life Story Timeline</h2>
              <p className="text-xs text-slate-400">
                Understanding your evolving narrative, decisions, and pivotal milestones.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewTimelineOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>

          {/* Tree-style timeline representation */}
          <div className="space-y-6">
            {timelineYears.map((year) => {
              const eventsInYear = timeline.filter((t) => t.year === year);
              return (
                <div key={year} className="relative pl-6 border-l-2 border-blue-500/50 space-y-3">
                  {/* Year marker */}
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-blue-600 ring-4 ring-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                    •
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black font-mono text-white tracking-wider">
                      {year}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({eventsInYear.length} {eventsInYear.length === 1 ? 'pivot' : 'pivots'})
                    </span>
                  </div>

                  {/* Branch items */}
                  <div className="space-y-2.5 font-mono text-xs">
                    {eventsInYear.map((item, idx) => {
                      const isLast = idx === eventsInYear.length - 1;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md font-sans"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-2">
                              <span className="font-mono text-blue-400">
                                {isLast ? '└──' : '├──'}
                              </span>
                              {item.title}
                            </span>
                            <span className="text-[10.5px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 pl-7 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE DREAM MODAL */}
      {isNewDreamOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-1">Add Life Dream</h3>
            <p className="text-xs text-slate-400 mb-4">
              Haven will automatically track milestones and supply motivational reminders.
            </p>

            <form onSubmit={handleCreateDream} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dream Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build an AI Product Studio, Buy a Coastal Sanctuary"
                  value={dreamTitle}
                  onChange={(e) => setDreamTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Year
                  </label>
                  <input
                    type="text"
                    value={dreamYear}
                    onChange={(e) => setDreamYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={dreamCategory}
                    onChange={(e) => setDreamCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="business">Business / Career</option>
                    <option value="lifestyle">Home / Sanctuary</option>
                    <option value="travel">Travel & Exploration</option>
                    <option value="craft">Creative Craft</option>
                    <option value="financial">Financial Freedom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Personal Motivational Anchor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Why does this dream matter to your future self?"
                  value={dreamReminder}
                  onChange={(e) => setDreamReminder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewDreamOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Dream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TIMELINE MODAL */}
      {isNewTimelineOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-1">Add Timeline Event</h3>
            <p className="text-xs text-slate-400 mb-4">
              Anchor key pivots and memories in your Haven life narrative.
            </p>

            <form onSubmit={handleCreateTimeline} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    required
                    value={eventYear}
                    onChange={(e) => setEventYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="startup">Startup / Work</option>
                    <option value="milestone">Life Milestone</option>
                    <option value="habit">Habit / Craft</option>
                    <option value="personal">Personal Life</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shipped First Beta, Moved to Studio"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Details & Impact
                </label>
                <textarea
                  rows={2}
                  placeholder="What changed as a result of this milestone?"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTimelineOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
