"use client";

import React, { useState } from "react";
import { useRada } from "@/lib/rada-context";
import { DatePlan } from "@/lib/types";

interface DatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  partnerName: string;
  onPlanCreated: (plan: DatePlan) => void;
}

const ACTIVITIES = [
  { id: "BRUNCH", label: "Sunday Brunch", emoji: "🥞", defaultVenue: "Ankole Grill Kilimani" },
  { id: "COFFEE", label: "Artisan Coffee", emoji: "☕", defaultVenue: "Pallet Cafe Lavington" },
  { id: "HIKE", label: "Karura Forest Walk", emoji: "🌲", defaultVenue: "River Café Karura" },
  { id: "JAZZ", label: "Live Jazz & Wine", emoji: "🎷", defaultVenue: "Geco Cafe Lavington" },
  { id: "ART", label: "Art Gallery & Bites", emoji: "🎨", defaultVenue: "Circle Art Gallery" },
  { id: "CINEMA", label: "Cinema & Dinner", emoji: "🍿", defaultVenue: "Westgate Cinema" },
];

const TIME_OPTIONS = [
  "This Saturday @ 3:00 PM",
  "This Saturday @ 6:30 PM",
  "This Sunday @ 11:30 AM (Brunch)",
  "This Sunday @ 4:00 PM (Sundowner)",
  "Friday Evening @ 7:00 PM",
];

export const DatePlanModal: React.FC<DatePlanModalProps> = ({
  isOpen,
  onClose,
  matchId,
  partnerName,
  onPlanCreated,
}) => {
  const { currentUser } = useRada();
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
  const [venue, setVenue] = useState(ACTIVITIES[0].defaultVenue);
  const [day, setDay] = useState(TIME_OPTIONS[2]);

  if (!isOpen) return null;

  const handleSelectActivity = (act: typeof ACTIVITIES[0]) => {
    setSelectedActivity(act);
    setVenue(act.defaultVenue);
  };

  const handleSendPlan = () => {
    const plan: DatePlan = {
      id: `plan_${Date.now()}`,
      matchId,
      proposerId: currentUser.id,
      activity: selectedActivity.label,
      venue,
      day,
      status: "PROPOSED",
    };
    onPlanCreated(plan);
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "inherit",
    }}>
      <div style={{
        background: "var(--rada-bg, #0A0A0C)",
        border: "1.5px solid rgba(229, 169, 60, 0.4)",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "440px",
        padding: "24px 22px",
        color: "var(--rada-pearl, #FFF8F0)",
        boxShadow: "0 10px 40px rgba(229, 169, 60, 0.2)",
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0 }}>
              📅 Plan a Real-World Date
            </h2>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>
              Skip 3 weeks of texting — invite {partnerName} out this weekend!
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Activity Picker */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--rada-gold, #E5A93C)", textTransform: "uppercase" }}>
            Choose Vibe / Activity
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
            {ACTIVITIES.map((act) => {
              const selected = selectedActivity.id === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => handleSelectActivity(act)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: selected ? "rgba(229, 169, 60, 0.15)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${selected ? "var(--rada-gold, #E5A93C)" : "rgba(255,255,255,0.1)"}`,
                    color: selected ? "var(--rada-gold, #E5A93C)" : "#FFF",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{act.emoji}</span>
                  <span style={{ fontSize: "12.5px", fontWeight: 700 }}>{act.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Venue Field */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--rada-gold, #E5A93C)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            Venue / Spot
          </label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              color: "#FFF",
              fontSize: "14px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        {/* Day & Time Picker */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--rada-gold, #E5A93C)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            Suggested Day & Time
          </label>
          <div style={{ display: "grid", gap: "6px" }}>
            {TIME_OPTIONS.map((t) => {
              const selected = day === t;
              return (
                <div
                  key={t}
                  onClick={() => setDay(t)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: selected ? "rgba(229, 169, 60, 0.12)" : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${selected ? "var(--rada-gold, #E5A93C)" : "rgba(255,255,255,0.08)"}`,
                    color: selected ? "var(--rada-gold, #E5A93C)" : "rgba(255,255,255,0.85)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{t}</span>
                  {selected && <span>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSendPlan}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #E5A93C, #C59B27)",
            border: "none",
            color: "#0A0A0C",
            fontWeight: 800,
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(229, 169, 60, 0.35)",
          }}
        >
          Send Date Proposal to {partnerName} 💌
        </button>
      </div>
    </div>
  );
};

export default DatePlanModal;

