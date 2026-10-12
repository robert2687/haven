import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Image as ImageIcon, Sparkles, X, Mic, MicOff, Camera } from 'lucide-react';
import { QUICK_MOMENTS } from '../presets';

interface ChatInputProps {
  onSendMessage: (text: string, image?: { mimeType: string; data: string }) => void;
  disabled?: boolean;
  onTyping?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false, onTyping }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ mimeType: string; data: string; preview: string } | null>(null);
  const [showMoments, setShowMoments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((!text.trim() && !selectedImage) || disabled) return;

    onSendMessage(
      text.trim(),
      selectedImage ? { mimeType: selectedImage.mimeType, data: selectedImage.data } : undefined
    );

    setText('');
    setSelectedImage(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedImage({
        mimeType: file.type || 'image/jpeg',
        data: base64Data,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Web Speech API for voice dictation if supported
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  return (
    <div className="shrink-0 bg-slate-900/95 border-t border-slate-800 p-3 relative z-10">
      {/* Quick Life Moments / Conversation Starters Bar */}
      {showMoments && (
        <div className="mb-3 p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Quick Life Moments
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
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/40 transition-colors"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Image Preview Pill */}
      {selectedImage && (
        <div className="mb-2 flex items-center gap-2 p-1.5 bg-slate-800 rounded-xl border border-slate-700 w-fit">
          <img
            src={selectedImage.preview}
            alt="Preview"
            className="w-12 h-12 object-cover rounded-lg"
          />
          <span className="text-xs text-slate-300">Photo attached</span>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

        {/* Image Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 transition-colors shrink-0"
          title="Send photo"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder="iMessage..."
          disabled={disabled}
          className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-[14.5px] py-1.5 px-1 resize-none focus:outline-hidden min-h-[36px] max-h-[120px]"
        />

        {/* Mic speech-to-text dictation button */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`p-2 rounded-xl transition-colors shrink-0 ${
            isRecording
              ? 'text-red-400 bg-red-950/50 animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
          title="Dictate message"
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && !selectedImage) || disabled}
          className={`p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            text.trim() || selectedImage
              ? 'bg-blue-600 text-white hover:bg-blue-500 scale-100 shadow-md'
              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
          }`}
          title="Send text"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
