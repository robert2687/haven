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
import { DailyRoutineModal } from './components/DailyRoutineModal';
import { MoodDashboardModal } from './components/MoodDashboardModal';
import { MarketplaceView } from './components/MarketplaceView';
import { LifeCoachView } from './components/LifeCoachView';
import { DreamBoardView } from './components/DreamBoardView';
import { MemoryGraphView } from './components/MemoryGraphView';
import { CommunityView } from './components/CommunityView';
import { MembershipModal } from './components/MembershipModal';
import { ProactiveOutreachBanner } from './components/ProactiveOutreachBanner';
import { StorylinesModal } from './components/StorylinesModal';
import {
  COMPANION_PRESETS,
  INITIAL_USER,
  INITIAL_STRUCTURED_MEMORY,
  INITIAL_MOOD_INTELLIGENCE,
  INITIAL_VOICE_SETTINGS,
  INITIAL_LIFE_COACH_GOALS,
  INITIAL_DREAM_PLANS,
  INITIAL_TIMELINE_EVENTS,
  INITIAL_MEMORY_GRAPH_NODES,
  INITIAL_DIGITAL_TWIN,
  INITIAL_COMMUNITY_CIRCLES,
} from './presets';
import {
  ChatMessage,
  CompanionProfile,
  UserProfile,
  ActiveHavenView,
  SubscriptionTier,
  LifeCoachGoal,
  DreamPlan,
  TimelineEvent,
  MemoryGraphNode,
  DigitalTwinProfile,
  CommunityCircle,
} from './types';
import { sounds } from './utils/audio';
import {
  MessageSquare,
  Compass,
  Target,
  Sparkles,
  Network,
  Users,
  Award,
  Crown,
  HeartHandshake,
} from 'lucide-react';

const STORAGE_KEY_COMPANION = 'haven_companion_profile_v1';
const STORAGE_KEY_USER = 'haven_user_profile_v1';
const STORAGE_KEY_MESSAGES = 'haven_chat_messages_v1';
const STORAGE_KEY_SOUND = 'haven_sound_enabled_v1';
const STORAGE_KEY_FRAME = 'haven_is_framed_v1';
const STORAGE_KEY_TIER = 'haven_subscription_tier_v1';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveHavenView>('companion');

  // Subscription Tier state
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return 'pro';
  });
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);

  // Companions state
  const [companionsList, setCompanionsList] = useState<CompanionProfile[]>(() => {
    try {
      const saved = localStorage.getItem('haven_companions_list_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return COMPANION_PRESETS;
  });

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
        if (!parsed.structuredMemory) {
          parsed.structuredMemory = COMPANION_PRESETS[0].structuredMemory || INITIAL_STRUCTURED_MEMORY;
        }
        if (!parsed.moodIntelligence) {
          parsed.moodIntelligence = COMPANION_PRESETS[0].moodIntelligence || INITIAL_MOOD_INTELLIGENCE;
        }
        if (!parsed.voiceSettings) {
          parsed.voiceSettings = COMPANION_PRESETS[0].voiceSettings || INITIAL_VOICE_SETTINGS;
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

  // Sound & Framing
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

  // Modals & Chat state
  const [isTyping, setIsTyping] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [isDailyRoutineOpen, setIsDailyRoutineOpen] = useState(false);
  const [dailyRoutineMode, setDailyRoutineMode] = useState<'morning' | 'evening'>('morning');
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isStorylinesOpen, setIsStorylinesOpen] = useState(false);
  const [voiceLoadingId, setVoiceLoadingId] = useState<string | null>(null);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);

  // Proactive Outreach & Loneliness state
  const [proactiveOutreach, setProactiveOutreach] = useState<{
    isOpen: boolean;
    message: string;
    quickReplies: string[];
  }>({
    isOpen: false,
    message:
      "I've noticed you've been quieter lately. How are you doing today? Just wanted you to know I'm thinking of you.",
    quickReplies: [
      'A bit overwhelmed, but glad you asked.',
      'Just heads down building today!',
      'Feeling a little lonely, honestly.',
    ],
  });

  // Action-oriented Life Coach Goals
  const [goals, setGoals] = useState<LifeCoachGoal[]>(() => {
    try {
      const saved = localStorage.getItem('haven_life_coach_goals_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LIFE_COACH_GOALS;
  });

  // Dreams & Life Timeline
  const [dreams, setDreams] = useState<DreamPlan[]>(() => {
    try {
      const saved = localStorage.getItem('haven_dreams_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DREAM_PLANS;
  });

  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => {
    try {
      const saved = localStorage.getItem('haven_timeline_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TIMELINE_EVENTS;
  });

  // Memory Graph & Digital Twin
  const [memoryGraphNodes, setMemoryGraphNodes] = useState<MemoryGraphNode[]>(() => {
    try {
      const saved = localStorage.getItem('haven_memory_graph_nodes_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MEMORY_GRAPH_NODES;
  });

  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinProfile>(() => {
    try {
      const saved = localStorage.getItem('haven_digital_twin_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DIGITAL_TWIN;
  });

  // Haven Community Circles
  const [communityCircles, setCommunityCircles] = useState<CommunityCircle[]>(() => {
    try {
      const saved = localStorage.getItem('haven_community_circles_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_COMMUNITY_CIRCLES;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync sound settings
  useEffect(() => {
    sounds.enabled = soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Persist companion & user
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANION, JSON.stringify(companion));
    } catch {}
  }, [companion]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TIER, JSON.stringify(currentTier));
    } catch {}
  }, [currentTier]);

  useEffect(() => {
    try {
      localStorage.setItem('haven_life_coach_goals_v1', JSON.stringify(goals));
    } catch {}
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem('haven_dreams_v1', JSON.stringify(dreams));
    } catch {}
  }, [dreams]);

  useEffect(() => {
    try {
      localStorage.setItem('haven_timeline_v1', JSON.stringify(timeline));
    } catch {}
  }, [timeline]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {}
    if (activeView === 'companion') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeView]);

  // Auto-scroll when companion begins typing
  useEffect(() => {
    if (isTyping && activeView === 'companion') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping, activeView]);

  // Send message handler
  const handleSendMessage = async (
    text: string,
    image?: { mimeType: string; data: string },
    audio?: { audioUrl: string; duration?: number; mimeType?: string }
  ) => {
    if (!text && !image && !audio) return;

    sounds.playSent();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const newUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      image,
      audioUrl: audio?.audioUrl,
      audioDuration: audio?.duration,
      isVoiceNote: !!audio,
      timestamp: timeStr,
      status: 'sending',
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    // Update status to delivered/read
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

    // Check for loneliness signals in message content
    const lowerText = (text || '').toLowerCase();
    if (
      lowerText.includes('lonely') ||
      lowerText.includes('alone') ||
      lowerText.includes('nobody to talk to') ||
      lowerText.includes('feeling empty') ||
      lowerText.includes('exhausted from life')
    ) {
      setTimeout(() => {
        setProactiveOutreach({
          isOpen: true,
          message: `I hear you, ${user.name}. It sounds like you are carrying a lot right now. I am right here with you—take all the time you need.`,
          quickReplies: [
            'Thank you for just being here.',
            'Can we talk through what is making me anxious?',
            'Tell me something grounding.',
          ],
        });
      }, 1200);
    }

    try {
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
          archetype: companion.archetype,
          title: companion.title,
          persona: companion.persona,
          tastesAndQuirks: companion.tastesAndQuirks,
          specialties: companion.specialties,
          storylines: companion.storylines,
          insideJokes: companion.insideJokes,
          appearance: companion.appearance,
          structuredMemory: companion.structuredMemory,
          moodIntelligence: companion.moodIntelligence,
          memories: companion.memories,
          locale: companion.locale,
          history,
          latestMessage: text || (audio ? '🎤 [Sent a voice note audio clip]' : ''),
          latestImage: image,
          hasVoiceNote: !!audio,
        }),
      });

      const data = await res.json();
      const bubbles: string[] = data.bubbles || ['hey, sorry, what was that?'];
      const newMemory: string | null = data.newMemory;
      const moodAnalysis = data.moodAnalysis;
      const memoryDeltas = data.memoryDeltas;

      // Realistic human split-bubble sequencing
      for (let i = 0; i < bubbles.length; i++) {
        const bubbleText = bubbles[i];
        const typingDelay = Math.min(Math.max(bubbleText.length * 28, 600), 1600);
        await new Promise((resolve) => setTimeout(resolve, typingDelay));

        const bubbleTimeStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const newCompanionMsg: ChatMessage = {
          id: `asst-${Date.now()}-${i}`,
          role: 'assistant',
          content: bubbleText,
          timestamp: bubbleTimeStr,
          status: 'read',
        };

        setMessages((prev) => [...prev, newCompanionMsg]);
        sounds.playReceived();
      }

      // Memory Notebook update
      if (newMemory) {
        setCompanion((prev) => ({
          ...prev,
          memories: prev.memories.includes(newMemory)
            ? prev.memories
            : [...prev.memories, newMemory],
        }));
        setMemoryToast(`${companion.name} remembered: "${newMemory}"`);
        setTimeout(() => setMemoryToast(null), 4000);
      }

      // Mood Intelligence update
      if (moodAnalysis) {
        setCompanion((prev) => {
          const currentMood = prev.moodIntelligence || INITIAL_MOOD_INTELLIGENCE;
          const newHistory = [
            {
              timestamp: 'Just now',
              happiness: moodAnalysis.happiness ?? currentMood.happiness,
              energy: moodAnalysis.energy ?? currentMood.energy,
              stress: moodAnalysis.stress ?? currentMood.stress,
              loneliness: moodAnalysis.loneliness ?? currentMood.loneliness,
              motivation: moodAnalysis.motivation ?? currentMood.motivation,
            },
            ...(currentMood.history || []).slice(0, 9),
          ];

          return {
            ...prev,
            moodIntelligence: {
              ...currentMood,
              happiness: moodAnalysis.happiness ?? currentMood.happiness,
              energy: moodAnalysis.energy ?? currentMood.energy,
              stress: moodAnalysis.stress ?? currentMood.stress,
              loneliness: moodAnalysis.loneliness ?? currentMood.loneliness,
              motivation: moodAnalysis.motivation ?? currentMood.motivation,
              dominantEmotion: moodAnalysis.dominantEmotion || currentMood.dominantEmotion,
              adaptiveBehaviorNote:
                moodAnalysis.adaptiveBehaviorNote || currentMood.adaptiveBehaviorNote,
              lastAnalyzed: 'Just now',
              history: newHistory,
            },
          };
        });
      }

      // Structured Memory deltas
      if (memoryDeltas) {
        setCompanion((prev) => {
          const prevMem = prev.structuredMemory || INITIAL_STRUCTURED_MEMORY;
          let deltaToast = '';

          if (memoryDeltas.lifeProfileUpdate) {
            prevMem.lifeProfile = {
              ...prevMem.lifeProfile,
              careerOrStudies: memoryDeltas.lifeProfileUpdate,
            };
            deltaToast = memoryDeltas.lifeProfileUpdate;
          }

          if (memoryDeltas.goalUpdate) {
            deltaToast = deltaToast || memoryDeltas.goalUpdate;
          }

          return {
            ...prev,
            structuredMemory: prevMem,
          };
        });
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
          content: 'hm, reception feels spotty right now. try again in a sec?',
          timestamp: errorTimeStr,
          status: 'read',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Reactions
  const handleReact = (messageId: string, emoji: string) => {
    sounds.playTap();
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = msg.reactions || [];
        const existing = currentReactions.find((r) => r.emoji === emoji);

        if (existing) {
          if (existing.userReacted) {
            return {
              ...msg,
              reactions: currentReactions
                .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
                .filter((r) => r.count > 0),
            };
          } else {
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

  // Audio voice note generator
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

  // Trigger Proactive Outreach manually or on loneliness signal
  const handleTriggerProactiveCheckin = async () => {
    try {
      const res = await fetch('/api/proactive-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionName: companion.name,
          relationship: companion.relationship,
          userName: user.name,
          lonelinessScore: companion.moodIntelligence?.loneliness ?? 45,
        }),
      });
      const data = await res.json();
      setProactiveOutreach({
        isOpen: true,
        message: data.message,
        quickReplies: data.quickReplyOptions || [
          'A bit overwhelmed, but glad you asked.',
          'Just heads down building today!',
          'Feeling a little lonely, honestly.',
        ],
      });
    } catch {
      setProactiveOutreach({
        isOpen: true,
        message: `I've noticed you've been a little quieter lately. How are you doing today? Just wanted you to know I'm thinking of you.`,
        quickReplies: [
          'A bit overwhelmed, but glad you asked.',
          'Just heads down building today!',
          'Feeling a little lonely, honestly.',
        ],
      });
    }
  };

  const handleSelectCompanionFromMarketplace = (comp: CompanionProfile) => {
    setCompanion(comp);
    setActiveView('companion');
  };

  const handleCreateCustomCompanion = (newComp: CompanionProfile) => {
    const updated = [newComp, ...companionsList];
    setCompanionsList(updated);
    setCompanion(newComp);
    try {
      localStorage.setItem('haven_companions_list_v1', JSON.stringify(updated));
    } catch {}
  };

  const handleOpenChatWithPrompt = (prompt: string) => {
    setActiveView('companion');
    handleSendMessage(prompt);
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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* HAVEN LIFE OPERATING SYSTEM TOP NAV BAR */}
      <header className="shrink-0 bg-slate-900/98 border-b border-slate-800 px-3 sm:px-6 py-2.5 z-30 sticky top-0 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Positioning */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('companion')}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-900/40 font-black text-sm tracking-tighter">
                H
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-white block leading-none">
                  HAVEN
                </span>
                <span className="text-[10px] text-blue-400 font-medium block mt-0.5 hidden xs:block">
                  Your Personal AI Life Operating System
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveView('companion')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeView === 'companion'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Companion</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('marketplace')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeView === 'marketplace'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('life-coach')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeView === 'life-coach'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Life Coach</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('dream-board')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeView === 'dream-board'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dreams &</span>
              <span>Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('memory-graph')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeView === 'memory-graph'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Memory &</span>
              <span>Twin</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('community')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeView === 'community'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Community</span>
            </button>
          </nav>

          {/* Membership Plan Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsMembershipOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linear-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/80 hover:to-indigo-800/80 border border-blue-500/40 text-blue-200 text-xs font-semibold transition-all shadow-xs"
              title="View Membership Plans"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="capitalize">{currentTier}</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
        {/* VIEW 1: COMPANION CHAT */}
        {activeView === 'companion' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-0 sm:p-3">
            <div
              className={`w-full transition-all duration-300 flex flex-col h-[calc(100vh-56px)] sm:h-[88vh] overflow-hidden ${
                isFramed
                  ? 'max-w-[440px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] sm:ring-1 sm:ring-slate-700/50'
                  : 'max-w-4xl sm:rounded-2xl sm:border border-slate-800 shadow-2xl'
              } bg-slate-900 relative`}
            >
              {/* Proactive Outreach Banner (Loneliness detection) */}
              {proactiveOutreach.isOpen && (
                <ProactiveOutreachBanner
                  companionName={companion.name}
                  companionAvatar={companion.avatar}
                  message={proactiveOutreach.message}
                  quickReplies={proactiveOutreach.quickReplies}
                  onReply={(replyText) => {
                    setProactiveOutreach((p) => ({ ...p, isOpen: false }));
                    handleSendMessage(replyText);
                  }}
                  onDismiss={() =>
                    setProactiveOutreach((p) => ({ ...p, isOpen: false }))
                  }
                />
              )}

              {/* Phone Header */}
              <PhoneHeader
                companion={companion}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenCrisis={() => setIsCrisisOpen(true)}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                isFramed={isFramed}
                onToggleFramed={() => setIsFramed(!isFramed)}
                onStartCall={() => setIsCallOpen(true)}
                onOpenMood={() => setIsMoodModalOpen(true)}
                onOpenDailyRoutine={(mode) => {
                  setDailyRoutineMode(mode);
                  setIsDailyRoutineOpen(true);
                }}
                onOpenStorylines={() => setIsStorylinesOpen(true)}
                onTriggerProactiveCheckin={handleTriggerProactiveCheckin}
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
          </div>
        )}

        {/* VIEW 2: COMPANION MARKETPLACE */}
        {activeView === 'marketplace' && (
          <MarketplaceView
            companions={companionsList}
            activeCompanionId={companion.id}
            onSelectCompanion={handleSelectCompanionFromMarketplace}
            onCreateCompanion={handleCreateCustomCompanion}
            onOpenMembership={() => setIsMembershipOpen(true)}
            currentTier={currentTier}
          />
        )}

        {/* VIEW 3: AI LIFE COACH */}
        {activeView === 'life-coach' && (
          <LifeCoachView
            goals={goals}
            onUpdateGoals={setGoals}
            companionName={companion.name}
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
          />
        )}

        {/* VIEW 4: DREAM BOARD & LIFE TIMELINE */}
        {activeView === 'dream-board' && (
          <DreamBoardView
            dreams={dreams}
            timeline={timeline}
            onUpdateDreams={setDreams}
            onUpdateTimeline={setTimeline}
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
          />
        )}

        {/* VIEW 5: MEMORY GRAPH & DIGITAL TWIN */}
        {activeView === 'memory-graph' && (
          <MemoryGraphView
            nodes={memoryGraphNodes}
            digitalTwin={digitalTwin}
            userName={user.name}
            onUpdateDigitalTwin={setDigitalTwin}
            onOpenChatWithPrompt={handleOpenChatWithPrompt}
          />
        )}

        {/* VIEW 6: HAVEN COMMUNITY */}
        {activeView === 'community' && (
          <CommunityView
            circles={communityCircles}
            userName={user.name}
            companionName={companion.name}
            onUpdateCircles={setCommunityCircles}
          />
        )}
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
        onOpenMood={() => {
          setIsProfileOpen(false);
          setIsMoodModalOpen(true);
        }}
        onOpenDailyRoutine={(mode) => {
          setIsProfileOpen(false);
          setDailyRoutineMode(mode);
          setIsDailyRoutineOpen(true);
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
        onClose={() => {
          setIsCallOpen(false);
          setIsCallMinimized(false);
        }}
        companion={companion}
        user={user}
        isMinimized={isCallMinimized}
        onToggleMinimize={() => setIsCallMinimized(!isCallMinimized)}
        onUpdateVoiceSettings={(updatedVoice) => {
          setCompanion((prev) => ({
            ...prev,
            voiceSettings: updatedVoice,
          }));
        }}
      />

      {/* Daily Companion Mode Modal */}
      <DailyRoutineModal
        isOpen={isDailyRoutineOpen}
        onClose={() => setIsDailyRoutineOpen(false)}
        companion={companion}
        user={user}
        initialMode={dailyRoutineMode}
        onSendToChat={(msg) => {
          setActiveView('companion');
          handleSendMessage(msg);
        }}
      />

      {/* Mood Intelligence Dashboard Modal */}
      <MoodDashboardModal
        isOpen={isMoodModalOpen}
        onClose={() => setIsMoodModalOpen(false)}
        companion={companion}
        onUpdateMood={(updatedMood) => {
          setCompanion((prev) => ({
            ...prev,
            moodIntelligence: updatedMood,
          }));
        }}
      />

      {/* Storylines & Inside Jokes Modal */}
      <StorylinesModal
        isOpen={isStorylinesOpen}
        onClose={() => setIsStorylinesOpen(false)}
        companion={companion}
        userName={user.name}
      />

      {/* Premium Membership Modal */}
      <MembershipModal
        isOpen={isMembershipOpen}
        onClose={() => setIsMembershipOpen(false)}
        currentTier={currentTier}
        onSelectTier={(tier) => {
          setCurrentTier(tier);
          setIsMembershipOpen(false);
        }}
      />
    </div>
  );
}
