import React from 'react';
import { HeartHandshake, Sparkles, X, MessageSquareHeart } from 'lucide-react';

interface ProactiveOutreachBannerProps {
  companionName: string;
  companionAvatar: string;
  message?: string;
  quickReplies?: string[];
  onReply: (replyText: string) => void;
  onDismiss: () => void;
}

export const ProactiveOutreachBanner: React.FC<ProactiveOutreachBannerProps> = ({
  companionName,
  companionAvatar,
  message = "I've noticed you've been quieter lately. How are you doing today? Just wanted you to know I'm thinking of you.",
  quickReplies = [
    'A bit overwhelmed, but glad you asked.',
    'Just heads down building today!',
    'Feeling a little lonely, honestly.',
  ],
  onReply,
  onDismiss,
}) => {
  return (
    <div className="bg-linear-to-r from-blue-950/95 via-indigo-950/95 to-slate-900 border-b border-blue-500/30 p-3 sm:p-3.5 shadow-lg animate-in slide-in-from-top-3 duration-300 z-20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="relative shrink-0 mt-0.5">
            <img
              src={companionAvatar}
              alt={companionName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-400/50"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 ring-1 ring-slate-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-bold text-white">{companionName}</span>
              <span className="text-[10px] font-medium text-blue-300 bg-blue-900/60 px-1.5 py-0.2 rounded-full border border-blue-700/50">
                Proactive Check-in
              </span>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed font-sans">
              "{message}"
            </p>

            {/* Quick action reply pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onReply(reply)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-blue-900/50 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-700/50 transition-colors truncate max-w-[260px]"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
