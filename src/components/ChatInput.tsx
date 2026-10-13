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
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 35, 50, 30, 60, 40, 75, 55, 30, 45, 60, 35, 45, 25]);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<AttachedAudioNote | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
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
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording voice note using Microphone API
  const startRecordingVoiceNote = async () => {
    setRecordingError(null);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setIsPlayingPreview(false);
    }
    setRecordedAudio(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Microphone audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      recordingDurationRef.current = 0;

      // Duration timer
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(secs);
        recordingDurationRef.current = secs;
      }, 500);

      // Web Audio API live visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVisualizer = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            const bars: number[] = [];
            const barCount = 14;
            const step = Math.max(1, Math.floor(dataArray.length / barCount));
            for (let i = 0; i < barCount; i++) {
              const val = dataArray[i * step] || 0;
              // Normalize to 15% - 100%
              bars.push(Math.max(15, Math.min(100, Math.round((val / 255) * 100))));
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
        setRecordingError('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setRecordingError('No microphone input device was found.');
      } else {
        setRecordingError(err.message || 'Could not access microphone.');
      }
    }
  };

  // Stop recording: either discard, review, or send directly
  const stopRecordingVoiceNote = (discard = false, sendDirectly = false) => {
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
          recordingDurationRef.current = 0;
          setShowMoments(false);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        } else {
          setRecordedAudio(note);
          setIsRecordingAudio(false);
        }
      };
      reader.readAsDataURL(blob);
    };

    recorder.stop();
  };

  // Play / pause recorded audio draft preview
  const togglePreviewPlayback = () => {
    if (!recordedAudio) return;

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        if (previewAudioRef.current.ended) {
          previewAudioRef.current.currentTime = 0;
        }
        previewAudioRef.current.play().then(() => {
          setIsPlayingPreview(true);
        }).catch((e) => console.error('Audio play error', e));
      }
    } else {
      const audio = new Audio(recordedAudio.audioUrl);
      audio.onended = () => {
        setIsPlayingPreview(false);
        audio.currentTime = 0;
      };
      audio.onpause = () => setIsPlayingPreview(false);
      audio.play().then(() => {
        setIsPlayingPreview(true);
        previewAudioRef.current = audio;
      }).catch((e) => {
        console.error('Audio play error', e);
      });
    }
  };

  // Discard draft voice note
  const handleDiscardRecordedAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setRecordedAudio(null);
    setRecordingDuration(0);
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

        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      };

      img.src = originalDataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  // Drag and drop support
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
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  // Paste image from clipboard support
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          break;
        }
      }
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !attachedPhoto && !recordedAudio) || disabled) return;

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

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setText('');
    setAttachedPhoto(null);
    setRecordedAudio(null);
    setShowMoments(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Optional Web Speech API for voice dictation
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

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
      className={`shrink-0 bg-slate-900/95 border-t border-slate-800 p-3 relative z-10 transition-colors ${
        isDragging ? 'bg-blue-950/40 border-blue-500' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Microphone Error Alert */}
      {recordingError && (
        <div className="mb-2.5 p-2.5 px-3 bg-rose-950/70 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs text-rose-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{recordingError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRecordingError(null)}
            className="text-rose-400 hover:text-rose-100 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Life Moments / Conversation Starters Bar */}
      {showMoments && !isRecordingAudio && (
        <div className="mb-3 p-2.5 bg-slate-800/95 rounded-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-lg">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Moments & Prompts</span>
            </span>
            <button
              type="button"
              onClick={() => setShowMoments(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_MOMENTS.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(m.prompt);
                  setShowMoments(false);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:white border border-slate-600/40 transition-colors"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ATTACHED LOCAL PHOTO PREVIEW CARD */}
      {attachedPhoto && !isRecordingAudio && (
        <div className="mb-2.5 flex items-center justify-between gap-3 p-2 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-md animate-in fade-in slide-in-from-bottom-1 duration-150 max-w-sm">
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
            className="p-1.5 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-rose-400 transition-colors shrink-0"
            title="Remove attached photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RECORDED VOICE NOTE DRAFT PREVIEW CARD */}
      {recordedAudio && !isRecordingAudio && (
        <div className="mb-2.5 flex items-center justify-between gap-3 p-2.5 bg-slate-800/95 rounded-2xl border border-blue-500/50 shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={togglePreviewPlayback}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shrink-0 shadow-md"
              title={isPlayingPreview ? 'Pause audio preview' : 'Play recorded voice note'}
            >
              {isPlayingPreview ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Voice Note Ready</span>
                </p>
                <span className="text-[11px] font-mono text-blue-300 font-medium">
                  {formatDuration(recordedAudio.duration)}
                </span>
              </div>

              {/* Waveform preview bars */}
              <div className="flex items-center gap-0.5 h-4 mt-1">
                {[30, 60, 95, 45, 80, 100, 65, 40, 85, 70, 35, 60, 90, 50, 75, 90, 45, 60].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPlayingPreview ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDiscardRecordedAudio}
            className="p-2 hover:bg-slate-700/80 rounded-xl text-slate-400 hover:text-rose-400 transition-colors shrink-0"
            title="Discard voice note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ACTIVE MICROPHONE RECORDING BAR */}
      {isRecordingAudio ? (
        <div className="flex items-center justify-between gap-3 bg-red-950/40 border border-red-500/60 rounded-2xl p-2 px-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            {/* Blinking record indicator */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-red-200 tracking-wider">
                REC {formatDuration(recordingDuration)}
              </span>
            </div>

            {/* Live Audio Visualizer */}
            <div className="flex items-center gap-1 h-6 px-1 sm:px-2">
              {audioLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  className="w-1 bg-red-400 rounded-full transition-all duration-75"
                  style={{ height: `${lvl}%` }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cancel / Trash recording */}
            <button
              type="button"
              onClick={() => stopRecordingVoiceNote(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors"
              title="Cancel & discard recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Stop & Review */}
            <button
              type="button"
              onClick={() => stopRecordingVoiceNote(false, false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700/80 cursor-pointer"
              title="Stop & review voice note"
            >
              <Square className="w-3.5 h-3.5 fill-current text-slate-300" />
              <span>Review</span>
            </button>

            {/* Direct Send */}
            <button
              type="button"
              onClick={() => stopRecordingVoiceNote(false, true)}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center transition-all cursor-pointer"
              title="Send voice note directly"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD INPUT CONTROL BAR */
        <div className="flex items-end gap-2 bg-slate-800/80 rounded-2xl border border-slate-700/70 p-1.5 focus-within:border-blue-500/80 transition-colors">
          {/* Quick moments spark button */}
          <button
            type="button"
            onClick={() => setShowMoments(!showMoments)}
            className={`p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 transition-colors shrink-0 ${
              showMoments ? 'text-amber-400 bg-slate-700/60' : ''
            }`}
            title="Conversation starters"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Local Photo Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              attachedPhoto
                ? 'text-blue-400 bg-blue-950/60 ring-1 ring-blue-500/40'
                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/60'
            }`}
            title="Attach a photo from your device"
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

          {/* Text Input / Caption */}
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
                ? 'Add an optional caption to your voice note...'
                : attachedPhoto
                ? 'Add a caption to your photo...'
                : 'iMessage or record voice note...'
            }
            disabled={disabled}
            className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-[14.5px] py-1.5 px-1 resize-none focus:outline-hidden min-h-[36px] max-h-[120px]"
          />

          {/* Dictation button (if supported) */}
          {typeof window !== 'undefined' &&
            ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl transition-colors shrink-0 ${
                  isDictating
                    ? 'text-amber-400 bg-amber-950/50 animate-pulse'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/60'
                }`}
                title="Dictate message text (Speech-to-Text)"
              >
                {isDictating ? <MicOff className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}

          {/* Microphone API Voice Note Record Button */}
          <button
            type="button"
            onClick={startRecordingVoiceNote}
            disabled={disabled}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors shrink-0 group"
            title="Record voice note"
          >
            <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContentToSend || disabled}
            className={`p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              hasContentToSend && !disabled
                ? 'bg-blue-600 text-white hover:bg-blue-500 scale-100 shadow-md cursor-pointer'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
            title={
              recordedAudio
                ? 'Send voice note'
                : attachedPhoto
                ? 'Send photo'
                : 'Send message'
            }
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
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
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
                className="px-3 py-1.5 rounded-xl text-xs text-rose-300 hover:bg-rose-950/40 border border-rose-800/40 transition-colors"
              >
                Remove Photo
              </button>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
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
