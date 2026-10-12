import React from 'react';

interface TypingIndicatorProps {
  avatar?: string;
  name: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ avatar, name }) => {
  return (
    <div className="flex items-end gap-2 my-1.5 animate-fadeIn">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/10"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-xs font-medium text-slate-300">
          {name.charAt(0)}
        </div>
      )}

      <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
      </div>
    </div>
  );
};
