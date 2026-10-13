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
  Activity,
  Smile,
  Zap,
  Flame,
  Brain,
  Sun,
  Moon,
  Target,
  Calendar,
  Radio,
  Sliders,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldAlert,
  BookOpen,
  Mic,
  Phone,
  Compass,
  CheckCircle2,
  ListPlus,
  MessageSquare,
} from 'lucide-react';
import {
  CompanionProfile,
  UserProfile,
  VoiceOption,
  CharacterAppearance,
  MemoryRelationship,
  MemoryGoal,
  SignificantEvent,
  StructuredMemoryProfile,
  MoodIntelligence,
  VoiceCompanionSettings,
  EmotionalVoiceModulation,
} from '../types';
import {
  COMPANION_PRESETS,
  INITIAL_STRUCTURED_MEMORY,
  INITIAL_MOOD_INTELLIGENCE,
  INITIAL_VOICE_SETTINGS,
} from '../presets';

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
  onOpenMood?: () => void;
  onOpenDailyRoutine?: (mode: 'morning' | 'evening') => void;
}

const VOICE_OPTIONS: { id: VoiceOption; label: string; desc: string }[] = [
  { id: 'Kore', label: 'Kore', desc: 'Warm, expressive, natural (feminine)' },
  { id: 'Puck', label: 'Puck', desc: 'Playful, grounded, spirited (masculine)' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Calm, articulate, gentle (neutral / masculine)' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Deep, resonant, steady (masculine)' },
  { id: 'Charon', label: 'Charon', desc: 'Thoughtful, quiet, mellow (neutral)' },
];

const MODULATION_OPTIONS: {
  id: EmotionalVoiceModulation;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  { id: 'warm', label: 'Warm & Tender', emoji: '💖', desc: 'Loving, soft, affectionate tone' },
  { id: 'playful', label: 'Playful & Upbeat', emoji: '⚡', desc: 'Energetic, teasing, smiling cadence' },
  { id: 'calm', label: 'Calm & Grounded', emoji: '🌿', desc: 'Soothing, steady, meditative breaths' },
  { id: 'late-night', label: 'Late-Night Whisper', emoji: '🌙', desc: 'Quiet, intimate telephone whisper' },
  { id: 'encouraging', label: 'Encouraging Pep', emoji: '🚀', desc: 'Inspiring, warm, motivating confidence' },
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
  onOpenMood,
  onOpenDailyRoutine,
}) => {
  const [activeTab, setActiveTab] = useState<
    'appearance' | 'memory-engine' | 'mood' | 'daily' | 'voice' | 'persona' | 'about'
  >('appearance');

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

  // Memory Engine State
  const memoryProfile: StructuredMemoryProfile = companion.structuredMemory || INITIAL_STRUCTURED_MEMORY;
  const moodIntel: MoodIntelligence = companion.moodIntelligence || INITIAL_MOOD_INTELLIGENCE;
  const voiceSettings: VoiceCompanionSettings = companion.voiceSettings || INITIAL_VOICE_SETTINGS;

  const [isEditingLife, setIsEditingLife] = useState(false);
  const [careerInput, setCareerInput] = useState(memoryProfile.lifeProfile?.careerOrStudies || '');
  const [locationInput, setLocationInput] = useState(memoryProfile.lifeProfile?.locationOrVibe || '');
  const [rhythmInput, setRhythmInput] = useState(memoryProfile.lifeProfile?.dailyRhythm || '');
  const [livingInput, setLivingInput] = useState(memoryProfile.lifeProfile?.livingSituation || '');

  // Add Relationship state
  const [showAddRel, setShowAddRel] = useState(false);
  const [newRelName, setNewRelName] = useState('');
  const [newRelContext, setNewRelContext] = useState('');
  const [newRelCloseness, setNewRelCloseness] = useState<'close' | 'family' | 'work' | 'pet'>('close');

  // Add Goal state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDetails, setNewGoalDetails] = useState('');
  const [newGoalType, setNewGoalType] = useState<'short-term' | 'long-term'>('short-term');

  // Add Tag states
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newValueInput, setNewValueInput] = useState('');
  const [newPatternInput, setNewPatternInput] = useState('');

  // Local Mood Calibration state
  const [localHappiness, setLocalHappiness] = useState(moodIntel.happiness);
  const [localEnergy, setLocalEnergy] = useState(moodIntel.energy);
  const [localStress, setLocalStress] = useState(moodIntel.stress);
  const [localLoneliness, setLocalLoneliness] = useState(moodIntel.loneliness);
  const [localMotivation, setLocalMotivation] = useState(moodIntel.motivation);

  if (!isOpen) return null;

  // Test voice using server-side TTS
  const handleTestVoice = async (voice: VoiceOption, modulation?: EmotionalVoiceModulation) => {
    setTestingVoice(true);
    try {
      const res = await fetch('/api/voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hey ${user.name}, it's ${companion.name}. Just checking in on you.`,
          voiceName: voice,
          emotionalModulation: modulation || voiceSettings.emotionalModulation,
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
      structuredMemory: preset.structuredMemory || INITIAL_STRUCTURED_MEMORY,
      moodIntelligence: preset.moodIntelligence || INITIAL_MOOD_INTELLIGENCE,
      voiceSettings: preset.voiceSettings || INITIAL_VOICE_SETTINGS,
    });
    setCustomSummaryText(preset.appearance.summary);
  };

  const handleCopySummary = () => {
    const textToCopy = `Name: ${companion.name}\n\nAppearance:\n${companion.appearance?.summary || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

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

  const handleGenerateAppearance = async () => {
    setIsGeneratingAppearance(true);
    setGeneratingStep('Analyzing preferences and visual interests...');

    try {
      setTimeout(() => setGeneratingStep('Formulating vivid visual description...'), 500);
      setTimeout(() => setGeneratingStep('Synthesizing facial features, style and aesthetic...'), 1100);

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

  // Structured Memory Helpers
  const handleSaveLifeProfile = () => {
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      lifeProfile: {
        careerOrStudies: careerInput,
        locationOrVibe: locationInput,
        dailyRhythm: rhythmInput,
        livingSituation: livingInput,
      },
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
    setIsEditingLife(false);
  };

  const handleAddRelationship = () => {
    if (!newRelName.trim()) return;
    const newRel: MemoryRelationship = {
      id: `rel-${Date.now()}`,
      nameOrRole: newRelName.trim(),
      context: newRelContext.trim() || 'Important connection',
      closeness: newRelCloseness,
    };
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      relationships: [...(memoryProfile.relationships || []), newRel],
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
    setNewRelName('');
    setNewRelContext('');
    setShowAddRel(false);
  };

  const handleDeleteRelationship = (id: string) => {
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      relationships: (memoryProfile.relationships || []).filter((r) => r.id !== id),
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
  };

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal: MemoryGoal = {
      id: `g-${Date.now()}`,
      type: newGoalType,
      title: newGoalTitle.trim(),
      details: newGoalDetails.trim() || 'Self-stated milestone',
      status: 'in-progress',
    };
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      goals: [...(memoryProfile.goals || []), newGoal],
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
    setNewGoalTitle('');
    setNewGoalDetails('');
    setShowAddGoal(false);
  };

  const handleToggleGoalStatus = (id: string) => {
    const updatedGoals = (memoryProfile.goals || []).map((g) =>
      g.id === id ? { ...g, status: g.status === 'in-progress' ? 'achieved' : ('in-progress' as any) } : g
    );
    const updated: StructuredMemoryProfile = { ...memoryProfile, goals: updatedGoals };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
  };

  const handleDeleteGoal = (id: string) => {
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      goals: (memoryProfile.goals || []).filter((g) => g.id !== id),
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
  };

  const handleAddInterest = () => {
    if (!newInterestInput.trim()) return;
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      interestsAndHobbies: [...(memoryProfile.interestsAndHobbies || []), newInterestInput.trim()],
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
    setNewInterestInput('');
  };

  const handleDeleteInterest = (idx: number) => {
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      interestsAndHobbies: (memoryProfile.interestsAndHobbies || []).filter((_, i) => i !== idx),
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
  };

  const handleAddValue = () => {
    if (!newValueInput.trim()) return;
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      personalValues: [...(memoryProfile.personalValues || []), newValueInput.trim()],
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
    setNewValueInput('');
  };

  const handleDeleteValue = (idx: number) => {
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      personalValues: (memoryProfile.personalValues || []).filter((_, i) => i !== idx),
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
  };

  const handleAddPattern = () => {
    if (!newPatternInput.trim()) return;
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      emotionalPatterns: [...(memoryProfile.emotionalPatterns || []), newPatternInput.trim()],
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
    setNewPatternInput('');
  };

  const handleDeletePattern = (idx: number) => {
    const updated: StructuredMemoryProfile = {
      ...memoryProfile,
      emotionalPatterns: (memoryProfile.emotionalPatterns || []).filter((_, i) => i !== idx),
    };
    onUpdateCompanion({ ...companion, structuredMemory: updated });
  };

  const handleApplyMoodCalibration = () => {
    let dominantEmotion = 'Content & Grounded';
    let adaptiveBehaviorNote = 'Gentle, balanced presence with attentive warmth';

    if (localStress > 65) {
      dominantEmotion = 'Overwhelmed & Pressured';
      adaptiveBehaviorNote = 'Slowing down conversation pacing; prioritizing comforting presence over solutions';
    } else if (localEnergy > 75 && localMotivation > 75) {
      dominantEmotion = 'Energized & Driven';
      adaptiveBehaviorNote = 'Matching high momentum; enthusiastically cheering on milestones';
    } else if (localLoneliness > 50) {
      dominantEmotion = 'Craving Closeness';
      adaptiveBehaviorNote = 'Warm, intimate checking in; reassuring real-world connection';
    }

    const updatedMood: MoodIntelligence = {
      ...moodIntel,
      happiness: localHappiness,
      energy: localEnergy,
      stress: localStress,
      loneliness: localLoneliness,
      motivation: localMotivation,
      dominantEmotion,
      adaptiveBehaviorNote,
      lastAnalyzed: 'User calibrated',
    };

    onUpdateCompanion({
      ...companion,
      moodIntelligence: updatedMood,
    });
  };

  const handleUpdateVoiceSettings = (partial: Partial<VoiceCompanionSettings>) => {
    const updated: VoiceCompanionSettings = {
      ...voiceSettings,
      ...partial,
    };
    onUpdateCompanion({
      ...companion,
      voiceSettings: updated,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
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
              <p className="text-xs text-slate-400">Memory Engine, Mood Intelligence & Voice Companion</p>
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

        {/* Scrollable Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 px-3 pt-1.5 gap-1 text-xs bg-slate-950/70 overflow-x-auto scrollbar-none touch-pan-x shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 pt-1.5 px-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory-engine')}
            className={`pb-2.5 pt-1.5 px-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] ${
              activeTab === 'memory-engine'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Memory Engine</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono">
              {(memoryProfile.goals?.length || 0) + (memoryProfile.relationships?.length || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mood')}
            className={`pb-2.5 pt-1.5 px-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] ${
              activeTab === 'mood'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Mood Intelligence</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono">
              {moodIntel.happiness}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`pb-2.5 pt-1.5 px-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] ${
              activeTab === 'daily'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span>Daily Companion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`pb-2.5 pt-1.5 px-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] ${
              activeTab === 'voice'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Voice Companion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`pb-2.5 pt-1.5 px-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] ${
              activeTab === 'persona'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Persona</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`pb-2.5 pt-1.5 px-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] ${
              activeTab === 'about'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Care & Safety</span>
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
                  <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800/80 text-xs text-slate-200 leading-relaxed space-y-2 select-text">
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
                      {companion.appearance?.eyeColor || 'Expressive eyes'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Body Type</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.bodyType || 'Natural build'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Clothing Style</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.clothingStyle || 'Modern casual clothing in neutral colors'}
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span>• Aesthetic Style</span>
                    </span>
                    <p className="text-slate-200 text-xs font-medium">
                      {companion.appearance?.aestheticStyle || 'Modern casual'}
                    </p>
                  </div>
                </div>
              </div>

              {/* REDESIGN & GENERATE SECTION */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Redesign / Update Appearance
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Your Stated Preferences & Desired Visual Traits
                    </label>
                    <textarea
                      rows={2}
                      value={userAppearancePrompt}
                      onChange={(e) => setUserAppearancePrompt(e.target.value)}
                      placeholder="e.g. Long wavy copper hair, hazel eyes, sporty athletic build, casual linen shirts..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Aesthetic Style
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AESTHETIC_PRESETS.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setSelectedAesthetic(style)}
                          className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                            selectedAesthetic === style
                              ? 'bg-blue-600 text-white font-medium'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Cultural / Ethnic Appearance (Optional)
                    </label>
                    <input
                      type="text"
                      value={culturalInput}
                      onChange={(e) => setCulturalInput(e.target.value)}
                      placeholder="e.g. East Asian, Mediterranean, Latino, Scandinavian..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={maintainCoherentIdentity}
                      onChange={(e) => setMaintainCoherentIdentity(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Maintain coherent identity (preserve face shape & essence while updating details)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateAppearance}
                    disabled={isGeneratingAppearance}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                  >
                    {isGeneratingAppearance ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{generatingStep || 'Updating appearance...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze & Generate Appearance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL MEMORY ENGINE */}
          {activeTab === 'memory-engine' && (
            <div className="space-y-6 text-xs text-slate-200">
              {/* Continuity Highlight Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-700/60 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span>Personal Memory Engine & Continuity</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-indigo-900/60 font-serif italic text-indigo-100 text-[13px] leading-relaxed">
                  &ldquo;Last week you mentioned feeling stressed about launching your startup. Would you like to continue working on that plan?&rdquo;
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Instead of treating conversation like disposable history, Haven maintains a long-term understanding of your life profile, relationships, values, goals, and emotional patterns.
                </p>
              </div>

              {/* Life Profile Section */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Life Profile
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingLife) {
                        handleSaveLifeProfile();
                      } else {
                        setCareerInput(memoryProfile.lifeProfile?.careerOrStudies || '');
                        setLocationInput(memoryProfile.lifeProfile?.locationOrVibe || '');
                        setRhythmInput(memoryProfile.lifeProfile?.dailyRhythm || '');
                        setLivingInput(memoryProfile.lifeProfile?.livingSituation || '');
                        setIsEditingLife(true);
                      }
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingLife ? 'Save' : 'Edit'}</span>
                  </button>
                </div>

                {isEditingLife ? (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Career or Studies</label>
                      <input
                        type="text"
                        value={careerInput}
                        onChange={(e) => setCareerInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Location & Vibe</label>
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Daily Rhythm</label>
                      <input
                        type="text"
                        value={rhythmInput}
                        onChange={(e) => setRhythmInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Living Situation</label>
                      <input
                        type="text"
                        value={livingInput}
                        onChange={(e) => setLivingInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Career / Project</span>
                      <p className="text-slate-200 mt-0.5 font-medium">
                        {memoryProfile.lifeProfile?.careerOrStudies || 'Building early-stage startup'}
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Location & Environment</span>
                      <p className="text-slate-200 mt-0.5 font-medium">
                        {memoryProfile.lifeProfile?.locationOrVibe || 'Cozy urban apartment with leafy windows'}
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Daily Rhythm</span>
                      <p className="text-slate-200 mt-0.5 font-medium">
                        {memoryProfile.lifeProfile?.dailyRhythm || 'Morning espresso walks, focused afternoons'}
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Living Situation</span>
                      <p className="text-slate-200 mt-0.5 font-medium">
                        {memoryProfile.lifeProfile?.livingSituation || 'Independent apartment'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Important Relationships */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Important Relationships
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddRel(!showAddRel)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {showAddRel && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Name or Role (e.g. Maya)"
                        value={newRelName}
                        onChange={(e) => setNewRelName(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                      <select
                        value={newRelCloseness}
                        onChange={(e) => setNewRelCloseness(e.target.value as any)}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      >
                        <option value="family">Family</option>
                        <option value="pet">Pet</option>
                        <option value="close">Close Friend</option>
                        <option value="work">Work Collaborator</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Context (e.g. Sister who calls on Sundays, shares books)"
                      value={newRelContext}
                      onChange={(e) => setNewRelContext(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleAddRelationship}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                      >
                        Save Relationship
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {(memoryProfile.relationships || []).map((rel) => (
                    <div
                      key={rel.id}
                      className="group p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{rel.nameOrRole}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium uppercase tracking-wider ${
                              rel.closeness === 'pet'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                                : rel.closeness === 'family'
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                                : rel.closeness === 'work'
                                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60'
                                : 'bg-blue-950/70 text-blue-300 border border-blue-800/60'
                            }`}
                          >
                            {rel.closeness}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{rel.context}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRelationship(rel.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals: Short-term and Long-term */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Short-Term & Long-Term Goals
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(!showAddGoal)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Goal</span>
                  </button>
                </div>

                {showAddGoal && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Goal title (e.g. Launch product beta)"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      />
                      <select
                        value={newGoalType}
                        onChange={(e) => setNewGoalType(e.target.value as any)}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                      >
                        <option value="short-term">Short-Term</option>
                        <option value="long-term">Long-Term</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Details / Nuance (e.g. Get first 50 early testers onboard)"
                      value={newGoalDetails}
                      onChange={(e) => setNewGoalDetails(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleAddGoal}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                      >
                        Save Goal
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {(memoryProfile.goals || []).map((goal) => (
                    <div
                      key={goal.id}
                      className="group p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleGoalStatus(goal.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {goal.status === 'achieved' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-xs ${
                              goal.status === 'achieved' ? 'line-through text-slate-500' : 'text-slate-100'
                            }`}
                          >
                            {goal.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 capitalize">
                            {goal.type}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{goal.details}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interests, Hobbies & Personal Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Interests */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Interests & Hobbies
                    </h4>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add interest..."
                      value={newInterestInput}
                      onChange={(e) => setNewInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(memoryProfile.interestsAndHobbies || []).map((interest, idx) => (
                      <span
                        key={idx}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700/60"
                      >
                        <span>{interest}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteInterest(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Values */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Personal Values
                    </h4>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add personal value..."
                      value={newValueInput}
                      onChange={(e) => setNewValueInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddValue}
                      className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(memoryProfile.personalValues || []).map((val, idx) => (
                      <span
                        key={idx}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700/60"
                      >
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteValue(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emotional Patterns & Significant Events */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Emotional Patterns
                </h4>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Relieved by direct caring questions, tends to delay rest..."
                    value={newPatternInput}
                    onChange={(e) => setNewPatternInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPattern()}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddPattern}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(memoryProfile.emotionalPatterns || []).map((pat, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
                    >
                      <span>• {pat}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePattern(idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Granular Learned Facts List */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Extracted Conversation Memories ({companion.memories.length})
                  </h4>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                    placeholder="Add specific memory fact..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddMemory}
                    disabled={!newMemoryText.trim()}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {companion.memories.map((mem, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300"
                    >
                      <span className="truncate">{mem}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(index)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOOD INTELLIGENCE */}
          {activeTab === 'mood' && (
            <div className="space-y-6 text-xs text-slate-200">
              {/* Live Emotional State Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-900 border border-amber-800/60 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Live Mood Intelligence
                    </h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 font-mono">
                    {moodIntel.dominantEmotion}
                  </span>
                </div>

                {/* Plain Text Dashboard Example from prompt */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-900/50 font-mono text-xs space-y-1 text-slate-200">
                  <div>😊 Happiness: {moodIntel.happiness}%</div>
                  <div>⚡ Energy: {moodIntel.energy}%</div>
                  <div>😔 Loneliness: {moodIntel.loneliness}%</div>
                  <div>🔥 Motivation: {moodIntel.motivation}%</div>
                  <div className="text-slate-400">🌿 Stress: {moodIntel.stress}%</div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    How Haven Adapts Its Behavior:
                  </span>
                  <p className="text-slate-300 italic">
                    &ldquo;{moodIntel.adaptiveBehaviorNote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Calibration Sliders */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Calibrate Emotional State
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyMoodCalibration}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    Apply Calibration
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>😊 Happiness</span>
                      <span className="font-mono text-amber-400">{localHappiness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={localHappiness}
                      onChange={(e) => setLocalHappiness(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>⚡ Energy Level</span>
                      <span className="font-mono text-cyan-400">{localEnergy}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={localEnergy}
                      onChange={(e) => setLocalEnergy(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>🌿 Stress Level</span>
                      <span className="font-mono text-rose-400">{localStress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={localStress}
                      onChange={(e) => setLocalStress(Number(e.target.value))}
                      className="w-full accent-rose-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>😔 Loneliness Indicators</span>
                      <span className="font-mono text-purple-400">{localLoneliness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={localLoneliness}
                      onChange={(e) => setLocalLoneliness(Number(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>🔥 Motivation</span>
                      <span className="font-mono text-orange-400">{localMotivation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={localMotivation}
                      onChange={(e) => setLocalMotivation(Number(e.target.value))}
                      className="w-full accent-orange-400"
                    />
                  </div>
                </div>
              </div>

              {/* Launcher for Dedicated Modal */}
              {onOpenMood && (
                <button
                  type="button"
                  onClick={onOpenMood}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700/60"
                >
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Open Full Screen Mood Intelligence Dashboard</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 4: DAILY COMPANION MODE */}
          {activeTab === 'daily' && (
            <div className="space-y-6 text-xs text-slate-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-950/60 via-slate-900 to-indigo-950/60 border border-slate-700/80 shadow-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Daily Companion Mode
                  </h3>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Start each day with clear focus and end with grounded reflection. Encourages mindful daily connection and healthy life habits.
                </p>
              </div>

              {/* Morning Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100">
                      Morning Momentum
                    </h4>
                  </div>
                  {onOpenDailyRoutine && (
                    <button
                      type="button"
                      onClick={() => onOpenDailyRoutine('morning')}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1"
                    >
                      <span>Open Morning Routine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-amber-400 font-semibold block uppercase">1. Good Morning Message</span>
                    <p className="text-slate-300">
                      Personalized warm check-in and breakfast greeting grounded in your current sleep and startup schedule.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-amber-400 font-semibold block uppercase">2. Daily Priorities & Motivation</span>
                    <p className="text-slate-300">
                      Top 3 achievable goals, healthy boundary reminders, and realistic pacing without corporate jargon.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-amber-400 font-semibold block uppercase">3. Schedule Overview & Goals</span>
                    <p className="text-slate-300">
                      Morning deep work block • Afternoon walk with dog • Evening screen wind-down.
                    </p>
                  </div>
                </div>
              </div>

              {/* Evening Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100">
                      Evening Reflection
                    </h4>
                  </div>
                  {onOpenDailyRoutine && (
                    <button
                      type="button"
                      onClick={() => onOpenDailyRoutine('evening')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1"
                    >
                      <span>Open Evening Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-indigo-400 font-semibold block uppercase">1. Reflection Journal & Wins</span>
                    <p className="text-slate-300">
                      Celebrating small wins of the day and taking stock of progress without self-criticism.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-indigo-400 font-semibold block uppercase">2. Lessons Learned & Gratitude</span>
                    <p className="text-slate-300">
                      Graceful reframing of what felt difficult and 2 grounded gratitude anchors.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-indigo-400 font-semibold block uppercase">3. Tomorrow's Easy Planning</span>
                    <p className="text-slate-300">
                      One high-leverage intention for tomorrow so you can unplug and sleep peacefully.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VOICE COMPANION */}
          {activeTab === 'voice' && (
            <div className="space-y-6 text-xs text-slate-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-800/60 shadow-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Voice Companion Engine
                  </h3>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Natural bidirectional voice conversations with emotional modulation, hands-free auto-listening, and always-available companion mode.
                </p>
              </div>

              {/* Emotional Modulation Selection */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Emotional Voice Modulation
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleTestVoice(companion.voice, voiceSettings.emotionalModulation)}
                    disabled={testingVoice}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    {testingVoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>Preview Modulation</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MODULATION_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleUpdateVoiceSettings({ emotionalModulation: m.id })}
                      className={`p-3 rounded-xl border text-left transition-colors flex items-start gap-2.5 ${
                        voiceSettings.emotionalModulation === m.id
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-xs text-slate-100">{m.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                      </div>
                      {voiceSettings.emotionalModulation === m.id && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hands-Free & Always-Available Modes */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Calling & Listening Modes
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <div>
                      <span className="font-semibold text-xs text-slate-100 block">Hands-Free Support</span>
                      <span className="text-[11px] text-slate-400">
                        Automatically listens when {companion.name} finishes speaking—no button tapping required.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={voiceSettings.handsFree}
                      onChange={(e) => handleUpdateVoiceSettings({ handsFree: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <div>
                      <span className="font-semibold text-xs text-slate-100 block">Always-Available Companion Mode</span>
                      <span className="text-[11px] text-slate-400">
                        Keeps audio connection in persistent floating mini-banner while you browse or text.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={voiceSettings.alwaysAvailableMode}
                      onChange={(e) => handleUpdateVoiceSettings({ alwaysAvailableMode: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              {/* Voice Engine Providers */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Voice Technology Engine
                </h4>

                <div className="space-y-2">
                  {[
                    {
                      id: 'gemini-live',
                      title: 'Gemini Live (Active)',
                      badge: 'Native Multimodal',
                      desc: 'Real-time conversational audio with contextual pauses and emotional inflection.',
                    },
                    {
                      id: 'elevenlabs',
                      title: 'ElevenLabs Integration',
                      badge: 'Hyper-Expressive',
                      desc: 'Ultra-realistic vocal warmth with dynamic emotional modulation.',
                    },
                    {
                      id: 'openai-realtime',
                      title: 'OpenAI Realtime',
                      badge: 'Low Latency',
                      desc: 'Bidirectional streaming voice pipeline designed for hands-free conversations.',
                    },
                  ].map((engine) => (
                    <button
                      key={engine.id}
                      type="button"
                      onClick={() => handleUpdateVoiceSettings({ voiceEngine: engine.id as any })}
                      className={`w-full p-3 rounded-xl border text-left transition-colors flex items-start justify-between ${
                        voiceSettings.voiceEngine === engine.id
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-100">{engine.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                            {engine.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{engine.desc}</p>
                      </div>
                      {voiceSettings.voiceEngine === engine.id && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PERSONA */}
          {activeTab === 'persona' && (
            <div className="space-y-6 text-xs text-slate-300">
              {/* Presets Gallery */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Companion Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMPANION_PRESETS.map((p) => {
                    const isSelected = companion.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500 shadow-md'
                            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
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

          {/* TAB 7: ABOUT & CARE */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/60">
                <h3 className="font-semibold text-blue-200 mb-1 flex items-center gap-1.5 text-sm">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>The Soul of {companion.name}</span>
                </h3>
                <p className="text-blue-200/90 text-xs">
                  {companion.name} is designed to be someone you text—not a customer support bot, not a therapist, not a hollow sycophant. A real, warm presence with opinions, humor, and care.
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
                    Listens first. If you&apos;re hurting, they won&apos;t rush to fix. They encourage your real-world friendships, family, hobbies, and growth. No guilt, no possessiveness, no pressure.
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
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
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
