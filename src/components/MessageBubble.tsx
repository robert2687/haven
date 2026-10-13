import React, { useState } from 'react';
import { Play, Pause, Volume2, Smile, CheckCheck, Loader2 } from 'lucide-react';
import { ChatMessage, MessageReaction } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  companionAvatar?: string;
  companionName: string;
  onReact: (messageId: string, emoji: string) => void;
  onRequestVoiceNote: (messageId: string, text: string) => Promise<void>;
  isVoiceLoading?: boolean;
}

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '🥺', '👍', '🔥'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  companionAvatar,
  companionName,
  onReact,
  onRequestVoiceNote,
  isVoiceLoading = false,
}) => {
  const isUser = message.role === 'user';
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Play audio toggle
  const togglePlayAudio = (url: string) => {
    if (audioElement) {
      if (isPlayingAudio) {
        audioElement.pause();
        setIsPlayingAudio(false);
      } else {
        if (audioElement.ended) {
          audioElement.currentTime = 0;
        }
        audioElement.play().then(() => {
          setIsPlayingAudio(true);
        }).catch((e) => {
          console.error('Audio playback failed', e);
        });
      }
    } else {
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlayingAudio(false);
        audio.currentTime = 0;
      };
      audio.onpause = () => setIsPlayingAudio(false);
      audio.play().then(() => {
        setIsPlayingAudio(true);
        setAudioElement(audio);
      }).catch((e) => {
        console.error('Audio playback failed', e);
      });
    }
  };

  return (
    <div
      className={`group relative flex flex-col my-1 transition-all ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Companion Avatar on left */}
        {!isUser && (
          <div className="shrink-0 mb-0.5">
            {companionAvatar ? (
              <img
                src={companionAvatar}
                alt={companionName}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                {companionName.charAt(0)}
              </div>
            )}
          </div>
        )}

        {/* Bubble Container */}
        <div className="relative">
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-[14.5px] leading-relaxed break-words shadow-sm transition-all ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-xs'
                : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-xs'
            }`}
          >
            {/* Attached Image if any */}
            {message.image && (
              <div className={`${message.content?.trim() ? 'mb-2' : ''} overflow-hidden rounded-xl`}>
                <img
                  src={`data:${message.image.mimeType};base64,${message.image.data}`}
                  alt="Attachment"
                  className="max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setImageModalOpen(true)}
                />
              </div>
            )}

            {/* Voice Memo Player if message is audio or has audio */}
            {message.audioUrl ? (
              <div className="flex flex-col gap-2 py-1 min-w-[210px] sm:min-w-[240px]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => togglePlayAudio(message.audioUrl!)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-xs ${
                      isUser
                        ? 'bg-white text-blue-600 hover:bg-slate-100'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                    title={isPlayingAudio ? 'Pause' : 'Play voice note'}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-0.5 h-6">
                      {/* Simulated Voice Waveform bars */}
                      {[40, 70, 95, 55, 80, 100, 60, 45, 90, 75, 40, 60, 85, 50, 65, 90].map((h, i) => (
                        <span
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            isPlayingAudio
                              ? 'bg-blue-400 animate-pulse'
                              : isUser
                              ? 'bg-blue-200'
                              : 'bg-slate-400'
                          }`}
                          style={{
                            height: `${isPlayingAudio ? Math.max(20, Math.round(h * Math.random())) : h}%`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-[11px] font-mono ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                        {isPlayingAudio ? 'Playing...' : isUser ? 'Voice note' : 'Voice memo'}
                      </span>
                      {message.audioDuration ? (
                        <span className={`text-[10.5px] font-mono ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                          {Math.floor(message.audioDuration / 60)}:{(message.audioDuration % 60).toString().padStart(2, '0')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {message.content?.trim() ? (
                  <p className={`whitespace-pre-wrap text-[13.5px] pt-1.5 border-t ${isUser ? 'border-blue-400/30 text-blue-50' : 'border-slate-700/60 text-slate-200'}`}>
                    {message.content}
                  </p>
                ) : null}
              </div>
            ) : message.content?.trim() ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : null}

            {/* Audio Voice Note action button for Companion's text bubbles */}
            {!isUser && !message.audioUrl && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onRequestVoiceNote(message.id, message.content)}
                  disabled={isVoiceLoading}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors py-0.5 text-[11.5px]"
                  title="Listen to voice note"
                >
                  {isVoiceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>Listen to voice note</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Reaction Pill badges */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={`absolute -bottom-2.5 flex items-center gap-1 ${
                isUser ? 'right-2' : 'left-2'
              }`}
            >
              {message.reactions.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onReact(message.id, r.emoji)}
                  className={`px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1 shadow-md border transition-transform hover:scale-110 ${
                    r.userReacted
                      ? 'bg-blue-900/90 border-blue-500/50 text-white'
                      : 'bg-slate-800/95 border-slate-700 text-slate-200'
                  }`}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="text-[10px] opacity-80">{r.count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Floating Action Trigger on hover */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
              isUser ? '-left-10' : '-right-10'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded-full bg-slate-800/90 text-slate-400 hover:text-slate-100 hover:bg-slate-700 shadow-sm transition-colors"
              title="React"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div
              className={`absolute z-30 bottom-full mb-1 flex items-center gap-1.5 p-1.5 bg-slate-800 border border-slate-700 rounded-full shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                isUser ? 'right-0' : 'left-0'
              }`}
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-slate-700 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta Footer (Timestamp & Delivery Status) */}
      <div className={`flex items-center gap-1.5 mt-1 px-1 text-[11px] text-slate-500 ${isUser ? 'mr-1' : 'ml-9'}`}>
        <span>{message.timestamp}</span>
        {isUser && (
          <div className="flex items-center ml-0.5">
            {(message.status === 'sending') ? (
              <span className="flex items-center gap-1 text-slate-500 animate-pulse" title="Sending...">
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                <span className="text-[10.5px]">Sending</span>
              </span>
            ) : (message.status === 'delivered') ? (
              <span className="flex items-center gap-1 text-slate-400 transition-colors duration-200" title="Delivered">
                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10.5px]">Delivered</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sky-400 transition-colors duration-200" title="Read">
                <CheckCheck className="w-3.5 h-3.5 text-sky-400 drop-shadow-[0_0_3px_rgba(56,189,248,0.4)]" />
                <span className="text-[10.5px] font-medium text-sky-400">Read</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen image preview modal */}
      {imageModalOpen && message.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setImageModalOpen(false)}
        >
          <img
            src={`data:${message.image.mimeType};base64,${message.image.data}`}
            alt="Expanded view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
