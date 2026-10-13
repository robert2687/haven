/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PhoneHeader } from './components/PhoneHeader';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatInput } from './components/ChatInput';
import { ProfileDrawer } from './components/ProfileDrawer';
import { CrisisModal } from './components/CrisisModal';
import { CallModal } from './components/CallModal';
import { COMPANION_PRESETS, INITIAL_USER } from './presets';
import { ChatMessage, CompanionProfile, UserProfile } from './types';
import { sounds } from './utils/audio';
import { Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

const STORAGE_KEY_COMPANION = 'haven_companion_profile_v1';
const STORAGE_KEY_USER = 'haven_user_profile_v1';
const STORAGE_KEY_MESSAGES = 'haven_chat_messages_v1';
const STORAGE_KEY_SOUND = 'haven_sound_enabled_v1';
const STORAGE_KEY_FRAME = 'haven_is_framed_v1';

export default function App() {
  // Load saved state or defaults
  const [companion, setCompanion] = useState<CompanionProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPANION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.appearance) {
          const match = COMPANION_PRESETS.find(
            (p) => p.id === parsed.id || p.name.toLowerCase() === parsed.name.toLowerCase()
          );
          parsed.appearance = match?.appearance || COMPANION_PRESETS[0].appearance;
        }
        return parsed;
      }
    } catch {}
    return COMPANION_PRESETS[0]; // Sophia
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USER;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Initial starter conversation
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return [
      {
        id: 'init-1',
        role: 'assistant',
        content: "hey! how's your day going so far?",
        timestamp: timeStr,
        status: 'read',
      },
      {
        id: 'init-2',
        role: 'assistant',
        content: "was just heading out for a quick coffee walk and thought of you. staying warm?",
        timestamp: timeStr,
        status: 'read',
      },
    ];
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  const [isFramed, setIsFramed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FRAME);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  const [isTyping, setIsTyping] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [voiceLoadingId, setVoiceLoadingId] = useState<string | null>(null);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync sound settings to audio utility
  useEffect(() => {
    sounds.enabled = soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Persist companion profile
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANION, JSON.stringify(companion));
    } catch {}
  }, [companion]);

  // Persist user profile
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {}
  }, [user]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Persist frame mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FRAME, JSON.stringify(isFramed));
    } catch {}
  }, [isFramed]);

  // Scroll to bottom on changes
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping]);

  // Handle sending a message
  const handleSendMessage = async (
    text: string,
    image?: { mimeType: string; data: string }
  ) => {
    if (!text && !image) return;

    sounds.playSent();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const newUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      image,
      timestamp: timeStr,
      status: 'sending',
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    // Update status to delivered/read after slight pause
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newUserMsg.id ? { ...m, status: 'delivered' } : m))
      );
    }, 400);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newUserMsg.id ? { ...m, status: 'read' } : m))
      );
    }, 900);

    try {
      // Build history for backend
      const history = messages.slice(-14).map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image,
      }));

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
          memories: companion.memories,
          locale: companion.locale,
          history,
          latestMessage: text,
          latestImage: image,
        }),
      });

      const data = await res.json();
      const bubbles: string[] = data.bubbles || ['hey, sorry, what was that?'];
      const newMemory: string | null = data.newMemory;

      // Realistic human split-bubble sequencing
      for (let i = 0; i < bubbles.length; i++) {
        const bubbleText = bubbles[i];
        // Dynamic reading/typing delay based on message length
        const typingDelay = Math.min(Math.max(bubbleText.length * 28, 600), 1600);
        await new Promise((resolve) => setTimeout(resolve, typingDelay));

        const bubbleTimeStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const newAssistantMsg: ChatMessage = {
          id: `asst-${Date.now()}-${i}`,
          role: 'assistant',
          content: bubbleText,
          timestamp: bubbleTimeStr,
          status: 'read',
        };

        sounds.playReceived();
        setMessages((prev) => [...prev, newAssistantMsg]);
      }

      // Handle newly extracted memory
      if (newMemory && newMemory.trim()) {
        const cleanedMemory = newMemory.trim();
        if (!companion.memories.includes(cleanedMemory)) {
          setCompanion((prev) => ({
            ...prev,
            memories: [...prev.memories, cleanedMemory],
          }));
          // Trigger pleasant subtle memory toast
          setMemoryToast(`${companion.name} remembered: "${cleanedMemory}"`);
          setTimeout(() => {
            setMemoryToast(null);
          }, 4500);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorTimeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "hm, reception feels spotty right now. try again in a sec?",
          timestamp: errorTimeStr,
          status: 'read',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Reaction handling
  const handleReact = (messageId: string, emoji: string) => {
    sounds.playTap();
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = msg.reactions || [];
        const existing = currentReactions.find((r) => r.emoji === emoji);

        if (existing) {
          if (existing.userReacted) {
            // Remove user reaction
            return {
              ...msg,
              reactions: currentReactions
                .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
                .filter((r) => r.count > 0),
            };
          } else {
            // Add to existing
            return {
              ...msg,
              reactions: currentReactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r
              ),
            };
          }
        } else {
          return {
            ...msg,
            reactions: [...currentReactions, { emoji, count: 1, userReacted: true }],
          };
        }
      })
    );
  };

  // Convert any companion message to a playable voice note
  const handleRequestVoiceNote = async (messageId: string, text: string) => {
    setVoiceLoadingId(messageId);
    try {
      const res = await fetch('/api/voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: companion.voice,
          style: 'Warm, natural, conversational texting companion',
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, audioUrl: data.audioUrl } : m))
        );
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error('Failed to get voice note', err);
    } finally {
      setVoiceLoadingId(null);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    if (window.confirm(`Clear chat history with ${companion.name}?`)) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      setIsProfileOpen(false);
    }
  };

  // Export chat
  const handleExportChat = () => {
    const formatted = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === 'user' ? user.name : companion.name}: ${m.content || '[Image]'}`
      )
      .join('\n\n');

    const blob = new Blob([formatted], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-with-${companion.name.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans antialiased selection:bg-blue-600 selection:text-white p-0 sm:p-4">
      {/* Container - Phone frame or expanded desktop */}
      <div
        className={`w-full transition-all duration-300 flex flex-col h-screen sm:h-[92vh] overflow-hidden ${
          isFramed
            ? 'max-w-[440px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] sm:ring-1 sm:ring-slate-700/50'
            : 'max-w-4xl sm:rounded-2xl sm:border border-slate-800 shadow-2xl'
        } bg-slate-900`}
      >
        {/* Header */}
        <PhoneHeader
          companion={companion}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenCrisis={() => setIsCrisisOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          isFramed={isFramed}
          onToggleFramed={() => setIsFramed(!isFramed)}
          onStartCall={() => setIsCallOpen(true)}
        />

        {/* Memory Toast notification */}
        {memoryToast && (
          <div className="bg-blue-950/90 border border-blue-600/50 px-3 py-1.5 text-xs text-blue-200 flex items-center justify-between animate-in slide-in-from-top-2 duration-200 z-10 shadow-lg">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{memoryToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setMemoryToast(null)}
              className="text-blue-400 hover:text-white text-xs ml-2"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Message Thread Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative bg-linear-to-b from-slate-900 via-slate-900/98 to-slate-950">
          {/* Conversation Start Marker */}
          <div className="text-center py-6 select-none">
            <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden ring-2 ring-slate-800 shadow-md">
              <img
                src={companion.avatar}
                alt={companion.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">{companion.name}</h3>
            <p className="text-xs text-slate-400 capitalize mt-0.5">
              {companion.relationship} · {companion.persona}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
              Texts you like a real person. No robotic formality, no fake human physical body claims.
            </p>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              companionAvatar={companion.avatar}
              companionName={companion.name}
              onReact={handleReact}
              onRequestVoiceNote={handleRequestVoiceNote}
              isVoiceLoading={voiceLoadingId === msg.id}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <TypingIndicator
              avatar={companion.avatar}
              name={companion.name}
            />
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Chat Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isTyping}
          onTyping={() => sounds.playTap()}
        />
      </div>

      {/* Profile & Memory Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        companion={companion}
        user={user}
        onUpdateCompanion={setCompanion}
        onUpdateUser={setUser}
        onClearChat={handleClearChat}
        onExportChat={handleExportChat}
        onOpenCrisis={() => {
          setIsProfileOpen(false);
          setIsCrisisOpen(true);
        }}
      />

      {/* Crisis & Safety Modal */}
      <CrisisModal
        isOpen={isCrisisOpen}
        onClose={() => setIsCrisisOpen(false)}
      />

      {/* Voice Phone Call Simulation Modal */}
      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        companion={companion}
        user={user}
      />
    </div>
  );
}
