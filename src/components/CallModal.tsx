import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Minimize2,
  Maximize2,
  Radio,
  Sliders,
  Heart,
  Flame,
  Moon,
  Zap,
  Settings2,
  Loader2,
  Check,
} from 'lucide-react';
import {
  CompanionProfile,
  UserProfile,
  EmotionalVoiceModulation,
  VoiceCompanionSettings,
} from '../types';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionProfile;
  user: UserProfile;
  onUpdateVoiceSettings?: (settings: VoiceCompanionSettings) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

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

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  companion,
  user,
  onUpdateVoiceSettings,
  isMinimized = false,
  onToggleMinimize,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [statusMessage, setStatusMessage] = useState('Connecting to companion...');
  const [selectedModulation, setSelectedModulation] = useState<EmotionalVoiceModulation>(
    companion.voiceSettings?.emotionalModulation || 'warm'
  );
  const [handsFree, setHandsFree] = useState<boolean>(
    companion.voiceSettings?.handsFree ?? true
  );
  const [voiceEngine, setVoiceEngine] = useState<'gemini-live' | 'elevenlabs' | 'openai-realtime'>(
    companion.voiceSettings?.voiceEngine || 'gemini-live'
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastCompanionSpeech, setLastCompanionSpeech] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition for Hands-Free mode
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setCurrentTranscript(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Play companion speech audio
  const speakCompanionResponse = async (text: string) => {
    setIsSpeaking(true);
    setLastCompanionSpeech(text);

    try {
      const res = await fetch('/api/voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: companion.voice,
          emotionalModulation: selectedModulation,
        }),
      });

      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          // If hands-free is enabled and call is still active, listen automatically!
          if (handsFree && !isMuted) {
            startListening();
          }
        };

        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error('TTS speech error', err);
      setIsSpeaking(false);
    }
  };

  // Start listening to user
  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setCurrentTranscript('');
      try {
        recognitionRef.current.start();
      } catch {}
    }
  };

  // Stop listening and process user speech
  const stopListeningAndSend = async (userText: string) => {
    if (!userText.trim()) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setStatusMessage('Thinking...');

    try {
      // Call companion chat endpoint to get natural conversational reply
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionName: companion.name,
          userName: user.name,
          relationship: companion.relationship,
          persona: companion.persona,
          tastesAndQuirks: companion.tastesAndQuirks,
          appearance: companion.appearance,
          structuredMemory: companion.structuredMemory,
          moodIntelligence: companion.moodIntelligence,
          memories: companion.memories,
          latestMessage: userText,
          history: [],
        }),
      });

      const data = await res.json();
      const reply = data.bubbles?.[0] || `I hear you, ${user.name}. I'm right here with you.`;
      setStatusMessage('Speaking...');
      speakCompanionResponse(reply);
    } catch {
      setStatusMessage('Connected');
    }
  };

  // Auto-send when user finishes speech in hands-free mode
  useEffect(() => {
    if (!isListening && currentTranscript.trim() && handsFree) {
      const speechToSend = currentTranscript.trim();
      setCurrentTranscript('');
      stopListeningAndSend(speechToSend);
    }
  }, [isListening, currentTranscript, handsFree]);

  // Connect call logic
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      setCallStatus('connecting');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      return;
    }

    const timer = setTimeout(async () => {
      setCallStatus('connected');
      setStatusMessage('Connected');

      // Opening warm greeting based on user and time of day
      const hour = new Date().getHours();
      const greetingTime = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      const initialGreeting = `Hey ${user.name}! Good to hear from you this ${greetingTime}. How are you holding up today?`;
      speakCompanionResponse(initialGreeting);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen, companion, user, selectedModulation]);

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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleModulationChange = (mod: EmotionalVoiceModulation) => {
    setSelectedModulation(mod);
    onUpdateVoiceSettings?.({
      emotionalModulation: mod,
      handsFree,
      voiceEngine,
      alwaysAvailableMode: isMinimized,
    });
  };

  // Minimized floating banner mode (Always-Available Companion Mode)
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
        <div className="relative">
          <img
            src={companion.avatar}
            alt={companion.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/50"
          />
          {isSpeaking && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          )}
        </div>

        <div className="min-w-0 pr-2">
          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
            <span>{companion.name}</span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {formatDuration(callDuration)}
            </span>
          </p>
          <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
            {isSpeaking ? 'Speaking...' : isListening ? 'Listening to you...' : 'Hands-Free Voice'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleMinimize}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          title="Maximize call"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleEndCall}
          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
          title="End call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm flex flex-col items-center text-center p-6 space-y-6 relative">
        {/* Top bar controls */}
        <div className="w-full flex items-center justify-between text-slate-400">
          <button
            type="button"
            onClick={onToggleMinimize}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
            title="Minimize call to keep texting"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="text-[11px]">Background</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-colors flex items-center gap-1 text-xs ${
              showSettings ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Emotional Voice Modulation & Engine Settings"
          >
            <Settings2 className="w-4 h-4" />
            <span className="text-[11px]">Voice Engine</span>
          </button>
        </div>

        {/* Companion Avatar with Animated Speech Waves */}
        <div className="relative mt-2">
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping duration-1000" />
          )}
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-blue-500/25 animate-pulse" />
          )}
          <img
            src={companion.avatar}
            alt={companion.name}
            className={`w-28 h-28 rounded-full object-cover ring-4 relative z-10 shadow-2xl transition-all ${
              isSpeaking
                ? 'ring-emerald-400/80 scale-105'
                : isListening
                ? 'ring-blue-400/80'
                : 'ring-blue-500/30'
            }`}
          />
        </div>

        {/* Contact Info & Call Status */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">{companion.name}</h2>
          <p className="text-xs text-slate-400 capitalize">
            {companion.relationship} · Voice Companion
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 font-mono text-xs">
            <span className="text-emerald-400 font-semibold">{formatDuration(callDuration)}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[11px] capitalize">
              {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : statusMessage}
            </span>
          </div>
        </div>

        {/* Live Audio Visualizer bars */}
        {callStatus === 'connected' && (
          <div className="flex items-center gap-1.5 h-7">
            {[35, 70, 95, 55, 85, 45, 90, 65, 80, 50, 75, 40, 65].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all ${
                  isSpeaking
                    ? 'bg-emerald-400 animate-pulse'
                    : isListening
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: isSpeaking || isListening ? `${h}%` : '20%',
                  animationDuration: `${0.6 + (i % 4) * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Live Subtitle Transcript Feedback */}
        <div className="w-full min-h-[44px] bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 text-xs text-slate-300 leading-relaxed flex items-center justify-center">
          {isSpeaking ? (
            <p className="text-emerald-300 italic line-clamp-2">"{lastCompanionSpeech}"</p>
          ) : currentTranscript ? (
            <p className="text-blue-300">You: "{currentTranscript}"</p>
          ) : isListening ? (
            <p className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Listening hands-free... speak now</span>
            </p>
          ) : (
            <p className="text-slate-500 text-[11px]">
              {handsFree ? 'Hands-Free Voice Active' : 'Tap mic below to speak'}
            </p>
          )}
        </div>

        {/* Emotional Modulation Quick Pills */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
            <span>Emotional Voice Tone</span>
            <span className="text-blue-400 font-medium capitalize">{selectedModulation}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {MODULATION_OPTIONS.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleModulationChange(mod.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                  selectedModulation === mod.id
                    ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                <span>{mod.emoji}</span>
                <span>{mod.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Voice Engine Settings Drawer */}
        {showSettings && (
          <div className="w-full p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-left space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <h4 className="text-xs font-semibold text-slate-200">Voice Engine & Integration</h4>
            <div className="space-y-1.5">
              {[
                { id: 'gemini-live', label: 'Gemini Live / Studio Engine', desc: 'Real-time server-side voice with emotional modulation' },
                { id: 'elevenlabs', label: 'ElevenLabs Voice Engine', desc: 'Ultra-expressive neural voice modulation adapter' },
                { id: 'openai-realtime', label: 'OpenAI Realtime Architecture', desc: 'Low-latency duplex companion pipeline' },
              ].map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => setVoiceEngine(engine.id as any)}
                  className={`w-full p-2 rounded-xl text-left border text-xs flex items-center justify-between transition-colors ${
                    voiceEngine === engine.id
                      ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-[11px]">{engine.label}</p>
                    <p className="text-[10px] text-slate-400">{engine.desc}</p>
                  </div>
                  {voiceEngine === engine.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={handsFree}
                onChange={(e) => setHandsFree(e.target.checked)}
                className="rounded-sm border-slate-700 text-blue-600 focus:ring-0 bg-slate-800"
              />
              <span>Enable Hands-Free Voice Detection (VAD)</span>
            </label>
          </div>
        )}

        {/* Call Controls Bar */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {/* Hands-Free / Push to Talk Mic Button */}
          <button
            type="button"
            onClick={isListening ? () => stopListeningAndSend(currentTranscript) : startListening}
            className={`p-4 rounded-full transition-all ${
              isListening
                ? 'bg-blue-600 text-white ring-4 ring-blue-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isListening ? 'Tap to send speech' : 'Speak to companion'}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5 text-slate-400" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Mute Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
