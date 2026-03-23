"use client";
// src/components/LeadManager.js

import { useState } from "react";
import { useModal } from "@/components/Modal";

const STATUSES = ["NEW","CONTACTED","INTERESTED","NEGOTIATING","SOLD","DEAD"];
const STATUS_META = {
  NEW:         { label: "New",         bg: "#dbeafe", color: "#1d4ed8", dot: "#3B82F6" },
  CONTACTED:   { label: "Contacted",   bg: "#fef3c7", color: "#92400e", dot: "#F59E0B" },
  INTERESTED:  { label: "Interested",  bg: "#e0f2fe", color: "#075985", dot: "#0891b2" },
  NEGOTIATING: { label: "Negotiating", bg: "#fae8ff", color: "#7e22ce", dot: "#a855f7" },
  SOLD:        { label: "Sold",        bg: "#dcfce7", color: "#166534", dot: "#10B981" },
  DEAD:        { label: "Dead",        bg: "#f5f5f5", color: "#6b7280", dot: "#9CA3AF" },
};

const fmt    = (n)   => "KSh " + Number(n).toLocaleString("en-KE");
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"numeric" });

export default function LeadManager({ leads: initialLeads, countMap, currentStatus, currentSearch }) {
  const [leads,        setLeads]        = useState(initialLeads);
  const [expanded,     setExpanded]     = useState(null);
  const [noteInputs,   setNoteInputs]   = useState({});
  const [saving,       setSaving]       = useState({});
  const { success, alert } = useModal();

  async function updateStatus(leadId, status) {
    setSaving(prev => ({ ...prev, [leadId]: true }));
    const res = await fetch(`/api/portal/leads/${leadId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    }
    setSaving(prev => ({ ...prev, [leadId]: false }));
  }

  async function addNote(leadId) {
    const note = noteInputs[leadId]?.trim();
    if (!note) return;
    setSaving(prev => ({ ...prev, [`note_${leadId}`]: true }));
    const res = await fetch(`/api/portal/leads/${leadId}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) {
      setNoteInputs(prev => ({ ...prev, [leadId]: "" }));
      await success("Note saved");
    }
    setSaving(prev => ({ ...prev, [`note_${leadId}`]: false }));
  }

  const totalAll      = Object.values(countMap).reduce((s, v) => s + v, 0);
  const inputStyle    = { width: "100%", background: "#F7F8FA", border: "1.5px solid #E4E4E7", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontFamily: "inherit", outline: "none" };
  const s             = { background: "#fff", border: "1px solid #E4E4E7", borderRadius: 14 };

  return (
    <div>
      {/* Status tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", border: "1px solid #E4E4E7", borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
        {[{ key: "", label: "All", count: totalAll }, ...STATUSES.map(s => ({ key: s, label: STATUS_META[s].label, count: countMap[s] || 0 }))].map(({ key, label, count }) => (
          <a key={key} href={`/portal/leads?status=${key}&search=${currentSearch}`}
            style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              background: currentStatus === key ? "#1C1C1E" : "transparent",
              color:      currentStatus === key ? "white"   : "#6B7280",
            }}>
            {label}
            {count > 0 && (
              <span style={{ background: currentStatus === key ? "rgba(255,255,255,0.2)" : "#F5F5F5", color: currentStatus === key ? "white" : "#6B7280", borderRadius: 99, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                {count}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input name="search" defaultValue={currentSearch} placeholder="Search by name, phone, email…" style={{ ...inputStyle, maxWidth: 320 }} />
        <input type="hidden" name="status" value={currentStatus} />
        <button type="submit" style={{ background: "#1C1C1E", color: "white", border: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Search</button>
        {currentSearch && <a href={`/portal/leads?status=${currentStatus}`} style={{ color: "#F59E0B", fontSize: 13, padding: "9px 4px", textDecoration: "none" }}>Clear ×</a>}
      </form>

      {/* Leads list */}
      {leads.length === 0 ? (
        <div style={{ ...s, padding: 48, textAlign: "center", color: "#9CA3AF" }}>
          <p style={{ fontSize: 13 }}>No enquiries found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {leads.map(lead => {
            const sm      = STATUS_META[lead.status] || STATUS_META.NEW;
            const isOpen  = expanded === lead.id;
            const img     = lead.car?.images?.[0]?.url;
            return (
              <div key={lead.id} style={{ ...s, overflow: "hidden" }}>
                {/* Lead row */}
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                  onClick={() => setExpanded(isOpen ? null : lead.id)}>

                  {/* Car thumbnail */}
                  <div style={{ width: 56, height: 40, borderRadius: 8, background: "#F7F8FA", overflow: "hidden", flexShrink: 0 }}>
                    {img
                      ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 20 }}>🚗</div>
                    }
                  </div>

                  {/* Lead info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#1C1C1E" }}>{lead.name}</p>
                      <span style={{ fontSize: 10, borderRadius: 99, padding: "2px 9px", fontWeight: 700, background: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                      {lead.channel === "whatsapp" && (
                        <span style={{ fontSize: 10, background: "#dcfce7", color: "#166534", borderRadius: 99, padding: "2px 9px", fontWeight: 600 }}>WhatsApp</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                      {lead.car.year} {lead.car.make} {lead.car.model} · {fmt(lead.car.price)}
                    </p>
                  </div>

                  {/* Contact + date */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>{lead.phone}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{fmtDate(lead.createdAt)}</p>
                  </div>

                  {/* Expand arrow */}
                  <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 8, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▼</span>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #F7F8FA", padding: "18px 20px", background: "#FAFAFA" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                      {/* Contact details */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Contact details</p>
                        {[
                          { label: "Phone",   value: lead.phone },
                          { label: "Email",   value: lead.email || "—" },
                          { label: "Message", value: lead.message || "—" },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</p>
                            <p style={{ fontSize: 13, color: "#1C1C1E", fontWeight: 500 }}>{value}</p>
                          </div>
                        ))}
                        {/* Quick contact */}
                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                          <a href={`tel:${lead.phone}`} style={{ flex: 1, textAlign: "center", padding: "8px", border: "1.5px solid #E4E4E7", borderRadius: 8, color: "#1C1C1E", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>
                            📞 Call
                          </a>
                          {lead.phone && (
                            <a href={`https://wa.me/${lead.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                              style={{ flex: 1, textAlign: "center", padding: "8px", background: "#dcfce7", border: "1.5px solid #bbf7d0", borderRadius: 8, color: "#166534", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>
                              💬 WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Status + notes */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Update status</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                          {STATUSES.map(st => {
                            const m = STATUS_META[st];
                            return (
                              <button key={st} onClick={() => updateStatus(lead.id, st)} disabled={saving[lead.id]}
                                style={{ fontSize: 11, borderRadius: 99, padding: "5px 12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1.5px solid",
                                  background: lead.status === st ? m.bg   : "#fff",
                                  color:      lead.status === st ? m.color : "#6B7280",
                                  borderColor: lead.status === st ? m.dot  : "#E4E4E7",
                                }}>
                                {m.label}
                              </button>
                            );
                          })}
                        </div>

                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Add note</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={noteInputs[lead.id] || ""} onChange={e => setNoteInputs(prev => ({ ...prev, [lead.id]: e.target.value }))}
                            placeholder="e.g. Interested, offered KSh 3.8M…"
                            style={{ ...inputStyle, flex: 1 }}
                            onKeyDown={e => e.key === "Enter" && addNote(lead.id)}
                          />
                          <button onClick={() => addNote(lead.id)} disabled={saving[`note_${lead.id}`]}
                            style={{ background: "#F59E0B", color: "#1C1C1E", border: "none", borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                            {saving[`note_${lead.id}`] ? "…" : "Save"}
                          </button>
                        </div>

                        {lead.notes?.[0] && (
                          <div style={{ marginTop: 10, background: "#fff", border: "1px solid #E4E4E7", borderRadius: 8, padding: "8px 12px" }}>
                            <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>Latest note</p>
                            <p style={{ fontSize: 12, color: "#374151" }}>{lead.notes[0].note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}