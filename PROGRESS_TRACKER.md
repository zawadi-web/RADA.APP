# RADA 2.0 — Development & Progress Tracker

> **Document Version:** 2.1.0 (Mutual Matching & Display Stability Verified)  
> **Last Updated:** October 10, 2026  
> **Status:** Active & Mutually Verified  
> **Live Dev Server:** `http://localhost:3000`

---

## 1. Executive Summary & Incident Resolution

### The Incident
During multi-browser testing with two user accounts:
1. **Browser 1 (Male profile "Baby"):** A match card appeared briefly for a fraction of a second and immediately disappeared, replaced by the loading screen `"Finding your best matches..."`.
2. **Browser 2 (Female profile "Baby Myrah"):** Showed `"Radar Ready - No new profiles on your radar matching your preferences right now."`, even though the male profile existed.

---

## 2. Root Causes Identified & Fixed

### Root Cause 1: Screen Unmount & Re-fetch Loop ("Disappearing Card")
- **What happened:**
  1. In `src/app/discover/page.tsx`, line 181 had `if (isLoadingDeck)` which unconditionally unmounted the entire card stack and replaced it with the fullscreen loader (`"Finding your best matches..."`).
  2. In `src/lib/rada-context.tsx`, `refreshDiscover` had `deck.length` in its `useCallback` dependency list. When a card loaded, `deck.length` changed from 0 to 1, re-creating `refreshDiscover`, which re-triggered the `useEffect` auto-refresh, setting `isLoadingDeck = true` and immediately blowing away the visible card.
- **The Fix:**
  1. Updated `discover/page.tsx` to `if (isLoadingDeck && !currentCard)`. If a card is already in view, it stays visible smoothly without flashing or disappearing.
  2. Stabilized `refreshDiscover` dependencies by removing `deck.length` and using primitive string comparisons (`interestedIn.join(',')`) to prevent unnecessary re-fetch loops.

### Root Cause 2: Both Database Accounts Were Saved as Women Seeking Men
- **What happened:**
  In Supabase PostgreSQL, inspection revealed:
  - Account 1 (`Baby Myrah`): `gender: "WOMAN"`, `seeking: ["MAN"]`
  - Account 2 (`Baby`): `gender: "WOMAN"`, `seeking: ["MAN"]`
  Both accounts in the database were registered as women seeking men! When Account 1 searched for men, the database returned 0 results because there were no male accounts. When Account 2 searched for men, it also returned 0 results.
- **The Fix:**
  1. Updated Account 2 (`Baby`, ID: `cmv1bl7o20004ejktjw3thby9`) to:
     - `gender: "MAN"`
     - `interestedInGenders: ["WOMAN"]`
     - `intent: "LONG_TERM"`
  2. Verified Account 1 (`Baby Myrah`, ID: `cmv18o5p000003886mvrxjnji`):
     - `gender: "WOMAN"`
     - `interestedInGenders: ["MAN", "BOTH"]`
     - `intent: "LONG_TERM"`

### Root Cause 3: Stale Client State on Initial Mount
- **What happened:** When switching browser tabs or reopening the browser, `localStorage` held previously cached gender and preferences instead of syncing with the live database.
- **The Fix:** Created `GET /api/profile/me` and added automatic background profile synchronization on mount in `rada-context.tsx`. When a user loads the app, their latest database gender, intent, and preference values are loaded.

---

## 3. Verified Database State & Mutual Matching Tests

| Account Name | Gender | Seeking | Intent | Database ID | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baby** | `MAN` | `['WOMAN']` | `LONG_TERM` | `cmv1bl7o20004ejktjw3thby9` | Verified |
| **Baby Myrah** | `WOMAN` | `['MAN', 'BOTH']` | `LONG_TERM` | `cmv18o5p000003886mvrxjnji` | Verified |

### API Test Output:
```bash
# Query as Male (Baby):
GET /api/discover?userId=cmv1bl7o20004ejktjw3thby9&interestedIn=WOMAN&userIntent=LONG_TERM
-> Results: 1 profile found
-> Top card: Baby Myrah (WOMAN, LONG_TERM) [MATCH VERIFIED]

# Query as Female (Baby Myrah):
GET /api/discover?userId=cmv18o5p000003886mvrxjnji&interestedIn=MAN&userIntent=LONG_TERM
-> Results: 1 profile found
-> Top card: Baby (MAN, LONG_TERM) [MATCH VERIFIED]
```

---

## 4. How to Test in Your Browsers Right Now

1. **In Browser 1 (Male Account - Baby):**
   - Refresh `http://localhost:3000/discover`
   - **Baby Myrah** is permanently displayed with her photo, age, location, and the Long-term intention badge.
   - The card will not flicker or disappear.
2. **In Browser 2 (Female Account - Baby Myrah):**
   - Refresh `http://localhost:3000/discover`
   - **Baby** (the male profile) is permanently displayed on her radar.
