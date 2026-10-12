import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { CompanionProfile, UserProfile } from '../types';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionProfile;
  user: UserProfile;
}

export const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, companion, user }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [statusMessage, setStatusMessage] = useState('Connecting...');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      setCallStatus('connecting');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    // Connect call after 1.5 seconds
    const timer = setTimeout(async () => {
      setCallStatus('connected');
      setStatusMessage('Connected');

      // Request greeting voice note from companion
      try {
        const res = await fetch('/api/voice-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Hey ${user.name}! Just wanted to hear your voice. How are you holding up today?`,
            voiceName: companion.voice,
            style: 'Warm, intimate, quiet telephone voice call with partner',
          }),
        });
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audioRef.current = audio;
          audio.play().catch(() => {});
        }
      } catch (err) {
        console.error('Call audio generation error', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isOpen, companion, user]);

  // Duration counter
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm flex flex-col items-center text-center p-6 space-y-8">
        {/* Companion Avatar with Animated Ripple */}
        <div className="relative mt-8">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000"></div>
          <img
            src={companion.avatar}
            alt={companion.name}
            className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-500/40 relative z-10 shadow-2xl"
          />
        </div>

        {/* Contact Info & Call Status */}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{companion.name}</h2>
          <p className="text-sm text-slate-400 capitalize mt-1">{companion.relationship}</p>
          <p className="text-xs font-mono text-emerald-400 mt-2 font-medium">
            {callStatus === 'connected' ? formatDuration(callDuration) : statusMessage}
          </p>
        </div>

        {/* Voice waveform activity effect */}
        {callStatus === 'connected' && (
          <div className="flex items-center gap-1.5 h-8">
            {[40, 75, 100, 60, 85, 45, 90, 65, 80, 50, 70].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-emerald-400/80 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.8 + (i % 3) * 0.3}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Call Controls Bar */}
        <div className="flex items-center justify-center gap-8 pt-8">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
