"use client";
import { useState } from "react";
import Link from "next/link";
import { useModal } from "@/components/Modal";
import { 
  Search, 
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar, 
  ChevronDown, 
  ExternalLink,
  MessageSquare,
  Car as CarIcon
} from "lucide-react";

/**
 * Status Metadata
 */
const STATUS_META = {
  NEW:         { label: "New",         bg: "bg-slate-100",   text: "text-slate-700",   border: "border-[#ddd4c8] dark:border-slate-800" },
  CONTACTED:   { label: "Contacted",   bg: "bg-slate-100",   text: "text-slate-700",   border: "border-[#ddd4c8] dark:border-slate-800" },
  INTERESTED:  { label: "Interested",  bg: "bg-slate-100",   text: "text-slate-700",   border: "border-[#ddd4c8] dark:border-slate-800" },
  NEGOTIATING: { label: "Negotiating", bg: "bg-slate-100",   text: "text-slate-700",   border: "border-[#ddd4c8] dark:border-slate-800" },
  SOLD:        { label: "Deal Won",  bg: "bg-emerald-50 dark:bg-emerald-500/10",   text: "text-emerald-700 dark:text-emerald-400",   border: "border-emerald-200 dark:border-emerald-500/20" },
  DEAD:        { label: "Deal Lost", bg: "bg-rose-50 dark:bg-rose-500/10",      text: "text-rose-700 dark:text-rose-400",      border: "border-rose-200 dark:border-rose-500/20" },
};

const STATUSES = Object.keys(STATUS_META);

const fmt    = (n)   => "KSh " + Number(n).toLocaleString("en-KE");
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"numeric" });

export default function LeadManager({ leads: initialLeads, countMap, currentStatus, currentSearch }) {
  const [leads,        setLeads]        = useState(initialLeads);
  const [expanded,     setExpanded]     = useState(null);
  const [noteInputs,   setNoteInputs]   = useState({});
  const [saving,       setSaving]       = useState({});
  const { success } = useModal();

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
      const newNote = { id: Date.now(), note, createdAt: new Date().toISOString() };
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: [newNote, ...(l.notes || [])] } : l));
      setNoteInputs(prev => ({ ...prev, [leadId]: "" }));
      await success("Note saved successfully");
    }
    setSaving(prev => ({ ...prev, [`note_${leadId}`]: false }));
  }

  const totalAll = Object.values(countMap).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Search & Tabs Combined */}
      <div className="flex flex-col gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-[#ddd4c8] dark:border-slate-800">
        <div className="flex bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 p-1 rounded-2xl w-full overflow-x-auto shadow-sm">
          {[{ key: "", label: "All", count: totalAll }, ...STATUSES.map(s => ({ key: s, label: STATUS_META[s].label, count: countMap[s] || 0 }))].map(({ key, label, count }) => (
            <Link key={key} href={`/portal/leads?status=${key}&search=${currentSearch}`}
              className={`px-2 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                currentStatus === key 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-white hover:text-white hover:bg-[#fbfcfe] dark:bg-[#111111]"
              }`}>
              {label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-medium ${
                  currentStatus === key ? "bg-white/20 text-slate-900 dark:text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {count}
                </span>
              )}
            </Link>
          ))}
        </div>

        <form method="GET" className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={16} />
          <input name="search" defaultValue={currentSearch} placeholder="Name, phone, email…" 
            className="w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-500 outline-none focus:border-slate-900 transition-all shadow-sm" />
          <input type="hidden" name="status" value={currentStatus} />
          {currentSearch && (
            <Link href={`/portal/leads?status=${currentStatus}`} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-white text-xs font-semibold">
              Clear ×
            </Link>
          )}
        </form>
      </div>

      {/* Leads list */}
      {leads.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8 sm:p-12 md:p-20 text-center shadow-sm">
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageSquare size={32} className="text-slate-400" />
           </div>
           <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">No enquiries match your criteria</p>
           <p className="text-sm text-slate-600 mb-6 max-w-xs mx-auto">Enquiries will appear here when customers express interest in your vehicles.</p>
           <Link href="/portal/inventory" className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl transition-colors">
              View Inventory →
           </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => {
            const sm = STATUS_META[lead.status] || STATUS_META.NEW;
            const isOpen = expanded === lead.id;
            const img = lead.car?.images?.[0]?.url;
            return (
              <div key={lead.id} className={`group bg-white dark:bg-[#111111] border transition-all overflow-hidden rounded-2xl shadow-sm hover:shadow-md ${
                isOpen ? "border-slate-300 shadow-md" : "border-[#ddd4c8] dark:border-slate-800 hover:border-slate-300"
              }`}>
                {/* Lead row */}
                <div onClick={() => setExpanded(isOpen ? null : lead.id)}
                  className="p-4 sm:p-6 flex items-center gap-3 sm:gap-6 cursor-pointer select-none">

                  <div className="w-14 h-10 sm:w-20 sm:h-14 rounded-2xl bg-slate-100 border border-[#ddd4c8] dark:border-slate-800 overflow-hidden shrink-0">
                    {img
                      ? <img src={img} alt="" className="w-full h-full object-cover" />
                      : <div className="flex items-center justify-center h-full text-slate-400"><CarIcon size={20} /></div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">{lead.name}</h4>
                      <div className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded text-xs font-semibold ${sm.bg} ${sm.text} ${sm.border} border flex-shrink-0`}>
                        {sm.label}
                      </div>
                      {lead.channel === "whatsapp" && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 sm:px-2.5 py-0.5 rounded border border-[#ddd4c8] dark:border-slate-800 flex-shrink-0">
                           <MessageCircle size={10} /> WhatsApp
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      <span className="text-slate-900 dark:text-white font-playfair font-semibold">{lead.car.year} {lead.car.make} {lead.car.model}</span> · {fmt(lead.createdAt)}
                    </p>
                    <p className="md:hidden text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span>{lead.phone}</span> · <span>{fmtDate(lead.createdAt)}</span>
                    </p>
                  </div>

                  <div className="hidden md:flex flex-col items-end text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.phone}</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                      <Calendar size={12} /> {fmtDate(lead.createdAt)}
                    </div>
                  </div>

                  <ChevronDown className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180 text-slate-900 dark:text-white" : ""}`} size={18} />
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="bg-[#fbfcfe] dark:bg-[#111111] border-t border-[#ddd4c8] dark:border-slate-800 px-4 sm:px-6 py-6 sm:py-8\">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                      {/* Left: Engagement Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                           <h5 className="text-xs font-bold uppercase tracking-wide text-slate-600">Client Profile</h5>
                        </div>
                        
                        <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
                           <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0"><Phone size={16} /></div>
                              <div className="min-w-0">
                                 <p className="text-xs font-bold text-slate-500 uppercase\">Phone</p>
                                 <p className="text-sm font-bold text-slate-900 dark:text-white truncate\">{lead.phone}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0"><Mail size={16} /></div>
                              <div className="min-w-0">
                                 <p className="text-xs font-bold text-slate-500 uppercase\">Email</p>
                                 <p className="text-sm font-bold text-slate-900 dark:text-white truncate\">{lead.email || "Not provided"}</p>
                              </div>
                           </div>
                           <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 p-3 sm:p-5 rounded-2xl\">
                              <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2\"><MessageSquare size={10} /> Message</p>
                              <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed\">"{lead.message || "Enquiry regarding listing."}"</p>
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <a href={`tel:${lead.phone}`} className="flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-sm\">
                            <Phone size={14} /> Call
                          </a>
                          {lead.phone && (
                            <a href={`https://wa.me/${lead.phone.replace(/\\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-sm\">
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Timeline */}
                      <div>
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                           <h5 className="text-xs font-bold uppercase tracking-wide text-slate-600\">Status & Notes</h5>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6 sm:mb-8\">
                          {STATUSES.map(st => {
                            const m = STATUS_META[st];
                            const isCurrent = lead.status === st;
                            return (
                              <button key={st} onClick={() => updateStatus(lead.id, st)} disabled={saving[lead.id]}
                                className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-2xl border text-xs font-semibold transition-all shadow-sm ${
                                  isCurrent 
                                    ? `${m.bg} ${m.text} ${m.border}`
                                    : "bg-white text-slate-600 border-[#ddd4c8] dark:border-slate-800 hover:border-slate-300 hover:bg-[#fbfcfe] dark:bg-[#111111]"
                                }`}>
                                {m.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="relative flex items-center mb-6\">
                          <input value={noteInputs[lead.id] || ""} onChange={e => setNoteInputs(prev => ({ ...prev, [lead.id]: e.target.value }))}
                            placeholder="Add note…"
                            className="w-full bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl pl-4 pr-16 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-500 outline-none focus:border-slate-900 transition-all shadow-sm\"
                            onKeyDown={e => e.key === "Enter" && addNote(lead.id)}
                          />
                          <button onClick={() => addNote(lead.id)} disabled={saving[`note_${lead.id}`] || !noteInputs[lead.id]?.trim()}
                            className="absolute right-2 px-2 sm:px-3 py-1.5 bg-slate-900 disabled:bg-slate-200 text-white disabled:text-white rounded-2xl text-xs font-semibold transition-all shadow-sm\">
                            {saving[`note_${lead.id}`] ? "…" : "Save"}
                          </button>
                        </div>

                        {lead.notes?.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                             {lead.notes.map((note, idx) => (
                               <div key={note.id || idx} className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 p-3 rounded-2xl">
                                  <div className="flex items-center justify-between mb-1 text-xs font-bold text-slate-500 uppercase gap-2">
                                     <span>Note</span>
                                     <span className="flex-shrink-0">{fmtDate(note.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed">{note.note}</p>
                               </div>
                             ))}
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