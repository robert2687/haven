import React from 'react';
import {
  Phone,
  Settings,
  Volume2,
  VolumeX,
  BookOpen,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Activity,
  Smile,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import { CompanionProfile } from '../types';

interface PhoneHeaderProps {
  companion: CompanionProfile;
  onOpenProfile: () => void;
  onOpenCrisis: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFramed: boolean;
  onToggleFramed: () => void;
  onStartCall: () => void;
  onOpenMood?: () => void;
  onOpenDailyRoutine?: (mode: 'morning' | 'evening') => void;
  onOpenStorylines?: () => void;
  onTriggerProactiveCheckin?: () => void;
}

export const PhoneHeader: React.FC<PhoneHeaderProps> = ({
  companion,
  onOpenProfile,
  onOpenCrisis,
  soundEnabled,
  onToggleSound,
  isFramed,
  onToggleFramed,
  onStartCall,
  onOpenMood,
  onOpenDailyRoutine,
  onOpenStorylines,
  onTriggerProactiveCheckin,
}) => {
  return (
    <header className="shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 select-none z-20">

      {/* Companion Contact Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity"
        >
          <div className="relative">
            <img
              src={companion.avatar}
              alt={companion.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            {/* Active green indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                {companion.name}
              </h2>
            </div>
            <p className="text-[12px] text-slate-400 capitalize">
              {companion.relationship} · <span className="text-emerald-400 font-medium">active now</span>
            </p>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-slate-400">
          {/* Mood Intelligence Badge */}
          {onOpenMood && (
            <button
              type="button"
              onClick={onOpenMood}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-amber-300 text-[11px] font-medium transition-colors"
              title={`Mood Intelligence: ${companion.moodIntelligence?.dominantEmotion || 'Focused & Reflective'} (${companion.moodIntelligence?.happiness ?? 78}% Happiness)`}
            >
              <span>😊</span>
              <span className="hidden xs:inline font-mono">{companion.moodIntelligence?.happiness ?? 78}%</span>
            </button>
          )}

          {/* Daily Companion Mode (Morning / Evening) */}
          {onOpenDailyRoutine && (
            <button
              type="button"
              onClick={() => {
                const hr = new Date().getHours();
                onOpenDailyRoutine(hr < 16 ? 'morning' : 'evening');
              }}
              className="p-2 rounded-full hover:bg-slate-800 transition-colors"
              title="Daily Companion Mode: Morning priorities & Evening reflection"
            >
              {new Date().getHours() < 16 ? (
                <Sun className="w-4 h-4 text-amber-400 hover:scale-110 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400 hover:scale-110 transition-transform" />
              )}
            </button>
          )}

          {/* Storylines & Inside Jokes */}
          {onOpenStorylines && (
            <button
              type="button"
              onClick={onOpenStorylines}
              className="p-2 rounded-full hover:bg-slate-800 hover:text-amber-400 transition-colors"
              title="Storylines & Inside Jokes: Active arcs and shared running bits"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Proactive Check-in / Loneliness Trigger */}
          {onTriggerProactiveCheckin && (
            <button
              type="button"
              onClick={onTriggerProactiveCheckin}
              className="p-2 rounded-full hover:bg-slate-800 hover:text-rose-400 transition-colors"
              title="Loneliness & Support: Request caring proactive check-in"
            >
              <HeartHandshake className="w-4 h-4 text-rose-400" />
            </button>
          )}

          {/* Audio call simulation (Voice Companion) */}
          <button
            type="button"
            onClick={onStartCall}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-emerald-400 transition-colors"
            title={`Start voice call with ${companion.name} (Hands-Free Voice Companion)`}
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Memory Engine Book */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-blue-400 transition-colors relative"
            title={`Personal Memory Engine: ${companion.memories.length} memories & life profile`}
          >
            <BookOpen className="w-4 h-4" />
            {companion.memories.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-slate-900"></span>
            )}
          </button>

          {/* Frame mode toggle */}
          <button
            type="button"
            onClick={onToggleFramed}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-slate-200 transition-colors hidden sm:flex"
            title={isFramed ? 'Full screen view' : 'Phone frame view'}
          >
            {isFramed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          {/* Settings / Companion editor */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Companion Settings & Customization"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
