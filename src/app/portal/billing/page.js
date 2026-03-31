// src/app/portal/billing/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Billing — Motorke Portal" };

const FREE_FEATURES = [
  "Up to 5 car listings",
  "Basic lead notifications",
  "Public dealership profile",
  "WhatsApp enquiries disabled",
  "No verified badge",
];

const PRO_FEATURES = [
  "Unlimited car listings",
  "Verified dealer badge",
  "WhatsApp button on all listings",
  "Featured on homepage",
  "Priority in search results",
  "Full analytics dashboard",
  "Lead management with notes",
  "Inventory tracking",
  "Priority customer support",
];

export default async function BillingPage() {
  const user         = await requireDealer();
  const dealer       = await db.dealer.findUnique({ where: { id: user.dealerId } });
  const subscription = await db.subscription.findUnique({
    where:   { dealerId: user.dealerId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  const plan    = subscription?.plan   || "FREE";
  const status  = subscription?.status || "ACTIVE";
  const isPro   = plan === "PRO";
  const endDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const s = { background: "#fff", border: "1px solid #E4E4E7", borderRadius: 14 };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900 }}>
      <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#1C1C1E", marginBottom: 8 }}>Billing & subscription</h1>
      <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>{dealer?.name}</p>

      {/* Current plan */}
      <div style={{ ...s, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Current plan</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "#1C1C1E" }}>{isPro ? "Pro" : "Free"}</span>
              <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px", background: isPro ? "#FEF3C7" : "#F5F5F5", color: isPro ? "#92400e" : "#6B7280", border: isPro ? "1px solid #F59E0B" : "1px solid #E4E4E7" }}>
                {status}
              </span>
            </div>
            {isPro && endDate && <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>Renews {endDate}</p>}
          </div>
          {isPro ? (
            <button style={{ fontSize: 13, border: "1px solid #E4E4E7", borderRadius: 9, padding: "8px 16px", color: "#9CA3AF", background: "white", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel subscription
            </button>
          ) : (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E" }}>KSh 9,300<span style={{ fontSize: 14, fontWeight: 500, color: "#9CA3AF" }}>/month</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Plans comparison */}
      {!isPro && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Free */}
          <div style={{ ...s, padding: "24px" }}>
            <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1C1C1E", marginBottom: 4 }}>Free</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#6B7280", marginBottom: 20 }}>KSh 0<span style={{ fontSize: 13, fontWeight: 500 }}>/mo</span></p>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#D1D1D6", fontSize: 14, marginTop: 1 }}>✕</span>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>{f}</p>
              </div>
            ))}
          </div>

          {/* Pro */}
          <div style={{ background: "#1C1C1E", borderRadius: 14, padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 16, right: 16, background: "#F59E0B", color: "#1C1C1E", fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Recommended
            </div>
            <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: 4 }}>Pro</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", marginBottom: 20 }}>KSh 9,300<span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>/mo</span></p>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#F59E0B", fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{f}</p>
              </div>
            ))}
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <button style={{ width: "100%", background: "#F59E0B", color: "#1C1C1E", border: "none", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                Pay with M-Pesa
              </button>
              <button style={{ width: "100%", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                Pay with Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment history */}
      {subscription?.payments?.length > 0 && (
        <div style={s}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F7F8FA" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#1C1C1E" }}>Payment history</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F7F8FA" }}>
                {["Date", "Amount", "Method", "Reference", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscription.payments.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < subscription.payments.length - 1 ? "1px solid #F7F8FA" : "none" }}>
                  <td style={{ padding: "12px 16px", color: "#6B7280" }}>
                    {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1C1C1E" }}>KSh {p.amount.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280" }}>{p.method}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontFamily: "monospace", fontSize: 12 }}>{p.reference || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, borderRadius: 99, padding: "3px 10px", fontWeight: 600, background: p.status === "COMPLETED" ? "#dcfce7" : "#fef2f2", color: p.status === "COMPLETED" ? "#166534" : "#991b1b" }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contact for payment */}
      <div style={{ background: "#F7F8FA", border: "1px solid #E4E4E7", borderRadius: 12, padding: "16px 20px", marginTop: 20 }}>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          Need help with your subscription? Contact us at{" "}
          <a href="mailto:billing@motorke.co.ke" style={{ color: "#F59E0B", fontWeight: 600, textDecoration: "none" }}>billing@motorke.co.ke</a>
          {" "}or WhatsApp{" "}
          <a href="https://wa.me/254700000000" style={{ color: "#F59E0B", fontWeight: 600, textDecoration: "none" }}>+254 700 000 000</a>
        </p>
      </div>
    </div>
  );
}
