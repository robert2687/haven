export type RelationshipType =
  | 'partner'
  | 'boyfriend'
  | 'girlfriend'
  | 'mentor'
  | 'coach'
  | 'best-friend'
  | 'startup-founder'
  | 'accountability-partner'
  | 'wellness-coach'
  | 'study-partner';

export type CompanionArchetype =
  | 'mentor'
  | 'coach'
  | 'best-friend'
  | 'startup-founder'
  | 'accountability-partner'
  | 'wellness-coach'
  | 'study-partner'
  | 'partner';

export type VoiceOption = 'Zephyr' | 'Kore' | 'Puck' | 'Fenrir' | 'Charon';

export interface CharacterAppearance {
  summary: string;
  facialFeatures: string;
  hairColorAndStyle: string;
  eyeColor: string;
  bodyType: string;
  clothingStyle: string;
  ageRange: string;
  culturalEthnic?: string;
  aestheticStyle: string;
  lastUpdated?: string;
}

// 1. Personal Memory Engine Structured Profile
export interface MemoryRelationship {
  id: string;
  nameOrRole: string; // e.g. "Maya (Sister)", "Barnaby (Dog)", "Alex (Co-founder)"
  context: string; // e.g. "Starting a company together, stressed about launch"
  closeness: 'close' | 'family' | 'work' | 'pet';
}

export interface MemoryGoal {
  id: string;
  type: 'short-term' | 'long-term';
  title: string;
  details: string;
  status: 'in-progress' | 'achieved';
}

export interface SignificantEvent {
  id: string;
  dateOrPeriod: string;
  event: string;
  impact: string;
}

export interface StructuredMemoryProfile {
  lifeProfile: {
    careerOrStudies?: string;
    locationOrVibe?: string;
    dailyRhythm?: string;
    livingSituation?: string;
  };
  relationships: MemoryRelationship[];
  interestsAndHobbies: string[];
  personalValues: string[];
  goals: MemoryGoal[];
  emotionalPatterns: string[];
  significantEvents: SignificantEvent[];
}

// 2. Mood Intelligence Types & Loneliness Detection
export interface MoodIntelligence {
  happiness: number; // 0 - 100
  energy: number; // 0 - 100
  stress: number; // 0 - 100
  loneliness: number; // 0 - 100
  motivation: number; // 0 - 100
  dominantEmotion: string;
  adaptiveBehaviorNote: string;
  lastAnalyzed: string;
  proactiveOutreachTriggered?: boolean;
  history?: Array<{
    timestamp: string;
    happiness: number;
    energy: number;
    stress: number;
    loneliness: number;
    motivation: number;
  }>;
}

// 3. Daily Companion Mode Types
export interface MorningRoutineData {
  priorities: string[];
  motivationQuote: string;
  scheduleOverview: string;
  goalReminders: string[];
  companionGreeting: string;
}

export interface EveningRoutineData {
  reflectionJournal: string;
  winsOfTheDay: string[];
  lessonsLearned: string[];
  gratitudePrompts: string[];
  tomorrowPlanning: string;
  companionReflection: string;
}

export interface DailyCompanionLog {
  id: string;
  date: string;
  morning?: MorningRoutineData;
  evening?: EveningRoutineData;
}

// 4. Voice Companion Settings
export type EmotionalVoiceModulation =
  | 'warm'
  | 'playful'
  | 'calm'
  | 'late-night'
  | 'encouraging';

export interface VoiceCompanionSettings {
  emotionalModulation: EmotionalVoiceModulation;
  handsFree: boolean;
  voiceEngine: 'gemini-live' | 'elevenlabs' | 'openai-realtime';
  alwaysAvailableMode: boolean;
}

// 5. Relationship Simulation Arcs & Inside Jokes
export interface StorylineArc {
  id: string;
  title: string;
  currentChapter: string;
  status: 'active' | 'completed';
  lastUpdated: string;
}

export interface InsideJoke {
  id: string;
  trigger: string;
  context: string;
}

// Companion Profile
export interface CompanionProfile {
  id: string;
  name: string;
  relationship: RelationshipType | string;
  archetype?: CompanionArchetype;
  title?: string;
  avatar: string;
  persona: string;
  tastesAndQuirks: string;
  specialties?: string[];
  voice: VoiceOption;
  locale: string;
  memories: string[];
  appearance: CharacterAppearance;
  avatarGallery?: string[];
  structuredMemory?: StructuredMemoryProfile;
  moodIntelligence?: MoodIntelligence;
  voiceSettings?: VoiceCompanionSettings;
  storylines?: StorylineArc[];
  insideJokes?: InsideJoke[];
}

export interface UserProfile {
  name: string;
  locale: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image?: {
    mimeType: string;
    data: string; // base64
  };
  audioUrl?: string; // base64 WAV or generated URL
  audioDuration?: number; // seconds
  reactions?: MessageReaction[];
  isVoiceNote?: boolean;
  burstGroup?: string;
  status?: 'sending' | 'delivered' | 'read';
}

// 6. AI Life Coach Modules
export type LifeCoachModuleType =
  | 'productivity'
  | 'career'
  | 'business'
  | 'learning'
  | 'fitness'
  | 'personal-growth';

export interface LifeCoachGoalStep {
  id: string;
  text: string;
  done: boolean;
}

export interface LifeCoachGoal {
  id: string;
  category: LifeCoachModuleType;
  title: string;
  progress: number; // 0 - 100
  nextRecommendedAction: string;
  steps: LifeCoachGoalStep[];
  coachNotes?: string;
  metric?: string;
}

// 7. Dream Board & Life Planning
export interface DreamMilestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface DreamPlan {
  id: string;
  title: string;
  category: 'business' | 'lifestyle' | 'travel' | 'craft' | 'financial';
  targetYear: string;
  progress: number;
  milestones: DreamMilestone[];
  actionPlan: string[];
  motivationalReminder: string;
}

// 8. Life Timeline
export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  category: 'startup' | 'milestone' | 'habit' | 'personal';
}

// 9. Haven Memory Graph & Digital Twin
export interface MemoryGraphNode {
  id: string;
  label: string;
  category: 'user' | 'family' | 'friends' | 'work' | 'goals' | 'habits' | 'projects';
  details: string;
  connections: string[];
}

export interface DigitalTwinProfile {
  personalitySummary: string;
  coreValues: string[];
  decisionPatterns: string[];
  strengths: string[];
  weaknesses: string[];
  futureSelfAdviceHistory: Array<{
    id: string;
    query: string;
    advice: string;
    timestamp: string;
  }>;
}

// 10. Haven Community (Social Layer)
export interface CommunityPost {
  id: string;
  authorName: string;
  avatar?: string;
  timeAgo: string;
  content: string;
  tag?: string;
  circleName: string;
  cheers: number;
  userCheered?: boolean;
  companionComment?: {
    companionName: string;
    text: string;
  };
}

export interface CommunityCircle {
  id: string;
  name: string;
  type: 'accountability' | 'interest' | 'challenge';
  description: string;
  membersCount: number;
  activeChallenge?: string;
  joined: boolean;
  recentPosts: CommunityPost[];
}

// 11. Premium Subscription Tiers
export type SubscriptionTier = 'free' | 'pro' | 'founder';

// 12. Main View State
export type ActiveHavenView =
  | 'companion'
  | 'marketplace'
  | 'life-coach'
  | 'dream-board'
  | 'memory-graph'
  | 'community'
  | 'membership';
