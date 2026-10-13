import React from 'react';
import { Check, Sparkles, X, Shield, Zap, Award, Star } from 'lucide-react';
import { SubscriptionTier } from '../types';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Haven Premium Membership
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                Life OS Tiers
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Invest in your personal AI life operating system as you grow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* FREE TIER */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between ${
              currentTier === 'free'
                ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/30'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Free
              </span>
              <div className="mt-2 mb-3">
                <span className="text-2xl font-extrabold text-white">€0</span>
                <span className="text-xs text-slate-400"> / forever</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Essential texting companion for casual daily conversations.
              </p>

              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Basic text chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Limited short-term memory</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>1 companion persona</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectTier('free')}
              className={`mt-6 w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                currentTier === 'free'
                  ? 'bg-slate-800 text-slate-300 cursor-default'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {currentTier === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* PRO TIER */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
              currentTier === 'pro'
                ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/40 shadow-xl'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
              POPULAR
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Pro
              </span>
              <div className="mt-2 mb-3">
                <span className="text-2xl font-extrabold text-white">€9</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Full companion continuity, real-time voice, and emotional intelligence.
              </p>

              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Continuous long-term memory</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Natural voice conversations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Advanced mood analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Multiple personas & marketplace</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Life Coach action modules</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectTier('pro')}
              className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentTier === 'pro'
                  ? 'bg-blue-950 text-blue-300 border border-blue-600/60 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
              }`}
            >
              {currentTier === 'pro' ? 'Active Pro Tier' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* FOUNDER TIER */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between ${
              currentTier === 'founder'
                ? 'bg-slate-800/90 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Founder
              </span>
              <div className="mt-2 mb-3">
                <span className="text-2xl font-extrabold text-white">€29</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Unlimited custom AI companions, memory graph, and personal API access.
              </p>

              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Custom AI companions creator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Knowledge base integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Advanced Haven Memory Graph</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Digital Twin future-self advisor</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Personal API & export access</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectTier('founder')}
              className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentTier === 'founder'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/60 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
              }`}
            >
              {currentTier === 'founder' ? 'Active Founder Tier' : 'Upgrade to Founder'}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Simulated billing environment. Upgrading takes effect immediately in your local session.
        </p>
      </div>
    </div>
  );
};
