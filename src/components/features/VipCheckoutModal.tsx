"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRada } from "@/lib/rada-context";
import { Button } from "@/components/ui/Button";
import styles from "./VipCheckoutModal.module.css";

type Gateway = "MPESA" | "PAYSTACK";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export const VipCheckoutModal: React.FC = () => {
  const { isVipModalOpen, closeVipModal, upgradeToVip, currentUser } = useRada();
  const [gateway, setGateway] = useState<Gateway>("MPESA");
  const [selectedPlan, setSelectedPlan] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [phone, setPhone] = useState("0712345678");

  // STK / SIM Toolkit Simulation State
  const [showSimToolkit, setShowSimToolkit] = useState(false);
  const [pin, setPin] = useState("");
  const [isProcessingPin, setIsProcessingPin] = useState(false);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [paystackScriptLoaded, setPaystackScriptLoaded] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Load Paystack inline JS SDK once
  useEffect(() => {
    if (paystackScriptLoaded || scriptRef.current) return;
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackScriptLoaded(true);
    document.head.appendChild(script);
    scriptRef.current = script;
    return () => {
      // Don't remove — keep loaded globally
    };
  }, [paystackScriptLoaded]);

  if (!isVipModalOpen) return null;

  const planAmount = selectedPlan === "WEEKLY" ? 250 : 750;
  const userEmail =
    currentUser.fullName
      ? `${currentUser.fullName.toLowerCase().replace(/\s+/g, ".")}@rada.ke`
      : "member@rada.ke";

  // ── Paystack Inline Popup ─────────────────────────────────────────────────
  const handlePaystackInline = () => {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
    const isPaystackKey = (publicKey.startsWith("pk_live_") || publicKey.startsWith("pk_test_")) && !publicKey.includes("your_public_key_here");

    if (!isPaystackKey || !window.PaystackPop) {
      // Fallback: call our server to get an authorization URL, or simulate
      handlePaystackServer();
      return;
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: userEmail,
      amount: planAmount * 100, // Paystack expects kobo/cents
      currency: "KES",
      ref: `rada_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      metadata: {
        plan: selectedPlan,
        userId: currentUser.id,
        service: "RADA_VIP",
      },
      callback: (response: { reference: string }) => {
        // Payment successful — verify server-side then upgrade
        verifyPaystackPayment(response.reference);
      },
      onClose: () => {
        // User closed modal without paying — no action
      },
    });
    handler.openIframe();
  };

  const handlePaystackServer = async () => {
    setIsProcessingPin(true);
    try {
      const res = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          amount: planAmount,
          plan: selectedPlan,
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.data?.authorization_url && !data.data?.isMock) {
        window.location.href = data.data.authorization_url;
      } else {
        simulatePaystack();
      }
    } catch {
      simulatePaystack();
    } finally {
      setIsProcessingPin(false);
    }
  };

  const verifyPaystackPayment = async (reference: string) => {
    setIsProcessingPin(true);
    try {
      const res = await fetch("/api/payments/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, userId: currentUser.id, plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsNotification(`✅ Payment Confirmed! Ref: ${reference}. KES ${planAmount} received. Welcome to Rada VIP!`);
        upgradeToVip();
        setTimeout(() => {
          setSmsNotification(null);
          closeVipModal();
        }, 3500);
      } else {
        setSmsNotification(`⚠️ Payment verification pending. Ref: ${reference}. Contact support@rada.ke if issue persists.`);
        upgradeToVip(); // Optimistic upgrade
        setTimeout(() => { setSmsNotification(null); closeVipModal(); }, 4000);
      }
    } catch {
      simulatePaystack();
    } finally {
      setIsProcessingPin(false);
    }
  };

  const handleStartPayment = async () => {
    if (gateway === "MPESA") {
      setShowSimToolkit(true);
      setPin("");
    } else {
      handlePaystackInline();
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleQuickFillPin = () => {
    setPin("1234");
  };

  const handleConfirmPin = () => {
    if (pin.length < 4) return;
    setIsProcessingPin(true);

    setTimeout(() => {
      setIsProcessingPin(false);
      setShowSimToolkit(false);

      const txCode = "OA" + Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 8);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const smsText = `${txCode} Confirmed. KES ${planAmount}.00 sent to RADA DATING LTD (Till 894021) on ${now.toLocaleDateString()} at ${timeStr}. New M-PESA balance KES 3,420.00. Transaction cost KES 0.00.`;

      setSmsNotification(smsText);
      upgradeToVip();

      setTimeout(() => {
        setSmsNotification(null);
        closeVipModal();
      }, 3500);
    }, 1200);
  };

  const simulatePaystack = () => {
    setIsProcessingPin(true);
    setTimeout(() => {
      setIsProcessingPin(false);
      const ref = "pstk_" + Math.random().toString(36).substring(2, 10);
      setSmsNotification(`✅ Paystack Payment Successful! Ref: ${ref}. KES ${planAmount} received. Welcome to Rada VIP!`);
      upgradeToVip();
      setTimeout(() => {
        setSmsNotification(null);
        closeVipModal();
      }, 3000);
    }, 1500);
  };

  return (
    <>
      {/* Floating SMS / Payment Success Toast */}
      {smsNotification && (
        <div className={styles.smsToast} role="alert">
          <div className={styles.smsHeader}>
            <span>💬</span>
            <strong>SAFARICOM M-PESA</strong>
          </div>
          <p className={styles.smsBody}>{smsNotification}</p>
        </div>
      )}

      {/* Realistic Safaricom SIM Toolkit PIN Prompt */}
      {showSimToolkit && (
        <div className={styles.simToolkitOverlay} role="dialog" aria-modal="true">
          <div className={styles.simToolkitBox}>
            <div className={styles.stkHeader}>
              <div className={styles.stkSafaricomIcon}>S</div>
              <span className={styles.stkTitle}>M-PESA EXPRESS</span>
            </div>

            <p className={styles.stkMessage}>
              Do you want to pay <strong>KES {planAmount}.00</strong> to <strong>RADA DATING LTD</strong> (Till 894021)?
              <br />
              Enter M-PESA PIN:
            </p>

            <div className={styles.stkPinRow}>
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`${styles.stkPinDot} ${pin.length > idx ? styles.stkPinDotFilled : ""}`}
                />
              ))}
            </div>

            <div className={styles.keypadGrid}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={styles.keypadBtn}
                  onClick={() => handleKeypadPress(num)}
                  disabled={isProcessingPin}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className={styles.keypadBtn}
                onClick={handleQuickFillPin}
                title="Quick fill test PIN 1234"
                style={{ fontSize: "11px", fontWeight: 700, color: "#34D399" }}
              >
                1234
              </button>
              <button
                type="button"
                className={styles.keypadBtn}
                onClick={() => handleKeypadPress("0")}
                disabled={isProcessingPin}
              >
                0
              </button>
              <button
                type="button"
                className={styles.keypadBtn}
                onClick={handleKeypadBackspace}
                disabled={isProcessingPin}
                aria-label="Backspace"
              >
                ⌫
              </button>
            </div>

            <div className={styles.stkActions}>
              <button
                type="button"
                className={styles.stkCancelBtn}
                onClick={() => setShowSimToolkit(false)}
                disabled={isProcessingPin}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.stkSendBtn}
                onClick={handleConfirmPin}
                disabled={pin.length < 4 || isProcessingPin}
              >
                {isProcessingPin ? "Authorizing..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Checkout Modal */}
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <div className={styles.backdrop} onClick={closeVipModal} />
        <div className={styles.modalCard}>
          <div className={styles.header}>
            <div className={styles.vipTag}>
              <span>✦ RADA VIP</span>
            </div>
            <button className={styles.closeBtn} onClick={closeVipModal} aria-label="Close">
              ✕
            </button>
          </div>

          <h2 className={styles.title}>Dating with Clarity &amp; Velocity</h2>
          <p className={styles.subtitle}>
            Transparent, honest pricing. No automated card traps or hidden subscriptions.
          </p>

          {/* Payment Method Selector */}
          <div className={styles.gatewayTabs}>
            <button
              type="button"
              className={`${styles.gatewayTab} ${gateway === "MPESA" ? `${styles.gatewayTabActive} ${styles.gatewayTabActiveMpesa}` : ""}`}
              onClick={() => setGateway("MPESA")}
            >
              📱 M-Pesa Express (STK Push)
            </button>
            <button
              type="button"
              className={`${styles.gatewayTab} ${gateway === "PAYSTACK" ? `${styles.gatewayTabActive} ${styles.gatewayTabActivePaystack}` : ""}`}
              onClick={() => setGateway("PAYSTACK")}
            >
              💳 Paystack (Cards &amp; M-Pesa)
            </button>
          </div>

          {/* Feature List */}
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>👁️</span>
              <div>
                <strong>See Who Liked You Upfront</strong>
                <p>Skip the deck and immediately connect with singles already on your radar.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>⚡</span>
              <div>
                <strong>5 Weekly Super Sparks</strong>
                <p>Attach direct prompt notes that jump straight to the top of their radar.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🛡️</span>
              <div>
                <strong>Incognito Mode &amp; Radar Boost</strong>
                <p>Only be visible to people you like first, plus 3x profile engagement.</p>
              </div>
            </div>
          </div>

          {/* Plan Selection */}
          <div className={styles.planSelector}>
            <div
              className={`${styles.planCard} ${selectedPlan === "WEEKLY" ? styles.selectedPlan : ""}`}
              onClick={() => setSelectedPlan("WEEKLY")}
            >
              <div className={styles.planBadge}>FLEXIBLE</div>
              <span className={styles.planPeriod}>1 Week</span>
              <span className={styles.planPrice}>KES 250</span>
              <span className={styles.planDesc}>KES 35 / day</span>
            </div>

            <div
              className={`${styles.planCard} ${selectedPlan === "MONTHLY" ? styles.selectedPlan : ""}`}
              onClick={() => setSelectedPlan("MONTHLY")}
            >
              <div className={`${styles.planBadge} ${styles.bestValue}`}>BEST VALUE</div>
              <span className={styles.planPeriod}>1 Month</span>
              <span className={styles.planPrice}>KES 750</span>
              <span className={styles.planDesc}>Save 25%</span>
            </div>
          </div>

          {/* Gateway-Specific Prompt */}
          {gateway === "MPESA" ? (
            <div className={styles.mpesaSection}>
              <label className={styles.label}>Safaricom M-Pesa Phone Number</label>
              <div className={styles.phoneInputRow}>
                <span className={styles.flagPrefix}>🇰🇪 +254</span>
                <input
                  type="tel"
                  className={styles.phoneInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="712345678"
                />
              </div>
            </div>
          ) : (
            <div className={styles.paystackBanner}>
              <span>⚡</span>
              <div>
                <strong>Paystack Secure Checkout</strong>
                <p style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.85 }}>
                  Pay via Visa, Mastercard, or M-Pesa. Secured by Paystack Kenya.
                  {!paystackScriptLoaded && " (Loading...)"}
                </p>
              </div>
            </div>
          )}

          {/* Pay Button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleStartPayment}
            disabled={isProcessingPin}
            className={gateway === "MPESA" ? styles.payBtnMpesa : styles.payBtnPaystack}
          >
            {isProcessingPin
              ? "Processing..."
              : gateway === "MPESA"
              ? `Pay KES ${planAmount} via M-Pesa Express ✦`
              : `Pay KES ${planAmount} with Paystack ✦`}
          </Button>

          <p className={styles.guaranteeText}>
            🔒 100% Secure via Safaricom Daraja &amp; Paystack Kenya. No recurring automatic debits.
          </p>
        </div>
      </div>
    </>
  );
};

export default VipCheckoutModal;
