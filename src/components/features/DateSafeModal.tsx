"use client";

import React, { useState } from "react";
import { useRada } from "@/lib/rada-context";
import { DateEscrow, Message } from "@/lib/types";

interface DateSafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  partnerName: string;
  partnerId: string;
  onEscrowCreated: (escrow: DateEscrow) => void;
}

const POPULAR_VENUES = [
  { name: "Artcaffé Westgate", area: "Westlands, Nairobi", tag: "Coffee & Dining" },
  { name: "Java House Kilimani", area: "Argwings Kodhek, Nairobi", tag: "Casual Coffee" },
  { name: "CJ's Koinange Street", area: "CBD, Nairobi", tag: "Hearty Brunch" },
  { name: "River Café Karura", area: "Karura Forest, Nairobi", tag: "Nature & Coffee" },
  { name: "Ankole Grill Kilimani", area: "Senteu Plaza, Nairobi", tag: "Steak & Drinks" },
  { name: "Pallet Cafe Lavington", area: "James Gichuru, Nairobi", tag: "Artisan & Quiet" },
  { name: "Java House Nyali", area: "Links Road, Mombasa", tag: "Coastal Coffee" },
  { name: "Java House West End", area: "Kisumu CBD", tag: "Lakeside Coffee" },
];

export const DateSafeModal: React.FC<DateSafeModalProps> = ({
  isOpen,
  onClose,
  matchId,
  partnerName,
  partnerId,
  onEscrowCreated,
}) => {
  const { currentUser } = useRada();
  const [selectedVenue, setSelectedVenue] = useState(POPULAR_VENUES[0]);
  const [amount, setAmount] = useState<number>(1000);
  const [phone, setPhone] = useState("");
  const [isLocking, setIsLocking] = useState(false);
  const [step, setStep] = useState<"DETAILS" | "CONFIRM_MPESA" | "SUCCESS">("DETAILS");
  const [createdEscrow, setCreatedEscrow] = useState<DateEscrow | null>(null);

  if (!isOpen) return null;

  const handleInitiateEscrow = () => {
    setIsLocking(true);
    // Simulate Daraja STK Push prompt for Escrow
    setTimeout(() => {
      setIsLocking(false);
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const newEscrow: DateEscrow = {
        id: `escrow_${Date.now()}`,
        matchId,
        senderId: currentUser.id,
        receiverId: partnerId,
        amountKsh: amount,
        venueName: selectedVenue.name,
        venueArea: selectedVenue.area,
        status: "HELD",
        checkInPin: pin,
        createdAt: new Date().toISOString(),
      };
      setCreatedEscrow(newEscrow);
      setStep("SUCCESS");
      onEscrowCreated(newEscrow);
    }, 1500);
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
        border: "1.5px solid rgba(52, 211, 153, 0.4)",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "440px",
        padding: "24px 22px",
        color: "var(--rada-pearl, #FFF8F0)",
        boxShadow: "0 10px 40px rgba(16, 185, 129, 0.2)",
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              background: "rgba(52, 211, 153, 0.15)",
              color: "#34D399",
              padding: "8px 12px",
              borderRadius: "14px",
              fontSize: "20px",
            }}>
              🛡️
            </span>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                Rada DateSafe™ Escrow
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>
                Guaranteed transport & public safety for your date with {partnerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {step === "DETAILS" && (
          <>
            {/* Why DateSafe card */}
            <div style={{
              background: "rgba(52, 211, 153, 0.08)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "14px",
              padding: "12px 14px",
              marginBottom: "18px",
              fontSize: "12.5px",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.5,
            }}>
              <b style={{ color: "#34D399" }}>How DateSafe protects both of you:</b>
              <div style={{ marginTop: "4px" }}>
                • Funds are held securely in escrow — never sent directly to personal wallets.<br />
                • Both daters verify attendance with a 6-digit PIN upon arriving at the café.<br />
                • Zero fare scams or ghosting. Auto-refunds if plans change.
              </div>
            </div>

            {/* Venue Picker */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--rada-gold, #E5A93C)", textTransform: "uppercase" }}>
                Select Safe Verified Public Venue
              </label>
              <div style={{
                display: "grid",
                gap: "8px",
                marginTop: "8px",
                maxHeight: "160px",
                overflowY: "auto",
                paddingRight: "4px",
              }}>
                {POPULAR_VENUES.map((v) => {
                  const selected = selectedVenue.name === v.name;
                  return (
                    <div
                      key={v.name}
                      onClick={() => setSelectedVenue(v)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "12px",
                        background: selected ? "rgba(52, 211, 153, 0.12)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${selected ? "#34D399" : "rgba(255,255,255,0.1)"}`,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: 700 }}>{v.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{v.area}</div>
                      </div>
                      <span style={{ fontSize: "10.5px", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "8px" }}>
                        {v.tag}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stipend Amount Picker */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--rada-gold, #E5A93C)", textTransform: "uppercase" }}>
                Transport / Fare Stipend (Locked in Escrow)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "8px" }}>
                {[500, 1000, 1500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    style={{
                      padding: "12px 8px",
                      borderRadius: "12px",
                      background: amount === amt ? "rgba(52, 211, 153, 0.2)" : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${amount === amt ? "#34D399" : "rgba(255,255,255,0.1)"}`,
                      color: amount === amt ? "#34D399" : "#FFF",
                      fontWeight: 800,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    KES {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep("CONFIRM_MPESA")}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #10B981, #059669)",
                border: "none",
                color: "#FFF",
                fontWeight: 800,
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(16, 185, 129, 0.35)",
              }}
            >
              Continue with M-Pesa (KES {amount}) →
            </button>
          </>
        )}

        {step === "CONFIRM_MPESA" && (
          <div>
            <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "8px" }}>📲</div>
              <h3 style={{ fontSize: "19px", fontWeight: 800, margin: 0 }}>Authorize M-Pesa Escrow</h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                Lock <b>KES {amount}</b> for your date at <b>{selectedVenue.name}</b>
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "6px" }}>
                M-Pesa Safaricom Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  color: "#FFF",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <button
              onClick={handleInitiateEscrow}
              disabled={isLocking}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #10B981, #059669)",
                border: "none",
                color: "#FFF",
                fontWeight: 800,
                fontSize: "15px",
                cursor: isLocking ? "wait" : "pointer",
                boxShadow: "0 4px 18px rgba(16, 185, 129, 0.35)",
                marginBottom: "10px",
              }}
            >
              {isLocking ? "Locking in Escrow..." : `Lock KES ${amount} in DateSafe Escrow`}
            </button>
            <button
              onClick={() => setStep("DETAILS")}
              style={{
                width: "100%",
                padding: "10px",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ← Back to Details
            </button>
          </div>
        )}

        {step === "SUCCESS" && createdEscrow && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: "56px", marginBottom: "8px" }}>🛡️✨</div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#34D399", margin: "0 0 6px" }}>
              DateSafe Escrow Active!
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>
              KES {createdEscrow.amountKsh} is locked for your date at <b>{createdEscrow.venueName}</b>.
            </p>

            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1.5px dashed #34D399",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "24px",
            }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>
                Mutual Check-in PIN
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "6px", color: "#34D399", margin: "6px 0" }}>
                {createdEscrow.checkInPin}
              </div>
              <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.6)" }}>
                Share this PIN when you both meet at {createdEscrow.venueName} to release transport.
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #10B981, #059669)",
                border: "none",
                color: "#FFF",
                fontWeight: 800,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Done — Sent to Chat 💬
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateSafeModal;

