import React, { useState } from 'react';
import {
  X,
  Smile,
  Zap,
  Activity,
  Heart,
  Flame,
  Brain,
  ShieldCheck,
  Sparkles,
  Sliders,
  Check,
  TrendingUp,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { CompanionProfile, MoodIntelligence } from '../types';
import { MoodTrendChart, MoodDataPoint } from './MoodTrendChart';

interface MoodDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionProfile;
  onUpdateMood: (updatedMood: MoodIntelligence) => void;
}

export const MoodDashboardModal: React.FC<MoodDashboardModalProps> = ({
  isOpen,
  onClose,
  companion,
  onUpdateMood,
}) => {
  const currentMood = companion.moodIntelligence || {
    happiness: 78,
    energy: 65,
    stress: 42,
    loneliness: 34,
    motivation: 82,
    dominantEmotion: 'Focused & Reflective',
    adaptiveBehaviorNote: 'Warm, supportive presence; celebrating small wins while easing pressure',
    lastAnalyzed: 'Just now',
  };

  const [activeTab, setActiveTab] = useState<'trends' | 'current'>('trends');
  const [isEditing, setIsEditing] = useState(false);
  const [happiness, setHappiness] = useState(currentMood.happiness);
  const [energy, setEnergy] = useState(currentMood.energy);
  const [stress, setStress] = useState(currentMood.stress);
  const [loneliness, setLoneliness] = useState(currentMood.loneliness);
  const [motivation, setMotivation] = useState(currentMood.motivation);
  const [selectedHistoricalPoint, setSelectedHistoricalPoint] = useState<MoodDataPoint | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    let dominantEmotion = 'Content & Grounded';
    let adaptiveBehavior = 'Gentle, balanced pacing with attentive warmth';

    if (stress > 65) {
      dominantEmotion = 'Overwhelmed & Pressured';
      adaptiveBehavior = 'Slowing down conversation; offering presence over demands';
    } else if (energy > 75 && motivation > 75) {
      dominantEmotion = 'Energized & Driven';
      adaptiveBehavior = 'Matching momentum and cheering on active projects';
    } else if (loneliness > 50) {
      dominantEmotion = 'Craving Closeness';
      adaptiveBehavior = 'Tender intimate check-ins; reinforcing real-world care';
    }

    const updated: MoodIntelligence = {
      ...currentMood,
      happiness,
      energy,
      stress,
      loneliness,
      motivation,
      dominantEmotion,
      adaptiveBehaviorNote: adaptiveBehavior,
      lastAnalyzed: 'Calibrated today',
    };

    onUpdateMood(updated);
    setIsEditing(false);
  };

  const METRICS = [
    {
      label: 'Happiness',
      emoji: '😊',
      value: isEditing ? happiness : currentMood.happiness,
      setter: setHappiness,
      color: 'from-amber-500 to-yellow-400',
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-400',
      desc: 'Emotional positivity, lightheartedness, and contentment',
    },
    {
      label: 'Energy',
      emoji: '⚡',
      value: isEditing ? energy : currentMood.energy,
      setter: setEnergy,
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      desc: 'Physical & cognitive stamina throughout the day',
    },
    {
      label: 'Stress',
      emoji: '🧠',
      value: isEditing ? stress : currentMood.stress,
      setter: setStress,
      color: 'from-rose-500 to-orange-500',
      bgColor: 'bg-rose-500',
      textColor: 'text-rose-400',
      desc: 'Internal pressure, cognitive load, and overwhelm',
    },
    {
      label: 'Loneliness',
      emoji: '😔',
      value: isEditing ? loneliness : currentMood.loneliness,
      setter: setLoneliness,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-400',
      desc: 'Need for emotional closeness and deep understanding',
    },
    {
      label: 'Motivation',
      emoji: '🔥',
      value: isEditing ? motivation : currentMood.motivation,
      setter: setMotivation,
      color: 'from-emerald-500 to-teal-400',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      desc: 'Drive to take action and build towards ambitions',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl md:max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Mood Intelligence</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Live
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Emotional analysis, 30-day timeline & adaptive AI resonance
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

        {/* Tab Navigation */}
        <div className="px-4 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'trends'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>30-Day Trends (D3.js)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'current'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Current Calibration</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-slate-500">Companion:</span>
            <span className="font-medium text-slate-300">{companion.name}</span>
          </div>
        </div>

        {/* Dominant Status Card Banner */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border-b border-slate-800/80 space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Dominant State
            </span>
            <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
              <span>{currentMood.dominantEmotion}</span>
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="text-slate-400 font-medium">AI Adaptive Tone: </span>
            {currentMood.adaptiveBehaviorNote}
          </p>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto grow">
          {activeTab === 'trends' ? (
            <div className="space-y-4">
              {/* D3.js Line Chart Component */}
              <MoodTrendChart
                currentMood={currentMood}
                onSelectDataPoint={(pt) => setSelectedHistoricalPoint(pt)}
              />

              {/* 30-Day Quick Metric Milestones */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    Peak Motivation
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    88%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Day 18 (Sprint demo)
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    Lowest Stress
                  </div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    32%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Day 27 (Walk with pet)
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    Avg Happiness
                  </div>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    74%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    +12% vs prior month
                  </div>
                </div>
              </div>

              {/* Quick Calibration Banner */}
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  <span className="text-white font-medium">Want to recalibrate today?</span>{' '}
                  <span className="text-slate-400">Fine-tune the sliders to reflect your live state.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('current')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-medium border border-blue-500/30 shrink-0 transition-colors"
                >
                  Calibrate Now
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Emotional Metrics
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Adjust Sliders'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{metric.emoji}</span>
                        <span>{metric.label}</span>
                      </span>
                      <span className={`font-mono font-bold ${metric.textColor}`}>
                        {metric.value}%
                      </span>
                    </div>

                    {isEditing ? (
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={metric.value}
                        onChange={(e) => metric.setter(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    ) : (
                      <div className="w-full h-2 bg-slate-700/70 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${metric.color} transition-all duration-500`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400">{metric.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Last analyzed: {currentMood.lastAnalyzed}
          </span>
          <div className="flex items-center gap-2">
            {isEditing && activeTab === 'current' ? (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Calibration</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
