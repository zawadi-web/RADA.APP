"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  RadaUser,
  MatchItem,
  LikeItem,
  Message,
  IntentType,
  AuthUser,
} from "./types";
import {
  CURRENT_USER,
  MOCK_DISCOVERY_USERS,
  MOCK_LIKES_RECEIVED,
  MOCK_MATCHES,
  MOCK_CONVERSATIONS,
} from "./mock-data";
import { reverseGeocodeKenya, geolocateByIP } from "./kenya-geocoding";

interface RadaContextType {
  currentUser: RadaUser;
  deck: RadaUser[];
  currentCard: RadaUser | null;
  matches: MatchItem[];
  likesReceived: LikeItem[];
  conversations: Record<string, Message[]>;
  matchedUserModal: RadaUser | null;
  isVipModalOpen: boolean;
  unreadMessagesCount: number;
  newLikesCount: number;
  // Auth state
  authUser: AuthUser | null;
  isRealDataMode: boolean;
  isHydrated: boolean;
  // Location
  useLocation: boolean;
  locationError: string | null;
  toggleLocation: () => void;
  setLocationError: (err: string | null) => void;
  signInWithGoogle: (customDetails?: { name?: string; email?: string; avatarUrl?: string }) => void;
  signOut: () => void;
  // Real data controls
  clearAllMockData: () => void;
  restoreMockData: () => void;
  addPhotoToCurrentUser: (photoDataUrl: string) => void;
  addDiscoveryUser: (user: RadaUser) => void;
  // Actions
  passCurrentCard: () => void;
  likeCurrentCard: (comment?: string) => Promise<void> | void;
  superSparkCurrentCard: (comment: string) => void;
  closeMatchModal: () => void;
  openVipModal: () => void;
  closeVipModal: () => void;
  acceptLike: (likeId: string) => void;
  passLike: (likeId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  updateUserIntent: (intent: IntentType) => void;
  updateUserBio: (bio: string) => void;
  updateProfile: (updates: Partial<RadaUser>) => void;
  upgradeToVip: () => void;
  blockUser: (userId: string) => void;
  reportUser: (userId: string, reason: string) => void;
  resetDeck: () => void;
  // Real API
  refreshDiscover: () => void;
  refreshMatches: () => Promise<void>;
  isLoadingDeck: boolean;
  dbUserId: string | null;
  setDbUserId: (id: string | null) => void;
  // Navigation: ID of the newest match to auto-open on /matches
  pendingMatchConvId: string | null;
  clearPendingMatch: () => void;
  // Multi-profile test switcher
  switchToProfile: (profile: RadaUser) => void;
  savedTestProfiles: RadaUser[];
  createTestProfile: (preset: "MALE" | "FEMALE") => Promise<RadaUser>;
  // Direct state setters (for advanced usage)
  setConversations: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  setMatches: React.Dispatch<React.SetStateAction<MatchItem[]>>;
  // Coin economy
  coins: number;
  isCoinModalOpen: boolean;
  openCoinModal: () => void;
  closeCoinModal: () => void;
  unlockedConversations: string[];
  spendCoins: (action: "CHAT_UNLOCK" | "DIRECT_MESSAGE" | "BOOST", targetUserId?: string) => Promise<{ success: boolean; error?: string; remainingCoins?: number }>;
  purchaseCoins: (packId: "SPARK_50" | "CUPID_200" | "ROYAL_500", phoneNumber: string) => Promise<{ success: boolean; error?: string; balance?: number }>;
  refreshCoinBalance: () => Promise<void>;
  unlockConversationWithCoins: (conversationId: string) => Promise<{ success: boolean; error?: string }>;
  canSendMessageInConversation: (conversationId: string) => { allowed: boolean; remainingFree: number; requiresUnlock: boolean };
  // Auth methods
  signInWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmailPassword: (data: { email: string; password: string; fullName: string; gender?: string; intent?: string; county?: string; area?: string }) => Promise<{ success: boolean; error?: string }>;
}

const RadaContext = createContext<RadaContextType | null>(null);

const INITIAL_REAL_USER: RadaUser = {
  id: "user-me",
  fullName: "Set Your Name",
  birthDate: "2000-01-01",
  age: 24,
  gender: "MAN",
  interestedIn: ["WOMAN"],
  county: "Tharaka-Nithi",
  area: "Chuka",
  latitude: -0.3344,
  longitude: 37.6528,
  occupation: "",
  intent: "INTENTIONAL_DATING",
  bio: "",
  photos: [],
  prompts: [],
  verified: false,
  completionScore: 20,
  isVip: false,
  coins: 20,
  lastActive: "Just now",
};

const STORAGE_KEY = "rada_app_real_production_v3";

export const RadaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<RadaUser>(INITIAL_REAL_USER);
  const [deck, setDeck] = useState<RadaUser[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [likesReceived, setLikesReceived] = useState<LikeItem[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [matchedUserModal, setMatchedUserModal] = useState<RadaUser | null>(null);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [unlockedConversations, setUnlockedConversations] = useState<string[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isRealDataMode, setIsRealDataMode] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedTestProfiles, setSavedTestProfiles] = useState<RadaUser[]>([]);
  // Location state
  const [useLocation, setUseLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  // Real API state
  const [isLoadingDeck, setIsLoadingDeck] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  // Pending match navigation (set after a like creates a match)
  const [pendingMatchConvId, setPendingMatchConvId] = useState<string | null>(null);
  const clearPendingMatch = () => setPendingMatchConvId(null);

  const openCoinModal = () => setIsCoinModalOpen(true);
  const closeCoinModal = () => setIsCoinModalOpen(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        if (parsed.deck !== undefined) setDeck(parsed.deck);
        if (parsed.matches) setMatches(parsed.matches);
        if (parsed.likesReceived) setLikesReceived(parsed.likesReceived);
        if (parsed.conversations) setConversations(parsed.conversations);
        if (parsed.unlockedConversations) setUnlockedConversations(parsed.unlockedConversations);
        if (parsed.authUser) setAuthUser(parsed.authUser);
        if (parsed.isRealDataMode !== undefined) setIsRealDataMode(parsed.isRealDataMode);
        if (parsed.dbUserId) {
          setDbUserId(parsed.dbUserId);
          // Sync live profile from database to ensure preferences and gender are up to date
          fetch(`/api/profile/me?userId=${parsed.dbUserId}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.user) {
                setCurrentUser((prev) => ({ ...prev, ...data.user }));
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // ignore parse error
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage when state changes after initial hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentUser,
          deck,
          matches,
          likesReceived,
          conversations,
          unlockedConversations,
          authUser,
          isRealDataMode,
          dbUserId,
        })
      );
    } catch {
      // storage quota or private browsing
    }
  }, [currentUser, deck, matches, likesReceived, conversations, unlockedConversations, authUser, isRealDataMode, dbUserId, isHydrated]);

  const signInWithGoogle = (customDetails?: { name?: string; email?: string; avatarUrl?: string }) => {
    const user: AuthUser = {
      id: `usr-google-${Date.now()}`,
      name: customDetails?.name || "Verified Member",
      email: customDetails?.email || "",
      avatarUrl: customDetails?.avatarUrl || "",
      provider: "google",
      signedInAt: new Date().toISOString(),
    };
    setAuthUser(user);

    // Update current user details with Google account info
    setCurrentUser((prev) => ({
      ...prev,
      fullName: user.name,
      verified: true,
      photos: [
        {
          id: `photo-google-${Date.now()}`,
          url: user.avatarUrl || prev.photos[0]?.url,
          isPrimary: true,
          order: 0,
        },
        ...prev.photos.slice(1),
      ],
    }));
  };

  const signOut = () => {
    setAuthUser(null);
  };

  const clearAllMockData = () => {
    setIsRealDataMode(true);
    setDeck([]);
    setMatches([]);
    setLikesReceived([]);
    setConversations({});
    setCurrentUser({
      ...CURRENT_USER,
      fullName: authUser ? authUser.name : "My Real Profile",
      bio: "Looking for an intentional connection in Nairobi.",
      photos: authUser?.avatarUrl
        ? [{ id: "p1", url: authUser.avatarUrl, isPrimary: true, order: 0 }]
        : [],
      prompts: [],
      completionScore: 50,
    });
  };

  const restoreMockData = () => {
    setIsRealDataMode(false);
    setCurrentUser(CURRENT_USER);
    setDeck(MOCK_DISCOVERY_USERS);
    setMatches(MOCK_MATCHES);
    setLikesReceived(MOCK_LIKES_RECEIVED);
    setConversations(MOCK_CONVERSATIONS);
  };

  const addPhotoToCurrentUser = (photoDataUrl: string) => {
    setCurrentUser((prev) => {
      const newPhoto = {
        id: `photo-${Date.now()}`,
        url: photoDataUrl,
        isPrimary: prev.photos.length === 0,
        order: prev.photos.length,
      };
      const updatedPhotos = [...prev.photos, newPhoto];
      const newScore = Math.min(prev.completionScore + 15, 100);
      return {
        ...prev,
        photos: updatedPhotos,
        completionScore: newScore,
      };
    });
  };

  const addDiscoveryUser = (user: RadaUser) => {
    setDeck((prev) => [user, ...prev]);
  };

  const currentCard = deck.length > 0 ? deck[0] : null;

  // Unread counts
  const unreadMessagesCount = matches.reduce((acc, m) => acc + (m.unreadCount || 0), 0);
  const newLikesCount = likesReceived.length;

  const passCurrentCard = () => {
    if (deck.length === 0) return;
    setDeck((prev) => prev.slice(1));
  };

  const likeCurrentCard = async (comment?: string) => {
    if (deck.length === 0) return;
    const target = deck[0];

    // Advance deck immediately for responsive UX
    setDeck((prev) => prev.slice(1));

    // ── Real API path ──────────────────────────────────────────────────────
    const activeSenderId = dbUserId || (!currentUser.id?.startsWith("user-me") ? currentUser.id : null);
    if (activeSenderId && target.id && !target.id.startsWith("user-")) {
      try {
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: activeSenderId, receiverId: target.id, likeType: "STANDARD", comment }),
        });
        const data = await res.json();
        if (data.matched && (data.matchId || data.conversationId)) {
          // conversationId == matchId in this schema; support both for safety
          const convId = data.conversationId || data.matchId;
          // Fetch full fresh match list from DB so photos/details are accurate
          try {
            const mRes = await fetch(`/api/matches?userId=${activeSenderId}`);
            if (mRes.ok) {
              const mData = await mRes.json();
              if (mData.matches && Array.isArray(mData.matches)) {
                setMatches(mData.matches);
              }
            }
          } catch { /* keep local state */ }
          // Seed conversation locally so the chat opens instantly
          setConversations((prev) => ({
            ...prev,
            [convId]: prev[convId] || [
              { id: `sys-${Date.now()}`, conversationId: convId, senderId: "system",
                content: `✨ Radar aligned! 48h momentum starts now!`, isRead: true, createdAt: "Just now", isSystem: true },
            ],
          }));
          // Store which match to auto-open on /matches page
          setPendingMatchConvId(convId);
          setMatchedUserModal(target);
        }
      } catch (err) {
        console.error("[likeCurrentCard] API error:", err);
      }
      return;
    }


    // ── Local simulation fallback (mock data) ──────────────────────────────
    const isMutual = likesReceived.some((l) => l.senderId === target.id) || target.id === "user-1" || target.id === "user-2";

    if (isMutual) {
      // Trigger Match!
      const newMatchId = `match-${Date.now()}`;
      const newConvId = `conv-${Date.now()}`;

      const newMatch: MatchItem = {
        id: newMatchId,
        conversationId: newConvId,
        matchedWith: target,
        matchedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        unreadCount: 0,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        momentumHoursRemaining: 48,
        isExpired: false,
        lastMessage: comment
          ? {
              id: `msg-${Date.now()}`,
              conversationId: newConvId,
              senderId: currentUser.id,
              content: comment,
              isRead: true,
              createdAt: "Just now",
            }
          : undefined,
      };

      setMatches((prev) => [newMatch, ...prev]);

      // Create conversation thread
      const welcomeMsgs: Message[] = [
        {
          id: `msg-sys-${Date.now()}`,
          conversationId: newConvId,
          senderId: "system",
          content: `✨ Radar aligned! You both connected on intentional dating. You have 48 hours to start the conversation!`,
          isRead: true,
          createdAt: "Just now",
          isSystem: true,
        },
      ];

      if (comment) {
        welcomeMsgs.push({
          id: `msg-${Date.now()}`,
          conversationId: newConvId,
          senderId: currentUser.id,
          content: comment,
          isRead: true,
          createdAt: "Just now",
        });
      }

      setConversations((prev) => ({
        ...prev,
        [newConvId]: welcomeMsgs,
      }));

      // Remove from likes received if present
      setLikesReceived((prev) => prev.filter((l) => l.senderId !== target.id));

      // Trigger Match Modal Celebration
      setMatchedUserModal(target);
    }

    setDeck((prev) => prev.slice(1));
  };

  const superSparkCurrentCard = (comment: string) => {
    likeCurrentCard(comment);
  };

  const closeMatchModal = () => {
    setMatchedUserModal(null);
  };

  const openVipModal = () => setIsVipModalOpen(true);
  const closeVipModal = () => setIsVipModalOpen(false);

  const acceptLike = (likeId: string) => {
    const like = likesReceived.find((l) => l.id === likeId);
    if (!like) return;

    // Create match
    const newConvId = `conv-like-${Date.now()}`;
    const newMatch: MatchItem = {
      id: `match-${Date.now()}`,
      conversationId: newConvId,
      matchedWith: like.sender,
      matchedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      momentumHoursRemaining: 48,
      isExpired: false,
    };

    setMatches((prev) => [newMatch, ...prev]);
    setLikesReceived((prev) => prev.filter((l) => l.id !== likeId));

    setConversations((prev) => ({
      ...prev,
      [newConvId]: [
        {
          id: `m-sys-${Date.now()}`,
          conversationId: newConvId,
          senderId: "system",
          content: `🎉 You connected with ${like.sender.fullName}! Start your momentum now.`,
          isRead: true,
          createdAt: "Just now",
          isSystem: true,
        },
        ...(like.comment
          ? [
              {
                id: `m-comment-${Date.now()}`,
                conversationId: newConvId,
                senderId: like.senderId,
                content: like.comment,
                isRead: true,
                createdAt: like.createdAt,
              },
            ]
          : []),
      ],
    }));

    setMatchedUserModal(like.sender);
  };

  const passLike = (likeId: string) => {
    setLikesReceived((prev) => prev.filter((l) => l.id !== likeId));
  };

  const sendMessage = (conversationId: string, content: string) => {
    if (!content.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      content: content.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setConversations((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    // Update match last message and time
    setMatches((prev) =>
      prev.map((m) => {
        if (m.conversationId === conversationId) {
          return {
            ...m,
            lastMessage: newMsg,
            lastActivity: new Date().toISOString(),
          };
        }
        return m;
      })
    );
  };

  const updateUserIntent = (intent: IntentType) => {
    setCurrentUser((prev) => ({ ...prev, intent }));
  };

  const updateUserBio = (bio: string) => {
    setCurrentUser((prev) => ({ ...prev, bio }));
  };

  const updateProfile = (updates: Partial<RadaUser>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      let score = 40;
      if (updated.photos.length >= 1) score += 20;
      if (updated.photos.length >= 3) score += 10;
      if (updated.prompts.length >= 1) score += 15;
      if (updated.bio) score += 15;
      const finalUser = { ...updated, completionScore: Math.min(score, 100) };

      // Background persist to PostgreSQL database
      fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: finalUser.id,
          fullName: finalUser.fullName,
          age: finalUser.age,
          gender: finalUser.gender,
          interestedIn: finalUser.interestedIn,
          intent: finalUser.intent,
          photos: finalUser.photos,
          bio: finalUser.bio,
          county: finalUser.county,
          area: finalUser.area,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.id) {
            setDbUserId(data.user.id);
            // Save to local test profile list
            try {
              const savedList: RadaUser[] = JSON.parse(localStorage.getItem("rada_saved_test_profiles") || "[]");
              const idx = savedList.findIndex((p) => p.id === data.user.id || p.fullName === finalUser.fullName);
              const toSave = { ...finalUser, id: data.user.id };
              if (idx >= 0) savedList[idx] = toSave;
              else savedList.push(toSave);
              localStorage.setItem("rada_saved_test_profiles", JSON.stringify(savedList));
              setSavedTestProfiles(savedList);
            } catch { /* ignore */ }
          }
        })
        .catch(console.warn);

      return finalUser;
    });
  };

  const switchToProfile = (profile: RadaUser) => {
    setCurrentUser(profile);
    setDbUserId(profile.id);
    try {
      localStorage.setItem("rada_onboarded", "1");
    } catch { /* ignore */ }
  };

  const createTestProfile = async (preset: "MALE" | "FEMALE"): Promise<RadaUser> => {
    const isMale = preset === "MALE";
    const newProfile: RadaUser = {
      id: `test-${preset.toLowerCase()}-${Date.now()}`,
      fullName: isMale ? "Brian Otieno" : "Sarah Wanjiku",
      birthDate: isMale ? "1997-06-15" : "2000-03-22",
      age: isMale ? 27 : 24,
      gender: isMale ? "MAN" : "WOMAN",
      interestedIn: isMale ? ["WOMAN"] : ["MAN"],
      county: "Tharaka-Nithi",
      area: "Chuka",
      occupation: isMale ? "Tech Entrepreneur" : "Brand Strategist",
      intent: "INTENTIONAL_DATING",
      bio: isMale
        ? "Looking for an intentional partner. Deep talks over coffee & authentic vibes."
        : "Looking for someone genuine who knows what they want. Authentic vibes.",
      photos: [],
      prompts: [],
      verified: true,
      completionScore: 85,
      isVip: false,
      lastActive: "Just now",
    };

    // Save to database
    try {
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newProfile.fullName,
          age: newProfile.age,
          gender: newProfile.gender,
          interestedIn: newProfile.interestedIn,
          intent: newProfile.intent,
          photos: newProfile.photos,
          bio: newProfile.bio,
          county: newProfile.county,
          area: newProfile.area,
        }),
      });
      const data = await res.json();
      if (data.user?.id) {
        newProfile.id = data.user.id;
      }
    } catch (e) {
      console.warn("Could not save preset to DB:", e);
    }

    // Add to saved list
    try {
      const list: RadaUser[] = JSON.parse(localStorage.getItem("rada_saved_test_profiles") || "[]");
      const filtered = list.filter((p) => p.id !== newProfile.id && p.fullName !== newProfile.fullName);
      const updated = [newProfile, ...filtered];
      localStorage.setItem("rada_saved_test_profiles", JSON.stringify(updated));
      setSavedTestProfiles(updated);
    } catch { /* ignore */ }

    switchToProfile(newProfile);
    return newProfile;
  };

  const upgradeToVip = () => {
    setCurrentUser((prev) => ({ ...prev, isVip: true }));
    setIsVipModalOpen(false);
  };

  const blockUser = (userId: string) => {
    setDeck((prev) => prev.filter((u) => u.id !== userId));
    setMatches((prev) => prev.filter((m) => m.matchedWith.id !== userId));
    setLikesReceived((prev) => prev.filter((l) => l.senderId !== userId));
  };

  const reportUser = (userId: string, _reason: string) => {
    blockUser(userId);
  };

  const resetDeck = () => {
    setDeck(MOCK_DISCOVERY_USERS);
  };

  // ── Real API: Fetch Live Matches from DB ─────────────────────────────────
  const refreshMatches = useCallback(async () => {
    const activeId = dbUserId || (currentUser.id?.startsWith("user-me") ? "" : currentUser.id) || "";
    if (!activeId) return;
    try {
      const res = await fetch(`/api/matches?userId=${activeId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.matches && Array.isArray(data.matches)) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("[RadaContext] refreshMatches error:", err);
    }
  }, [dbUserId, currentUser.id]);

  // ── Real API: Fetch Discovery Deck ────────────────────────────────────────
  const refreshDiscover = useCallback(async () => {
    // Always use the real DB id for exclusion so the user never sees themselves
    const activeId = dbUserId || (currentUser.id?.startsWith("user-me") ? "" : currentUser.id) || "";
    setDeck((prev) => {
      if (prev.length === 0) setIsLoadingDeck(true);
      return prev;
    });
    try {
      const interestedGenders = (currentUser.interestedIn && currentUser.interestedIn.length > 0)
        ? currentUser.interestedIn.join(",")
        : (currentUser.gender === "MAN" ? "WOMAN" : "MAN");
      const params = new URLSearchParams({
        userId: activeId,
        limit: "25",
        interestedIn: interestedGenders,
        userIntent: currentUser.intent || "INTENTIONAL_DATING",
        useLocation: useLocation.toString(),
        ...(useLocation && currentUser.county ? { county: currentUser.county } : {}),
        ...(useLocation && currentUser.area ? { area: currentUser.area } : {}),
        ...(useLocation && currentUser.latitude !== undefined ? { latitude: currentUser.latitude.toString() } : {}),
        ...(useLocation && currentUser.longitude !== undefined ? { longitude: currentUser.longitude.toString() } : {}),
      });
      const res = await fetch(`/api/discover?${params}`);
      if (!res.ok) throw new Error("Failed to fetch discover deck");
      const data = await res.json();
      if (data.deck && Array.isArray(data.deck)) {
        const allowedGenders = (currentUser.interestedIn && currentUser.interestedIn.length > 0)
          ? currentUser.interestedIn
          : [currentUser.gender === "MAN" ? "WOMAN" : "MAN"];
        const allowsAll = allowedGenders.some((g) => (g as string).toUpperCase() === "BOTH" || (g as string).toUpperCase() === "ALL");

        // Double-filter: exclude by DB id, local id, full name, email, and strictly enforce gender preference
        const clean = data.deck.filter((u: RadaUser) => {
          if (activeId && u.id === activeId) return false;
          if (currentUser.id && u.id === currentUser.id) return false;
          if (currentUser.fullName && u.fullName && u.fullName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase()) return false;
          if (currentUser.email && u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) return false;

          if (!allowsAll && !allowedGenders.includes(u.gender)) {
            return false;
          }
          return true;
        });
        setDeck(clean);
      }
    } catch (err) {
      console.error("[RadaContext] refreshDiscover error:", err);
      setDeck([]);
    } finally {
      setIsLoadingDeck(false);
    }
  }, [dbUserId, currentUser.id, currentUser.fullName, currentUser.intent, currentUser.gender, currentUser.interestedIn?.join(","), currentUser.county, currentUser.area, currentUser.latitude, currentUser.longitude, useLocation]);

  // Auto-refresh deck when hydrated or when current user preferences change
  useEffect(() => {
    if (isHydrated) {
      refreshDiscover();
    }
  }, [isHydrated, dbUserId, currentUser.gender, currentUser.intent, currentUser.interestedIn?.join(","), currentUser.county, currentUser.area, currentUser.latitude, currentUser.longitude, useLocation, refreshDiscover]);

  // Auto-load live matches from DB on hydration (so chats are real)
  useEffect(() => {
    if (isHydrated) {
      refreshMatches();
    }
  }, [isHydrated, dbUserId, refreshMatches]);

  // ── Location Toggle ───────────────────────────────────────────────────────
  const toggleLocation = useCallback(() => {
    if (useLocation) {
      // Turn off location
      setUseLocation(false);
      setLocationError(null);
      if (dbUserId) {
        fetch("/api/location", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: dbUserId }),
        }).catch(console.error);
      }
    } else {
      // Activate location mode immediately using current county / area
      setUseLocation(true);
      setLocationError(null);

      if (!navigator.geolocation) {
        geolocateByIP().then((ipGeo) => {
          setCurrentUser((prev) => ({
            ...prev,
            county: ipGeo.county,
            area: ipGeo.area,
          }));
        }).catch(() => {});
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setUseLocation(true);
          setLocationError(null);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            // Reverse geocode GPS to actual Kenyan County and Area
            const geo = await reverseGeocodeKenya(lat, lng);

            setCurrentUser((prev) => ({
              ...prev,
              county: geo.county,
              area: geo.area,
              latitude: lat,
              longitude: lng,
            }));

            // Sync with DB
            if (dbUserId) {
              const res = await fetch("/api/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: dbUserId,
                  latitude: lat,
                  longitude: lng,
                  county: geo.county,
                  area: geo.area,
                }),
              });
              const data = await res.json();
              if (data.county) {
                setCurrentUser((prev) => ({
                  ...prev,
                  county: data.county,
                  area: data.area || geo.area,
                  latitude: data.latitude ?? lat,
                  longitude: data.longitude ?? lng,
                }));
              }
            }
          } catch (err) {
            console.warn("[Location reverse geocode error]:", err);
          }
        },
        async (err) => {
          // If browser GPS times out or fails, seamlessly fall back to IP location
          try {
            const ipGeo = await geolocateByIP();
            setUseLocation(true);
            setLocationError(null);
            setCurrentUser((prev) => ({
              ...prev,
              county: ipGeo.county,
              area: ipGeo.area,
            }));
            if (dbUserId) {
              fetch("/api/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: dbUserId,
                  county: ipGeo.county,
                  area: ipGeo.area,
                }),
              }).catch(console.error);
            }
          } catch {
            // Only show message if permission was explicitly blocked
            if (err.code === 1) {
              setLocationError("Location permission needed — you can also pick your county in Profile.");
              setTimeout(() => setLocationError(null), 5000);
            }
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 600000,
        }
      );
    }
  }, [useLocation, dbUserId]);

  // Coin economy methods
  const refreshCoinBalance = async () => {
    const uid = dbUserId || currentUser.id;
    if (!uid) return;
    try {
      const res = await fetch(`/api/coins/balance?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.coins === "number") {
          setCurrentUser((prev) => ({ ...prev, coins: data.coins }));
        }
      }
    } catch (e) {
      console.warn("Coin balance sync failed", e);
    }
  };

  const spendCoins = async (action: "CHAT_UNLOCK" | "DIRECT_MESSAGE" | "BOOST", targetUserId?: string) => {
    const uid = dbUserId || currentUser.id;
    try {
      const res = await fetch("/api/coins/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, action, targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to spend coins" };
      }
      if (typeof data.remainingCoins === "number") {
        setCurrentUser((prev) => ({ ...prev, coins: data.remainingCoins }));
      }
      return { success: true, remainingCoins: data.remainingCoins };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const purchaseCoins = async (packId: "SPARK_50" | "CUPID_200" | "ROYAL_500", phoneNumber: string) => {
    const uid = dbUserId || currentUser.id;
    try {
      const res = await fetch("/api/coins/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, packId, phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to purchase coins" };
      }
      if (typeof data.balance === "number") {
        setCurrentUser((prev) => ({ ...prev, coins: data.balance }));
      }
      return { success: true, balance: data.balance };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const unlockConversationWithCoins = async (conversationId: string) => {
    const res = await spendCoins("CHAT_UNLOCK");
    if (res.success) {
      setUnlockedConversations((prev) => [...new Set([...prev, conversationId])]);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const canSendMessageInConversation = (conversationId: string) => {
    if (currentUser.isVip || unlockedConversations.includes(conversationId)) {
      return { allowed: true, remainingFree: Infinity, requiresUnlock: false };
    }
    const msgs = conversations[conversationId] || [];
    const userSentCount = msgs.filter((m) => m.senderId === currentUser.id || m.senderId === dbUserId).length;
    const remainingFree = Math.max(0, 5 - userSentCount);
    const requiresUnlock = remainingFree === 0;
    return { allowed: !requiresUnlock, remainingFree, requiresUnlock };
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      const user = data.user;
      setDbUserId(user.id);
      const auth: AuthUser = {
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatarUrl: user.photos?.[0]?.url || "",
        provider: "google",
        signedInAt: new Date().toISOString(),
      };
      setAuthUser(auth);
      // sync profile
      try {
        const profileRes = await fetch(`/api/profile/me?userId=${user.id}`);
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.user) {
            setCurrentUser((prev) => ({ ...prev, ...pData.user }));
          }
        }
      } catch {}
      try {
        localStorage.setItem("rada_onboarded", "1");
      } catch {}
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const registerWithEmailPassword = async (regData: { email: string; password: string; fullName: string; gender?: string; intent?: string; county?: string; area?: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }
      const user = data.user;
      setDbUserId(user.id);
      const auth: AuthUser = {
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatarUrl: "",
        provider: "google",
        signedInAt: new Date().toISOString(),
      };
      setAuthUser(auth);
      try {
        const profileRes = await fetch(`/api/profile/me?userId=${user.id}`);
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.user) {
            setCurrentUser((prev) => ({ ...prev, ...pData.user }));
          }
        }
      } catch {}
      try {
        localStorage.setItem("rada_onboarded", "1");
      } catch {}
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  return (
    <RadaContext.Provider
      value={{
        currentUser,
        deck,
        currentCard,
        matches,
        likesReceived,
        conversations,
        matchedUserModal,
        isVipModalOpen,
        unreadMessagesCount,
        newLikesCount,
        authUser,
        isRealDataMode,
        isHydrated,
        useLocation,
        locationError,
        toggleLocation,
        setLocationError,
        signInWithGoogle,
        signOut,
        clearAllMockData,
        restoreMockData,
        addPhotoToCurrentUser,
        addDiscoveryUser,
        passCurrentCard,
        likeCurrentCard,
        superSparkCurrentCard,
        closeMatchModal,
        openVipModal,
        closeVipModal,
        acceptLike,
        passLike,
        sendMessage,
        updateUserIntent,
        updateUserBio,
        updateProfile,
        upgradeToVip,
        blockUser,
        reportUser,
        resetDeck,
        refreshDiscover,
        refreshMatches,
        isLoadingDeck,
        dbUserId,
        setDbUserId,
        pendingMatchConvId,
        clearPendingMatch,
        switchToProfile,
        savedTestProfiles,
        createTestProfile,
        setConversations,
        setMatches,
        // Coin economy
        coins: currentUser.coins ?? 20,
        isCoinModalOpen,
        openCoinModal,
        closeCoinModal,
        unlockedConversations,
        spendCoins,
        purchaseCoins,
        refreshCoinBalance,
        unlockConversationWithCoins,
        canSendMessageInConversation,
        signInWithEmailPassword,
        registerWithEmailPassword,
      }}
    >
      {children}
    </RadaContext.Provider>
  );
};

export const useRada = () => {
  const context = useContext(RadaContext);
  if (!context) {
    throw new Error("useRada must be used within a RadaProvider");
  }
  return context;
};

export default RadaProvider;
