import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Check,
  Sparkles,
  Volume2,
  Users,
  Target,
  Briefcase,
  Zap,
  Smile,
  Heart,
  BookOpen,
  Filter,
  ArrowRight,
  Shield,
  Loader2,
  Award,
} from 'lucide-react';
import { CompanionProfile, CompanionArchetype } from '../types';

interface MarketplaceViewProps {
  companions: CompanionProfile[];
  activeCompanionId: string;
  onSelectCompanion: (companion: CompanionProfile) => void;
  onCreateCompanion: (newCompanion: CompanionProfile) => void;
  onOpenMembership: () => void;
  currentTier: 'free' | 'pro' | 'founder';
}

const ARCHETYPE_FILTERS: Array<{ id: string; label: string; icon: any }> = [
  { id: 'all', label: 'All Companions', icon: Compass },
  { id: 'mentor', label: 'Mentor', icon: Award },
  { id: 'coach', label: 'Coach', icon: Target },
  { id: 'best-friend', label: 'Best Friend', icon: Heart },
  { id: 'startup-founder', label: 'Founder', icon: Zap },
  { id: 'accountability-partner', label: 'Accountability', icon: Shield },
  { id: 'wellness-coach', label: 'Wellness', icon: Smile },
  { id: 'study-partner', label: 'Study Partner', icon: BookOpen },
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  companions,
  activeCompanionId,
  onSelectCompanion,
  onCreateCompanion,
  onOpenMembership,
  currentTier,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);

  // Custom Creator Form State
  const [creatorName, setCreatorName] = useState('');
  const [creatorArchetype, setCreatorArchetype] = useState<CompanionArchetype>('mentor');
  const [creatorPersona, setCreatorPersona] = useState('');
  const [creatorStyle, setCreatorStyle] = useState('Direct, warm, high-standard');
  const [creatorSpecialties, setCreatorSpecialties] = useState('');
  const [creatorAesthetic, setCreatorAesthetic] = useState('Modern Minimalist');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredCompanions = companions.filter((comp) => {
    if (selectedFilter === 'all') return true;
    const arch = comp.archetype || comp.relationship;
    return arch.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/custom-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: creatorName,
          archetype: creatorArchetype,
          personaDescription: creatorPersona || 'Seasoned mentor, direct feedback, supportive presence',
          communicationStyle: creatorStyle,
          specialties: creatorSpecialties
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          aesthetic: creatorAesthetic,
        }),
      });

      const newCompanion: CompanionProfile = await res.json();
      onCreateCompanion(newCompanion);
      onSelectCompanion(newCompanion);
      setIsCreatorOpen(false);
      setCreatorName('');
      setCreatorPersona('');
      setCreatorSpecialties('');
    } catch (err) {
      console.error('Failed to create companion:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Companion Marketplace
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
              Multi-Archetype
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Choose trusted partners for every dimension of life: mentors, coaches, founders, and friends.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your Own</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {ARCHETYPE_FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = selectedFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Companions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanions.map((comp) => {
          const isActive = comp.id === activeCompanionId;
          const archetypeLabel = comp.archetype || comp.relationship;

          return (
            <div
              key={comp.id}
              className={`flex flex-col justify-between rounded-2xl bg-slate-900/90 border transition-all duration-200 overflow-hidden ${
                isActive
                  ? 'border-blue-500/80 ring-2 ring-blue-500/20 shadow-lg shadow-blue-950/40'
                  : 'border-slate-800 hover:border-slate-700/80 hover:bg-slate-900'
              }`}
            >
              <div>
                {/* Header Row with Avatar & Status */}
                <div className="p-4 flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={comp.avatar}
                      alt={comp.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-800 shadow-md"
                    />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] ring-2 ring-slate-900">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-base font-semibold text-white truncate">{comp.name}</h3>
                      <span className="text-[11px] font-medium text-slate-400 capitalize">
                        {archetypeLabel.replaceAll('-', ' ')}
                      </span>
                    </div>
                    {comp.title && (
                      <p className="text-xs text-blue-300/90 font-medium truncate mt-0.5">
                        {comp.title}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {comp.persona}
                    </p>
                  </div>
                </div>

                {/* Specialties Tags */}
                {comp.specialties && comp.specialties.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {comp.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded-md px-2 py-0.5"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Active Storyline Indicator */}
                {comp.storylines && comp.storylines.length > 0 && (
                  <div className="mx-4 mb-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                      Active Storyline:
                    </span>
                    <span className="text-slate-200 font-medium">
                      {comp.storylines[0].title}
                    </span>
                    <span className="text-slate-400 block text-[10.5px] truncate">
                      → {comp.storylines[0].currentChapter}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-4 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 bg-slate-950/30">
                <span className="text-[11.5px] text-slate-400 font-mono">
                  Voice: {comp.voice}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectCompanion(comp)}
                  disabled={isActive}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-950/60 text-blue-300 border border-blue-700/50 cursor-default'
                      : 'bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 border border-slate-700/70'
                  }`}
                >
                  {isActive ? 'Active Companion' : 'Switch to Partner'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE YOUR OWN COMPANION MODAL */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Create Your Own Companion
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Design custom personalities, behavioral traits, and specialized domains.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Companion Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rowan, Dr. Sterling, Aria, David"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Archetype & Role
                </label>
                <select
                  value={creatorArchetype}
                  onChange={(e) => setCreatorArchetype(e.target.value as CompanionArchetype)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="mentor">Mentor (Strategic wisdom, high-leverage guidance)</option>
                  <option value="coach">Peak Performance Coach (Execution, accountability)</option>
                  <option value="startup-founder">Startup Founder Peer (Zero-to-one, product focus)</option>
                  <option value="best-friend">Best Friend (Deep loyalty, humor, warmth)</option>
                  <option value="accountability-partner">Accountability Partner (Daily streaks, no excuses)</option>
                  <option value="wellness-coach">Wellness Coach (Nervous system, longevity, burnout)</option>
                  <option value="study-partner">Study Partner (Deep focus, active recall)</option>
                  <option value="partner">Romantic Partner / Confidante</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Core Persona & Demeanor
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sharp, analytical, seasoned tech founder with dry humor. Gives honest feedback without sugarcoating."
                  value={creatorPersona}
                  onChange={(e) => setCreatorPersona(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Communication Style
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Direct & Concise"
                    value={creatorStyle}
                    onChange={(e) => setCreatorStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aesthetic Style
                  </label>
                  <select
                    value={creatorAesthetic}
                    onChange={(e) => setCreatorAesthetic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Modern Minimalist">Modern Minimalist</option>
                    <option value="Executive Tailored">Executive Tailored</option>
                    <option value="Tech Founder Casual">Tech Founder Casual</option>
                    <option value="Earthy Bohemian">Earthy Bohemian</option>
                    <option value="Sporty Athleisure">Sporty Athleisure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Key Specialties (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Seed Fundraising, Growth Loops, Focus Sprints"
                  value={creatorSpecialties}
                  onChange={(e) => setCreatorSpecialties(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGenerating || !creatorName.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition-all shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Persona...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
