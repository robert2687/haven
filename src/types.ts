export type RelationshipType = 'partner' | 'boyfriend' | 'girlfriend';

export type VoiceOption = 'Zephyr' | 'Kore' | 'Puck' | 'Fenrir' | 'Charon';

export interface CompanionProfile {
  id: string;
  name: string;
  relationship: RelationshipType | string;
  avatar: string;
  persona: string;
  tastesAndQuirks: string;
  voice: VoiceOption;
  locale: string;
  memories: string[];
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
  reactions?: MessageReaction[];
  isVoiceNote?: boolean;
  burstGroup?: string; // group id for burst messages
  status?: 'sending' | 'delivered' | 'read';
}
