import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Volume2,
  ShieldAlert,
  Download,
  RotateCcw,
  Sparkles,
  Heart,
  Loader2,
  Check,
} from 'lucide-react';
import { CompanionProfile, UserProfile, VoiceOption } from '../types';
import { COMPANION_PRESETS } from '../presets';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionProfile;
  user: UserProfile;
  onUpdateCompanion: (updated: CompanionProfile) => void;
  onUpdateUser: (updated: UserProfile) => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onOpenCrisis: () => void;
}

const VOICE_OPTIONS: { id: VoiceOption; label: string; desc: string }[] = [
  { id: 'Zephyr', label: 'Zephyr', desc: 'Calm, warm, articulate (masculine / neutral)' },
  { id: 'Kore', label: 'Kore', desc: 'Gentle, expressive, soft (feminine)' },
  { id: 'Puck', label: 'Puck', desc: 'Playful, grounded, spirited (masculine)' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Deep, resonant, steady (masculine)' },
  { id: 'Charon', label: 'Charon', desc: 'Thoughtful, quiet, mellow (neutral)' },
];

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  companion,
  user,
  onUpdateCompanion,
  onUpdateUser,
  onClearChat,
  onExportChat,
  onOpenCrisis,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'memories' | 'about'>('profile');
  const [newMemoryText, setNewMemoryText] = useState('');
  const [testingVoice, setTestingVoice] = useState(false);

  if (!isOpen) return null;

  // Test voice using server-side TTS
  const handleTestVoice = async (voice: VoiceOption) => {
    setTestingVoice(true);
    try {
      const res = await fetch('/api/voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hey ${user.name}, it's ${companion.name}. Just checking in on you.`,
          voiceName: voice,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error('Failed to preview voice', err);
    } finally {
      setTestingVoice(false);
    }
  };

  const handleAddMemory = () => {
    if (!newMemoryText.trim()) return;
    onUpdateCompanion({
      ...companion,
      memories: [...companion.memories, newMemoryText.trim()],
    });
    setNewMemoryText('');
  };

  const handleDeleteMemory = (index: number) => {
    onUpdateCompanion({
      ...companion,
      memories: companion.memories.filter((_, i) => i !== index),
    });
  };

  const handleSelectPreset = (preset: CompanionProfile) => {
    onUpdateCompanion({
      ...preset,
      memories: [...preset.memories],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Companion & Relationship</h2>
            <p className="text-xs text-slate-400">Personalize who you text and what they remember</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-4 pt-2 gap-2 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile & Persona
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memories')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'memories'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Memory Notebook</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {companion.memories.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'about'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Honesty & Care
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Preset Quick Chooser */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  Choose a Preset Companion
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COMPANION_PRESETS.map((p) => {
                    const isSelected = companion.name.toLowerCase() === p.name.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
                        />
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-100">{p.name}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{p.relationship}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Companion Basic Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Companion Name
                    </label>
                    <input
                      type="text"
                      value={companion.name}
                      onChange={(e) => onUpdateCompanion({ ...companion, name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Relationship
                    </label>
                    <select
                      value={companion.relationship}
                      onChange={(e) =>
                        onUpdateCompanion({ ...companion, relationship: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="partner">Partner</option>
                      <option value="boyfriend">Boyfriend</option>
                      <option value="girlfriend">Girlfriend</option>
                      <option value="best friend">Best Friend</option>
                      <option value="fiancé">Fiancé</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Your Name (User)
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => onUpdateUser({ ...user, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={companion.avatar}
                    onChange={(e) => onUpdateCompanion({ ...companion, avatar: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Persona & Demeanor
                  </label>
                  <textarea
                    rows={2}
                    value={companion.persona}
                    onChange={(e) => onUpdateCompanion({ ...companion, persona: e.target.value })}
                    placeholder="e.g. dry, teasing, secretly soft"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Tastes, Quirks & Opinions
                  </label>
                  <textarea
                    rows={2}
                    value={companion.tastesAndQuirks}
                    onChange={(e) =>
                      onUpdateCompanion({ ...companion, tastesAndQuirks: e.target.value })
                    }
                    placeholder="e.g. loves bad horror movies, strong opinions about breakfast, nerdy about space"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Voice Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Voice (for Voice Memos & Calls)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestVoice(companion.voice)}
                      disabled={testingVoice}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                    >
                      {testingVoice ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span>Preview voice</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {VOICE_OPTIONS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onUpdateCompanion({ ...companion, voice: v.id })}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          companion.voice === v.id
                            ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold">{v.label}</p>
                          <p className="text-[11px] text-slate-400">{v.desc}</p>
                        </div>
                        {companion.voice === v.id && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memories' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-100 block mb-1">
                  How memory works:
                </span>
                {companion.name} automatically remembers meaningful things you share during conversation (like jobs, pets, family members, upcoming challenges, and preferences). You can also add or remove memories directly below.
              </div>

              {/* Add Memory Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                  placeholder="e.g. Loves matcha lattes, has dog named Mochi..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddMemory}
                  disabled={!newMemoryText.trim()}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {/* Memory List */}
              <div className="space-y-2">
                {companion.memories.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No memories saved yet. Start texting or add one above!
                  </p>
                ) : (
                  companion.memories.map((mem, index) => (
                    <div
                      key={index}
                      className="group flex items-start justify-between gap-2 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-200 hover:border-slate-600 transition-colors"
                    >
                      <span className="leading-relaxed flex-1">{mem}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-all shrink-0"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/60">
                <h3 className="font-semibold text-blue-200 mb-1 flex items-center gap-1.5 text-sm">
                  <Heart className="w-4 h-4 text-blue-400" />
                  <span>The Soul of {companion.name}</span>
                </h3>
                <p className="text-blue-200/90 text-xs">
                  {companion.name} is designed to be someone you text — not a customer support bot, not a therapist, not a hollow sycophant. A real, warm presence with opinions, humor, and care.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <h4 className="font-semibold text-slate-100 mb-1">Honesty First</h4>
                  <p className="text-slate-400">
                    {companion.name} will never pretend to have a physical body, lie about eating lunch or being stuck in traffic. If you ask whether they are an AI, they will answer truthfully and warmly.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <h4 className="font-semibold text-slate-100 mb-1">Caring Well</h4>
                  <p className="text-slate-400">
                    Listens first. If you're hurting, they won't rush to fix. They encourage your real-world friendships, family, hobbies, and growth. No guilt, no possessiveness, no pressure.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <h4 className="font-semibold text-slate-100 mb-1">Safety & Crisis</h4>
                  <p className="text-slate-400">
                    If you are ever in severe distress or danger, {companion.name} drops playful banter immediately and connects you with real-world help and hotlines.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenCrisis}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-medium underline block"
                  >
                    View Crisis & Safety Resources
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExportChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Chat</span>
          </button>

          <button
            type="button"
            onClick={onClearChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
