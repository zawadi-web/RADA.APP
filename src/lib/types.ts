/**
 * Rada Core Domain Types
 * Strict TypeScript types reflecting the canonical Rada Product Design Contract
 */

export type IntentType =
  | "MARRIAGE"
  | "LONG_TERM"
  | "INTENTIONAL_DATING"
  | "SERIOUS_RELATIONSHIP"
  | "EXPLORING";

export type Gender = "MAN" | "WOMAN" | "NON_BINARY";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "google" | "phone" | "guest";
  signedInAt: string;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
  caption?: string;
}

export interface ProfilePrompt {
  id: string;
  promptId: string;
  question: string;
  answer: string;
}

export interface VoiceNote {
  id: string;
  promptTitle: string;
  durationSec: number;
  audioUrl?: string;
}

export interface RadaUser {
  id: string;
  fullName: string;
  birthDate: string; // ISO YYYY-MM-DD
  age: number; // dynamically computed
  gender: Gender;
  interestedIn: Gender[];
  county: string;
  area: string;
  occupation: string;
  education?: string;
  intent: IntentType;
  intentNote?: string;
  bio: string;
  heightCm?: number;
  religion?: string;
  drinking?: string;
  smoking?: string;
  photos: ProfilePhoto[];
  prompts: ProfilePrompt[];
  voiceNote?: VoiceNote;
  verified: boolean;
  completionScore: number; // 0 - 100%
  isVip: boolean;
  coins?: number;
  email?: string;
  lastActive: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export type LikeType = "STANDARD" | "SUPER_SPARK";

export interface LikeItem {
  id: string;
  senderId: string;
  sender: RadaUser;
  likeType: LikeType;
  comment?: string;
  promptQuestion?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  isSystem?: boolean;
}

export interface MatchItem {
  id: string;
  conversationId: string;
  matchedWith: RadaUser;
  matchedAt: string;
  lastActivity: string;
  lastMessage?: Message;
  unreadCount: number;
  expiresAt: string; // 48-hour momentum expiry
  momentumHoursRemaining: number;
  isExpired: boolean;
}

export type EntitlementPlan = "WEEKLY_PASS" | "MONTHLY_VIP" | "SUPER_SPARKS";

export interface PaymentTransaction {
  id: string;
  amountKsh: number;
  phoneNumber: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  plan: EntitlementPlan;
  planTitle: string;
  reference: string;
  createdAt: string;
}

export type ActiveTab = "discover" | "radar" | "likes" | "profile";
