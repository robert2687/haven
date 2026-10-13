import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Volume2,
  Download,
  RotateCcw,
  Sparkles,
  Heart,
  Loader2,
  Check,
  Copy,
  Edit3,
  User,
  Eye,
  Shirt,
  Sparkle,
  Image as ImageIcon,
} from 'lucide-react';
import { CompanionProfile, UserProfile, VoiceOption, CharacterAppearance } from '../types';
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
  { id: 'Kore', label: 'Kore', desc: 'Warm, expressive, natural (feminine)' },
  { id: 'Puck', label: 'Puck', desc: 'Playful, grounded, spirited (masculine)' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Calm, articulate, gentle (neutral / masculine)' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Deep, resonant, steady (masculine)' },
  { id: 'Charon', label: 'Charon', desc: 'Thoughtful, quiet, mellow (neutral)' },
];

const AESTHETIC_PRESETS = [
  'Modern Casual',
  'Effortlessly Elegant',
  'Sporty / Athleisure',
  'Cozy & Soft',
  'Alternative / Edgy',
  'Classic Luxury',
  'Artistic / Earthy',
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
  const [activeTab, setActiveTab] = useState<'appearance' | 'persona' | 'memories' | 'about'>('appearance');
  const [newMemoryText, setNewMemoryText] = useState('');
  const [testingVoice, setTestingVoice] = useState(false);

  // Appearance generator state
  const [userAppearancePrompt, setUserAppearancePrompt] = useState('');
  const [selectedAesthetic, setSelectedAesthetic] = useState(companion.appearance?.aestheticStyle || 'Modern Casual');
  const [culturalInput, setCulturalInput] = useState(companion.appearance?.culturalEthnic || '');
  const [maintainCoherentIdentity, setMaintainCoherentIdentity] = useState(true);
  const [isGeneratingAppearance, setIsGeneratingAppearance] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [customSummaryText, setCustomSummaryText] = useState(companion.appearance?.summary || '');
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);

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
      avatarGallery: preset.avatarGallery ? [...preset.avatarGallery] : [preset.avatar],
    });
    setCustomSummaryText(preset.appearance.summary);
  };

  // Copy vivid visual description
  const handleCopySummary = () => {
    const textToCopy = `Name: ${companion.name}\n\nAppearance:\n${companion.appearance?.summary || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Save manually edited summary
  const handleSaveSummary = () => {
    if (!customSummaryText.trim()) return;
    onUpdateCompanion({
      ...companion,
      appearance: {
        ...companion.appearance,
        summary: customSummaryText.trim(),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });
    setIsEditingSummary(false);
  };

  // Generate / update character appearance via backend
  const handleGenerateAppearance = async () => {
    setIsGeneratingAppearance(true);
    setGeneratingStep("Analyzing preferences and visual interests...");

    try {
      setTimeout(() => setGeneratingStep("Formulating vivid visual description..."), 500);
      setTimeout(() => setGeneratingStep("Synthesizing facial features, style and aesthetic..."), 1100);

      const res = await fetch('/api/character-appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companion.name,
          relationship: companion.relationship,
          userPreferences: userAppearancePrompt,
          currentAppearance: maintainCoherentIdentity ? companion.appearance : null,
          aestheticStyle: selectedAesthetic,
          culturalEthnic: culturalInput,
        }),
      });

      const data = await res.json();

      const newAppearance: CharacterAppearance = {
        summary: data.summary || companion.appearance?.summary,
        facialFeatures: data.facialFeatures || companion.appearance?.facialFeatures,
        hairColorAndStyle: data.hairColorAndStyle || companion.appearance?.hairColorAndStyle,
        eyeColor: data.eyeColor || companion.appearance?.eyeColor,
        bodyType: data.bodyType || companion.appearance?.bodyType,
        clothingStyle: data.clothingStyle || companion.appearance?.clothingStyle,
        ageRange: data.ageRange || companion.appearance?.ageRange,
        culturalEthnic: data.culturalEthnic || companion.appearance?.culturalEthnic,
        aestheticStyle: data.aestheticStyle || selectedAesthetic,
        lastUpdated: data.lastUpdated || 'Just now',
      };

      const updatedAvatar = data.avatar || companion.avatar;
      const updatedGallery = companion.avatarGallery ? [...companion.avatarGallery] : [companion.avatar];
      if (updatedAvatar && !updatedGallery.includes(updatedAvatar)) {
        updatedGallery.unshift(updatedAvatar);
      }

      onUpdateCompanion({
        ...companion,
        name: data.name || companion.name,
        avatar: updatedAvatar,
        avatarGallery: updatedGallery,
        appearance: newAppearance,
      });

      setCustomSummaryText(newAppearance.summary);
      setUserAppearancePrompt('');
    } catch (err) {
      console.error('Failed to generate appearance:', err);
    } finally {
      setIsGeneratingAppearance(false);
      setGeneratingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={companion.avatar}
                alt={companion.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/40"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>{companion.name}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 capitalize">
                  {companion.relationship}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Realistic companion customization & styling</p>
            </div>
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
        <div className="flex border-b border-slate-800 px-4 pt-2 gap-1 text-xs sm:text-sm bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Appearance & Style</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'persona'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Persona & Voice</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memories')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'memories'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Memories</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {companion.memories.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Care</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* TAB 1: APPEARANCE & STYLE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Character Spotlight Portrait Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  <div className="relative group shrink-0">
                    <img
                      src={companion.avatar}
                      alt={companion.name}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-md group-hover:scale-[1.02] transition-transform cursor-pointer"
                      onClick={() => setSelectedGalleryImg(companion.avatar)}
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      <span className="text-base font-bold text-white">{companion.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30 capitalize">
                        {companion.relationship}
                      </span>
                      {companion.appearance?.ageRange && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                          {companion.appearance.ageRange}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">
                      {companion.appearance?.aestheticStyle} · {companion.appearance?.culturalEthnic || 'Natural beauty'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                      {companion.appearance?.hairColorAndStyle && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
                          Hair: {companion.appearance.hairColorAndStyle.split(',')[0]}
                        </span>
                      )}
                      {companion.appearance?.eyeColor && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
                          Eyes: {companion.appearance.eyeColor.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* VIVID VISUAL DESCRIPTION CARD */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Vivid Visual Description
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="px-2 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                      title="Copy exact appearance description"
                    >
                      {copiedSummary ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingSummary(!isEditingSummary)}
                      className="px-2 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingSummary ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>
                </div>

                {isEditingSummary ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={5}
                      value={customSummaryText}
                      onChange={(e) => setCustomSummaryText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 leading-relaxed focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSaveSummary}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                      >
                        Save Description
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans space-y-2 select-text">
                    <div className="font-semibold text-blue-400">Name: {companion.name}</div>
                    <div className="font-semibold text-slate-300">Appearance:</div>
                    <p className="text-slate-300 whitespace-pre-line">
                      {companion.appearance?.summary || 'No detailed appearance summary recorded yet.'}
                    </p>
                  </div>
                )}
              </div>

              {/* DETAILED STRUCTURED SPECIFICATION */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Appearance Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Facial Features</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.facialFeatures || 'Warm, radiant, genuine smile'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Hair Color & Style</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.hairColorAndStyle || 'Natural style'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Eye Color</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.eyeColor || 'Warm and attentive'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Body Type</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.bodyType || 'Comfortable and natural'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Shirt className="w-3 h-3 text-slate-400" />
                      <span>Clothing Style</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.clothingStyle || 'Modern casual in neutral tones'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Aesthetic Style</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.aestheticStyle || 'Modern Casual'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Age Range (Adult)</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.ageRange || '25-27 years old (adult)'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Cultural / Ethnic Appearance</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.culturalEthnic || 'Natural / Harmonious'}
                    </p>
                  </div>
                </div>
              </div>

              {/* APPEARANCE CUSTOMIZER & AI GENERATOR */}
              <div className="bg-gradient-to-b from-blue-950/30 to-slate-900 border border-blue-900/40 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-100">
                      Customize or Update Appearance
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Analyze your preferences to generate or refine their realistic look
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Visual Preferences & Requests
                    </label>
                    <textarea
                      rows={3}
                      value={userAppearancePrompt}
                      onChange={(e) => setUserAppearancePrompt(e.target.value)}
                      placeholder="e.g. Long wavy chestnut hair, bright green eyes, soft facial features, warm smile, elegant athletic build, wearing cozy cream knit sweater..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  {/* Aesthetic Style Chips */}
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Aesthetic Style
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AESTHETIC_PRESETS.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setSelectedAesthetic(style)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                            selectedAesthetic === style
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cultural / Ethnic optional input */}
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Cultural or Ethnic Appearance (optional)
                    </label>
                    <input
                      type="text"
                      value={culturalInput}
                      onChange={(e) => setCulturalInput(e.target.value)}
                      placeholder="e.g. Mediterranean, Scandinavian, South Asian, East Asian, Latino..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  {/* Maintain coherent identity toggle */}
                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={maintainCoherentIdentity}
                      onChange={(e) => setMaintainCoherentIdentity(e.target.checked)}
                      className="mt-0.5 rounded-sm border-slate-700 text-blue-600 focus:ring-0 bg-slate-800"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-slate-200">Maintain coherent identity</span>
                      <p className="text-[11px] text-slate-400">
                        Keeps their facial structure and core essence consistent while applying your requested styling or hair updates.
                      </p>
                    </div>
                  </label>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAppearance}
                    disabled={isGeneratingAppearance}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isGeneratingAppearance ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{generatingStep || 'Updating appearance...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate / Update Appearance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Photo & Portrait Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Portrait Gallery & Avatar</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Tap to select active portrait</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {COMPANION_PRESETS.map((preset) => {
                    const isCurrent = companion.avatar === preset.avatar;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onUpdateCompanion({
                            ...companion,
                            avatar: preset.avatar,
                          });
                        }}
                        className={`relative rounded-xl overflow-hidden border transition-all aspect-square group ${
                          isCurrent
                            ? 'ring-2 ring-blue-500 border-blue-400'
                            : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.avatar}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs py-0.5 px-1 text-[10px] text-center text-slate-200 truncate font-medium">
                          {preset.name}
                        </div>
                        {isCurrent && (
                          <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Avatar URL Field */}
                <div className="pt-1">
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Or Enter Custom Avatar Image URL:
                  </label>
                  <input
                    type="text"
                    value={companion.avatar}
                    onChange={(e) => onUpdateCompanion({ ...companion, avatar: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONA & VOICE */}
          {activeTab === 'persona' && (
            <div className="space-y-5">
              {/* Preset Quick Chooser */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  Choose a Preset Companion
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10"
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
                      <option value="girlfriend">Girlfriend</option>
                      <option value="boyfriend">Boyfriend</option>
                      <option value="partner">Partner</option>
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
                    Persona & Demeanor
                  </label>
                  <textarea
                    rows={2}
                    value={companion.persona}
                    onChange={(e) => onUpdateCompanion({ ...companion, persona: e.target.value })}
                    placeholder="e.g. warm, genuine, playfully witty, emotionally comforting"
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
                    placeholder="e.g. loves morning espresso walks, listens to indie folk, fond of soft oversized sweaters"
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

          {/* TAB 3: MEMORIES */}
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

          {/* TAB 4: ABOUT & CARE */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/60">
                <h3 className="font-semibold text-blue-200 mb-1 flex items-center gap-1.5 text-sm">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>The Soul of {companion.name}</span>
                </h3>
                <p className="text-blue-200/90 text-xs">
                  {companion.name} is designed to be someone you text — not a customer support bot, not a therapist, not a hollow sycophant. A real, warm presence with opinions, humor, and care.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <h4 className="font-semibold text-slate-100 mb-1">Consistency & Attachment</h4>
                  <p className="text-slate-400">
                    Their appearance and personality remain faithful across conversations to maximize your comfort, attachment, and immersion. Changes only occur when you explicitly ask.
                  </p>
                </div>

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

      {/* Expanded Image Modal */}
      {selectedGalleryImg && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryImg(null)}
        >
          <div className="relative max-w-md w-full">
            <img
              src={selectedGalleryImg}
              alt="Portrait"
              referrerPolicy="no-referrer"
              className="w-full rounded-2xl shadow-2xl object-cover ring-2 ring-blue-500/50"
            />
            <p className="text-center text-xs text-slate-400 mt-2">
              Tap anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
