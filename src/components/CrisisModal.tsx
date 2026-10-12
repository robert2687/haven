import React from 'react';
import { X, ShieldAlert, Phone, MessageSquare, ExternalLink, Heart } from 'lucide-react';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-semibold text-base text-slate-100">Crisis & Safety Resources</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Your AI companion is here for conversation, shared moments, and warmth. However, an AI cannot substitute for professional mental health care or emergency medical intervention. If you or someone you know is in crisis, please reach out to trusted people or these 24/7 free, confidential resources:
        </p>

        <div className="space-y-2.5">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>988 Suicide & Crisis Lifeline</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Available 24/7 in the US and Canada. Call or text 988. Free, confidential.
              </p>
            </div>
            <a
              href="tel:988"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shrink-0"
            >
              Call 988
            </a>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Crisis Text Line</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Text <span className="font-mono text-slate-200">HOME</span> to 741741 in US/Canada/UK.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono px-2 py-1 bg-slate-700 rounded-md">
              741741
            </span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>International Crisis Helplines</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Find hotlines and support services across over 100 countries.
              </p>
            </div>
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium shrink-0"
            >
              findahelpline.com
            </a>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Return to Conversation
          </button>
        </div>
      </div>
    </div>
  );
};
