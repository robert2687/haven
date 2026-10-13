import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Image as ImageIcon,
  Sparkles,
  X,
  Mic,
  MicOff,
  Square,
  Trash2,
  Play,
  Pause,
  Eye,
  FileImage,
  AlertCircle,
  Volume2,
  Check,
  Radio,
} from 'lucide-react';
import { QUICK_MOMENTS } from '../presets';

export interface AttachedPhoto {
  name: string;
  sizeFormatted: string;
  mimeType: string;
  data: string; // base64 string without data: prefix
  previewUrl: string; // full data URL for preview
}

export interface AttachedAudioNote {
  audioUrl: string; // base64 data URL
  duration: number; // in seconds
  mimeType: string;
}

interface ChatInputProps {
  onSendMessage: (
    text: string,
    image?: { mimeType: string; data: string },
    audio?: AttachedAudioNote
  ) => void;
  disabled?: boolean;
  onTyping?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  onTyping,
}) => {
  const [text, setText] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<AttachedPhoto | null>(null);
  const [showMoments, setShowMoments] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Voice Note Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // in seconds
  const [recordingMillis, setRecordingMillis] = useState(0); // for smooth millisecond display
  const [audioLevels, setAudioLevels] = useState<number[]>(
    Array.from({ length: 24 }, (_, i) => 15 + Math.round(Math.sin(i * 0.5) * 10))
  );
  const [volumeLevel, setVolumeLevel] = useState(0); // normalized 0 to 1
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<AttachedAudioNote | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [isDictating, setIsDictating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice Note Media References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recordingDurationRef = useRef<number>(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Safe haptic feedback utility for mobile touch
  const triggerHaptic = (ms: number = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore if not supported
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Clean up all audio recording streams and contexts
  const cleanupRecordingHardware = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecordingHardware();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, [cleanupRecordingHardware]);

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format with tenths for high-precision recording timer
  const formatPrecisionTimer = (seconds: number, millis: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((millis % 1000) / 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  // Start recording voice note using Microphone API
  const startRecordingVoiceNote = async () => {
    triggerHaptic(25);
    setRecordingError(null);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setIsPlayingPreview(false);
      setPreviewCurrentTime(0);
    }
    setRecordedAudio(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Microphone audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Select supported audio MIME type
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecordingAudio(true);
      setRecordingDuration(0);
      setRecordingMillis(0);
      recordingDurationRef.current = 0;

      // Smooth duration timer (100ms interval for precise mobile feedback)
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const secs = Math.floor(elapsed / 1000);
        setRecordingDuration(secs);
        setRecordingMillis(elapsed);
        recordingDurationRef.current = Math.max(1, secs);
      }, 100);

      // Web Audio API real-time visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128; // gives 64 bins for smooth spectrum
          analyser.smoothingTimeConstant = 0.65;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let phase = 0;

          const updateVisualizer = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            // Compute overall volume RMS
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setVolumeLevel(Math.min(1, avg / 75));

            // Generate 24 responsive audio waveform bars
            const barCount = 24;
            const bars: number[] = [];
            phase += 0.12;

            for (let i = 0; i < barCount; i++) {
              const binIndex = Math.min(
                dataArray.length - 1,
                Math.floor((i / barCount) * dataArray.length)
              );
              const rawVal = dataArray[binIndex] || 0;
              const normalized = Math.round((rawVal / 255) * 88);

              // Organic idle breathing wave so silent mic still feels responsive and alive
              const idleWave = Math.sin(phase + i * 0.45) * 8 + 14;
              const finalHeight = Math.max(
                12,
                Math.min(100, normalized > 10 ? normalized + 12 : idleWave)
              );
              bars.push(Math.round(finalHeight));
            }

            setAudioLevels(bars);
            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        }
      } catch (err) {
        console.warn('Audio visualizer setup failed, continuing recording', err);
      }
    } catch (err: any) {
      console.error('Failed to access microphone', err);
      cleanupRecordingHardware();
      setIsRecordingAudio(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecordingError(
          'Microphone permission was denied. Please allow microphone access in your browser or device settings.'
        );
      } else if (err.name === 'NotFoundError') {
        setRecordingError('No microphone input device was found on this device.');
      } else {
        setRecordingError(err.message || 'Could not access microphone.');
      }
    }
  };

  // Stop recording: either discard, review, or send directly
  const stopRecordingVoiceNote = (discard = false, sendDirectly = false) => {
    triggerHaptic(discard ? 15 : 25);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cleanupRecordingHardware();
      setIsRecordingAudio(false);
      return;
    }

    recorder.onstop = () => {
      cleanupRecordingHardware();
      if (discard) {
        audioChunksRef.current = [];
        setRecordingDuration(0);
        setRecordingMillis(0);
        recordingDurationRef.current = 0;
        setIsRecordingAudio(false);
        setRecordedAudio(null);
        return;
      }

      const mime = recorder.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mime });
      const duration = Math.max(1, recordingDurationRef.current);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const note: AttachedAudioNote = {
          audioUrl: dataUrl,
          duration,
          mimeType: mime,
        };

        if (sendDirectly) {
          onSendMessage(
            text.trim(),
            attachedPhoto
              ? { mimeType: attachedPhoto.mimeType, data: attachedPhoto.data }
              : undefined,
            note
          );
          setText('');
          setAttachedPhoto(null);
          setRecordedAudio(null);
          setIsRecordingAudio(false);
          setRecordingDuration(0);
          setRecordingMillis(0);
          recordingDurationRef.current = 0;
          setShowMoments(false);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        } else {
          setRecordedAudio(note);
          setIsRecordingAudio(false);
          setRecordingDuration(0);
          setRecordingMillis(0);
        }
      };
      reader.readAsDataURL(blob);
    };

    recorder.stop();
  };

  // Play / pause recorded audio draft preview
  const togglePreviewPlayback = () => {
    if (!recordedAudio) return;
    triggerHaptic(15);

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        if (previewAudioRef.current.ended) {
          previewAudioRef.current.currentTime = 0;
          setPreviewCurrentTime(0);
        }
        previewAudioRef.current
          .play()
          .then(() => {
            setIsPlayingPreview(true);
          })
          .catch((e) => console.error('Audio play error', e));
      }
    } else {
      const audio = new Audio(recordedAudio.audioUrl);
      audio.ontimeupdate = () => {
        setPreviewCurrentTime(audio.currentTime);
      };
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewCurrentTime(0);
        audio.currentTime = 0;
      };
      audio.onpause = () => setIsPlayingPreview(false);
      audio
        .play()
        .then(() => {
          setIsPlayingPreview(true);
          previewAudioRef.current = audio;
        })
        .catch((e) => {
          console.error('Audio play error', e);
        });
    }
  };

  // Discard draft voice note
  const handleDiscardRecordedAudio = () => {
    triggerHaptic(15);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setPreviewCurrentTime(0);
    setRecordedAudio(null);
    setRecordingDuration(0);
    setRecordingMillis(0);
    recordingDurationRef.current = 0;
  };

  // Process a selected or dropped file into an attached photo
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const sizeInKB = Math.round(file.size / 1024);
    const sizeFormatted =
      sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(file.type || 'image/jpeg', 0.88);
          const base64Data = compressedDataUrl.split(',')[1];

          setAttachedPhoto({
            name: file.name || 'photo.jpg',
            sizeFormatted,
            mimeType: file.type || 'image/jpeg',
            data: base64Data,
            previewUrl: compressedDataUrl,
          });
        } else {
          const base64Data = originalDataUrl.split(',')[1];
          setAttachedPhoto({
            name: file.name || 'photo.jpg',
            sizeFormatted,
            mimeType: file.type || 'image/jpeg',
            data: base64Data,
            previewUrl: originalDataUrl,
          });
        }
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Paste image directly from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files[0]) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        processImageFile(file);
      }
    }
  };

  // Send message
  const handleSend = () => {
    if (isRecordingAudio) {
      stopRecordingVoiceNote(false, true);
      return;
    }

    if (!text.trim() && !attachedPhoto && !recordedAudio) return;

    triggerHaptic(20);
    onSendMessage(
      text.trim(),
      attachedPhoto
        ? {
            mimeType: attachedPhoto.mimeType,
            data: attachedPhoto.data,
          }
        : undefined,
      recordedAudio || undefined
    );

    setText('');
    setAttachedPhoto(null);
    setRecordedAudio(null);
    setShowMoments(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setPreviewCurrentTime(0);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Key down in textarea: Enter sends, Shift+Enter adds newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Speech to Text Dictation toggle
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech-to-text dictation is not supported in this browser.');
      return;
    }

    if (isDictating) {
      setIsDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsDictating(true);
      recognition.onend = () => setIsDictating(false);
      recognition.onerror = () => setIsDictating(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.start();
    } catch {
      setIsDictating(false);
    }
  };

  const hasContentToSend = Boolean(text.trim() || attachedPhoto || recordedAudio);

  return (
    <div
      className={`shrink-0 bg-slate-900/98 backdrop-blur-md border-t border-slate-800/90 p-2 sm:p-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-3 relative z-10 transition-colors ${
        isDragging ? 'bg-blue-950/40 border-blue-500' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Microphone Error Alert */}
      {recordingError && (
        <div className="mb-2 p-2.5 px-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-center justify-between text-xs text-rose-200 animate-in fade-in duration-150 shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="leading-snug">{recordingError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRecordingError(null)}
            className="text-rose-400 hover:text-rose-100 p-1.5 rounded-lg shrink-0 touch-manipulation"
            aria-label="Dismiss microphone error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Life Moments / Conversation Starters Bar (Mobile horizontally scrollable) */}
      {showMoments && !isRecordingAudio && (
        <div className="mb-2.5 p-2 sm:p-2.5 bg-slate-800/95 rounded-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-lg">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Moments & Prompts</span>
            </span>
            <button
              type="button"
              onClick={() => setShowMoments(false)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              aria-label="Close prompts"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
            {QUICK_MOMENTS.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(m.prompt);
                  setShowMoments(false);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                className="whitespace-nowrap px-3 py-1.5 text-xs rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/40 active:scale-95 transition-all shrink-0"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ATTACHED LOCAL PHOTO PREVIEW CARD */}
      {attachedPhoto && !isRecordingAudio && (
        <div className="mb-2 flex items-center justify-between gap-3 p-2 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-md animate-in fade-in slide-in-from-bottom-1 duration-150 max-w-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="relative group shrink-0 cursor-pointer"
              onClick={() => setIsZoomModalOpen(true)}
              title="Click to view full preview"
            >
              <img
                src={attachedPhoto.previewUrl}
                alt="Selected attachment preview"
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{attachedPhoto.name}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {attachedPhoto.sizeFormatted} · Photo attached
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAttachedPhoto(null)}
            className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-rose-400 transition-colors shrink-0 touch-manipulation"
            title="Remove attached photo"
            aria-label="Remove attached photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RECORDED VOICE NOTE DRAFT PREVIEW (REVIEW MODE FOR MOBILE) */}
      {recordedAudio && !isRecordingAudio && (
        <div className="mb-2 p-2.5 sm:p-3 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 rounded-2xl border border-blue-500/50 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
                <Mic className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-semibold text-slate-200 truncate">
                Voice Note Draft
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-blue-300">
              {formatDuration(isPlayingPreview ? previewCurrentTime : recordedAudio.duration)} /{' '}
              {formatDuration(recordedAudio.duration)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePreviewPlayback}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-blue-600/30 active:scale-95 touch-manipulation cursor-pointer"
              title={isPlayingPreview ? 'Pause audio preview' : 'Play recorded voice note'}
              aria-label={isPlayingPreview ? 'Pause audio preview' : 'Play recorded voice note'}
            >
              {isPlayingPreview ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            {/* Interactive Progress Waveform Preview */}
            <div className="flex-1 flex items-center gap-0.5 h-6 sm:h-7 px-1 bg-slate-950/40 rounded-xl overflow-hidden">
              {[35, 60, 95, 45, 80, 100, 65, 40, 85, 70, 35, 60, 90, 50, 75, 90, 45, 65, 85, 55, 40, 70, 95, 50].map(
                (h, i) => {
                  const progressPct = recordedAudio.duration
                    ? (previewCurrentTime / recordedAudio.duration) * 100
                    : 0;
                  const barPct = (i / 24) * 100;
                  const isPassed = isPlayingPreview && barPct <= progressPct;

                  return (
                    <span
                      key={i}
                      className={`flex-1 min-w-[2px] rounded-full transition-all duration-100 ${
                        isPassed
                          ? 'bg-blue-400 shadow-xs shadow-blue-400/50'
                          : 'bg-slate-600/70'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  );
                }
              )}
            </div>

            {/* Discard Voice Note Button */}
            <button
              type="button"
              onClick={handleDiscardRecordedAudio}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 active:scale-95 transition-all shrink-0 touch-manipulation"
              title="Discard draft voice note"
              aria-label="Discard draft voice note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Add an optional text caption below, or tap Send.</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready
            </span>
          </div>
        </div>
      )}

      {/* ACTIVE MICROPHONE RECORDING HUD - MOBILE FIRST DESIGN */}
      {isRecordingAudio ? (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-rose-950/50 to-slate-900 border border-rose-500/60 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-2xl shadow-rose-950/40 animate-in fade-in duration-200">
          {/* Subtle live audio volume aura glow */}
          <div
            className="absolute -inset-1 bg-rose-500/10 pointer-events-none blur-xl transition-opacity duration-150"
            style={{ opacity: 0.3 + volumeLevel * 0.7 }}
          />

          {/* Top Status & Live Precision Timer Row */}
          <div className="relative z-10 flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              {/* Pulsing Recording Indicator with Glow Ring */}
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-xs shadow-rose-500" />
              </span>

              {/* High-visibility Monospace Timer */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded-md border border-rose-800/50">
                  REC
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-rose-100 tracking-wider drop-shadow-xs">
                  {formatPrecisionTimer(recordingDuration, recordingMillis)}
                </span>
              </div>
            </div>

            {/* Mobile Recording Mode Badge */}
            <div className="flex items-center gap-1.5 text-[11px] text-rose-300/80 font-medium">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="hidden xs:inline">Listening...</span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">
                (Up to 5 min)
              </span>
            </div>
          </div>

          {/* Dynamic Real-Time Waveform Visualizer */}
          <div className="relative z-10 w-full h-10 sm:h-12 bg-slate-950/60 rounded-xl px-2 py-1.5 flex items-center justify-between gap-[2px] sm:gap-1 border border-rose-900/30 overflow-hidden mb-2.5">
            {audioLevels.map((lvl, idx) => {
              // Calculate responsive bar gradient based on height & volume
              const isPeak = lvl > 65;
              const barColor = isPeak
                ? 'bg-gradient-to-t from-rose-500 via-amber-400 to-rose-300'
                : 'bg-gradient-to-t from-rose-600 via-rose-400 to-rose-300';

              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center h-full min-w-[2px]"
                >
                  <span
                    className={`w-full max-w-[4px] rounded-full transition-all duration-75 ${barColor} shadow-xs ${
                      isPeak ? 'shadow-rose-400/50' : ''
                    }`}
                    style={{
                      height: `${Math.max(10, lvl)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Mobile-First Touch Controls Action Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2 pt-0.5">
            {/* Cancel / Discard (Min 44px touch target) */}
            <button
              type="button"
              onClick={() => stopRecordingVoiceNote(true)}
              className="min-h-[42px] px-3 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 active:bg-rose-900 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-600/50 text-xs font-medium flex items-center gap-1.5 transition-all touch-manipulation cursor-pointer active:scale-95"
              title="Cancel & discard recording"
              aria-label="Cancel & discard recording"
            >
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Cancel</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Review / Pause Button */}
              <button
                type="button"
                onClick={() => stopRecordingVoiceNote(false, false)}
                className="min-h-[42px] px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700/80 touch-manipulation cursor-pointer active:scale-95"
                title="Stop and review before sending"
                aria-label="Stop and review before sending"
              >
                <Square className="w-3.5 h-3.5 fill-current text-amber-400 shrink-0" />
                <span>Review</span>
              </button>

              {/* Send Voice Note Directly (Thumb-sized CTA) */}
              <button
                type="button"
                onClick={() => stopRecordingVoiceNote(false, true)}
                className="min-h-[42px] px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all touch-manipulation cursor-pointer active:scale-95"
                title="Send voice note now"
                aria-label="Send voice note now"
              >
                <span>Send</span>
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD INPUT CONTROL BAR - MOBILE ERGONOMIC DESIGN */
        <div className="flex items-end gap-1.5 sm:gap-2 bg-slate-800/80 rounded-2xl border border-slate-700/70 p-1 sm:p-1.5 focus-within:border-blue-500/80 transition-colors">
          {/* Quick moments spark button */}
          <button
            type="button"
            onClick={() => setShowMoments(!showMoments)}
            className={`min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl flex items-center justify-center transition-colors shrink-0 touch-manipulation cursor-pointer ${
              showMoments
                ? 'text-amber-400 bg-slate-700/80'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 active:bg-slate-700'
            }`}
            title="Conversation starters & quick prompts"
            aria-label="Conversation starters & quick prompts"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Local Photo Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl flex items-center justify-center transition-colors shrink-0 touch-manipulation cursor-pointer ${
              attachedPhoto
                ? 'text-blue-400 bg-blue-950/60 ring-1 ring-blue-500/40'
                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 active:bg-slate-700'
            }`}
            title="Attach a photo from your device"
            aria-label="Attach a photo from your device"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Text Input / Caption (16px on mobile prevents iOS viewport zoom) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              recordedAudio
                ? 'Add a caption to your voice note...'
                : attachedPhoto
                ? 'Add a caption to your photo...'
                : 'Message or record voice note...'
            }
            disabled={disabled}
            className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-[16px] sm:text-[14.5px] py-2 px-1 resize-none focus:outline-hidden min-h-[38px] max-h-[120px] leading-normal"
          />

          {/* Dictation button (if supported) */}
          {typeof window !== 'undefined' &&
            ((window as any).SpeechRecognition ||
              (window as any).webkitSpeechRecognition) && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center transition-colors shrink-0 touch-manipulation ${
                  isDictating
                    ? 'text-amber-400 bg-amber-950/50 animate-pulse'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/60'
                }`}
                title="Dictate message text (Speech-to-Text)"
                aria-label="Dictate message text"
              >
                {isDictating ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

          {/* Microphone API Voice Note Record Button (Dedicated Mobile Tap Action) */}
          <button
            type="button"
            onClick={startRecordingVoiceNote}
            disabled={disabled}
            className="min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-slate-700/60 active:bg-rose-950/50 active:scale-95 transition-all shrink-0 group touch-manipulation cursor-pointer"
            title="Record voice note with microphone"
            aria-label="Record voice note with microphone"
          >
            <div className="relative flex items-center justify-center">
              <Mic className="w-4 h-4 group-hover:scale-110 transition-transform text-rose-400/90" />
            </div>
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContentToSend || disabled}
            className={`min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl flex items-center justify-center transition-all shrink-0 touch-manipulation ${
              hasContentToSend && !disabled
                ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-600/30 cursor-pointer'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
            title={
              recordedAudio
                ? 'Send voice note'
                : attachedPhoto
                ? 'Send photo'
                : 'Send message'
            }
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Fullsize Image Preview Modal before sending */}
      {isZoomModalOpen && attachedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/60">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {attachedPhoto.name} ({attachedPhoto.sizeFormatted})
              </span>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 touch-manipulation"
                aria-label="Close image preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={attachedPhoto.previewUrl}
                alt="Full preview"
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setAttachedPhoto(null);
                  setIsZoomModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-rose-300 hover:bg-rose-950/40 border border-rose-800/40 transition-colors touch-manipulation"
              >
                Remove Photo
              </button>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors touch-manipulation"
              >
                Keep & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
