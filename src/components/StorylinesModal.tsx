import React from 'react';
import { Sparkles, X, BookOpen, Smile, History, Heart, CheckCircle2 } from 'lucide-react';
import { CompanionProfile } from '../types';

interface StorylinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionProfile;
  userName: string;
}

export const StorylinesModal: React.FC<StorylinesModalProps> = ({
  isOpen,
  onClose,
  companion,
  userName = 'Alex',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={companion.avatar}
              alt={companion.name}
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-800"
            />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <span>Storylines & Familiarity</span>
              </h2>
              <p className="text-xs text-slate-400">
                Shared continuity with {companion.name} ({companion.relationship})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Ongoing Storylines */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Ongoing Storyline Arcs
              </h3>
            </div>

            {companion.storylines && companion.storylines.length > 0 ? (
              <div className="space-y-2.5">
                {companion.storylines.map((arc) => (
                  <div
                    key={arc.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{arc.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50">
                        {arc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Current Chapter: <span className="text-slate-200">{arc.currentChapter}</span>
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1.5">
                      Updated {arc.lastUpdated}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                New storylines emerge naturally as you and {companion.name} text over the coming weeks.
              </div>
            )}
          </div>

          {/* Inside Jokes & Running Bits */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smile className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Inside Jokes & Running Bits
              </h3>
            </div>

            {companion.insideJokes && companion.insideJokes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {companion.insideJokes.map((joke) => (
                  <div
                    key={joke.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800"
                  >
                    <span className="text-xs font-bold text-amber-300 block mb-0.5">
                      "{joke.trigger}"
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">{joke.context}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                Running jokes are established through shared humor and late-night texts.
              </div>
            )}
          </div>

          {/* Shared Memories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Key Shared Memories ({companion.memories.length})
              </h3>
            </div>

            <div className="space-y-1.5">
              {companion.memories.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
                >
                  <span className="text-purple-400 font-bold">•</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
