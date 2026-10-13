import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Phone,
  Settings,
  Volume2,
  VolumeX,
  BookOpen,
  Maximize2,
  Minimize2,
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
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 select-none z-20">
      {/* Phone status bar (visible in frame mode or subtle on desktop) */}
      <div className="flex items-center justify-between px-6 pt-2 pb-1 text-[11px] font-medium text-slate-400">
        <span>{currentTime}</span>

        {/* Dynamic Island pill representation in frame mode */}
        {isFramed && (
          <div className="w-24 h-4 bg-black rounded-full mx-auto -mt-1 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-slate-950 mr-2 ring-1 ring-slate-800"></span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1">
            <span>94%</span>
            <Battery className="w-4 h-4" />
          </div>
        </div>
      </div>

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
        <div className="flex items-center gap-1 text-slate-400">
          {/* Audio call simulation */}
          <button
            type="button"
            onClick={onStartCall}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-emerald-400 transition-colors"
            title={`Simulate phone call with ${companion.name}`}
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

          {/* Memory Book count */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-blue-400 transition-colors relative"
            title={`${companion.memories.length} memories remembered about you`}
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
            title="Companion Settings & Persona"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
