"use client";
import { useState } from "react";
import { useModal } from "@/components/Modal";
import { 
  Search, 
  Phone, 
  Mail, 
  MessageCircle, 
  User, 
  Calendar, 
  ChevronDown, 
  Plus, 
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  Car as CarIcon
} from "lucide-react";

/**
 * Status Metadata for Premium Branding
 * Emerald (Success/Sold), Sky (Interested), Slate (Neutral/Dead)
 */
const STATUS_META = {
  NEW:         { label: "New",         bg: "bg-blue-50",     text: "text-black",     border: "border-blue-100",   icon: <Clock size={12} /> },
  CONTACTED:   { label: "Contacted",   bg: "bg-amber-50",    text: "text-black",    border: "border-amber-100",  icon: <MessageCircle size={12} /> },
  INTERESTED:  { label: "Interested",  bg: "bg-sky-50",      text: "text-black",      border: "border-sky-100",    icon: <User size={12} /> },
  NEGOTIATING: { label: "Negotiating", bg: "bg-purple-50",   text: "text-black",   border: "border-purple-100", icon: <MessageSquare size={12} /> },
  SOLD:        { label: "Closed/Sold", bg: "bg-emerald-50",  text: "text-black",  border: "border-emerald-100",icon: <CheckCircle2 size={12} /> },
  DEAD:        { label: "Closed/Dead", bg: "bg-slate-50",    text: "text-white",    border: "border-slate-100",  icon: <Ban size={12} /> },
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
    <div className="space-y-8">
      {/* Search & Tabs Combined */}
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between pb-8 border-b border-slate-50">
        <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl w-fit shadow-sm overflow-x-auto max-w-full">
          {[{ key: "", label: "All Leads", count: totalAll }, ...STATUSES.map(s => ({ key: s, label: STATUS_META[s].label, count: countMap[s] || 0 }))].map(({ key, label, count }) => (
            <Link key={key} href={`/portal/leads?status=${key}&search=${currentSearch}`}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${
                currentStatus === key 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                  : "text-white hover:text-black hover:bg-slate-50"
              }`}>
              {label}
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] ${
                  currentStatus === key ? "bg-white/20 text-white" : "bg-slate-50 text-white border border-slate-100"
                }`}>
                  {count}
                </span>
              )}
            </Link>
          ))}
        </div>

        <form method="GET" className="relative group w-full xl:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-[var(--brand)] transition-colors" size={18} />
          <input name="search" defaultValue={currentSearch} placeholder="Client name, phone, or email…" 
            className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-black placeholder:text-white outline-none focus:border-[var(--brand)] transition-all shadow-sm" />
          <input type="hidden" name="status" value={currentStatus} />
          {currentSearch && (
            <Link href={`/portal/leads?status=${currentStatus}`} className="absolute right-4 top-1/2 -translate-y-1/2 text-black font-black text-[10px] uppercase tracking-widest hover:text-black">
              Clear ×
            </Link>
          )}
        </form>
      </div>

      {/* Leads list */}
      {leads.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-32 text-center shadow-sm">
           <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
              <MessageSquare size={40} className="text-white" />
           </div>
           <p className="text-sm font-black text-white tracking-tight">No enquiries match your criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => {
            const sm = STATUS_META[lead.status] || STATUS_META.NEW;
            const isOpen = expanded === lead.id;
            const img = lead.car?.images?.[0]?.url;
            return (
              <div key={lead.id} className={`group bg-white border rounded-[2rem] transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl ${
                isOpen ? "border-[var(--brand-accent)]/30 ring-1 ring-[var(--brand-accent)]/5 shadow-2xl" : "border-slate-100"
              }`}>
                {/* Lead row */}
                <div onClick={() => setExpanded(isOpen ? null : lead.id)}
                  className="p-6 md:p-8 flex items-center gap-6 cursor-pointer select-none">

                  <div className="w-16 h-12 md:w-20 md:h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {img
                      ? <img src={img} alt="" className="w-full h-full object-cover" />
                      : <div className="flex items-center justify-center h-full text-white"><CarIcon size={24} /></div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h4 className="font-black text-black text-base tracking-tight">{lead.name}</h4>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${sm.bg} ${sm.text} ${sm.border}`}>
                        {sm.icon} {sm.label}
                      </div>
                      {lead.channel === "whatsapp" && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                           <MessageCircle size={10} className="fill-emerald-500" /> WhatsApp Direct
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-tight truncate">
                      Interest: <span className="text-black">{lead.car.year} {lead.car.make} {lead.car.model}</span> · {fmt(lead.car.price)}
                    </p>
                  </div>

                  <div className="hidden md:flex flex-col items-end text-right shrink-0">
                    <p className="text-xs font-black text-black tracking-tight">{lead.phone}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white mt-1">
                      <Calendar size={10} /> {fmtDate(lead.createdAt)}
                    </div>
                  </div>

                  <ChevronDown className={`text-white transition-transform duration-500 ${isOpen ? "rotate-180 text-[var(--brand)]" : ""}`} size={20} />
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="animate-in slide-in-from-top-4 duration-500 bg-slate-50/50 border-t border-slate-100 px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Left: Engagement Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-6">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                           <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Client Profile & Message</h5>
                        </div>
                        
                        <div className="space-y-6 mb-10">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-white shadow-sm"><Phone size={16} /></div>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-white">Primary Phone</p>
                                 <p className="text-sm font-black text-black">{lead.phone}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-white shadow-sm"><Mail size={16} /></div>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-white">Email Address</p>
                                 <p className="text-sm font-black text-black">{lead.email || "No email provided"}</p>
                              </div>
                           </div>
                           <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                              <p className="text-[10px] font-black uppercase text-white mb-2 flex items-center gap-2"><MessageSquare size={10} /> Original Message</p>
                              <p className="text-sm font-medium text-black leading-relaxed italic">"{lead.message || "Enquiry regarding listing visibility."}"</p>
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-black px-6 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                            <Phone size={14} /> Call Client
                          </a>
                          {lead.phone && (
                            <a href={`https://wa.me/${lead.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs font-black px-6 py-4 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10">
                              <MessageCircle size={14} className="fill-emerald-500 text-black" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Timeline */}
                      <div>
                        <div className="flex items-center gap-2 mb-6">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Status Update & Private Notes</h5>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
                          {STATUSES.map(st => {
                            const m = STATUS_META[st];
                            const isCurrent = lead.status === st;
                            return (
                              <button key={st} onClick={() => updateStatus(lead.id, st)} disabled={saving[lead.id]}
                                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                                  isCurrent 
                                    ? `${m.bg} ${m.text} ${m.border} ring-1 ring-white`
                                    : "bg-white text-white border-slate-100 hover:border-slate-300 hover:text-black shadow-none border-dashed"
                                }`}>
                                {isCurrent ? m.icon : null} {m.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="relative group">
                          <input value={noteInputs[lead.id] || ""} onChange={e => setNoteInputs(prev => ({ ...prev, [lead.id]: e.target.value }))}
                            placeholder="Add internal note... (e.g. Offered KSh 3.2M)"
                            className="w-full bg-white border border-slate-100 rounded-2xl pl-5 pr-32 py-5 text-sm font-medium text-black placeholder:text-white outline-none focus:border-[var(--brand)] transition-all shadow-sm"
                            onKeyDown={e => e.key === "Enter" && addNote(lead.id)}
                          />
                          <button onClick={() => addNote(lead.id)} disabled={saving[`note_${lead.id}`] || !noteInputs[lead.id]?.trim()}
                            className="absolute right-2 top-2 bottom-2 bg-[var(--brand)] disabled:bg-slate-100 text-white disabled:text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                            {saving[`note_${lead.id}`] ? "..." : "Save Note"}
                          </button>
                        </div>

                        {lead.notes?.length > 0 && (
                          <div className="mt-6 space-y-4 max-h-48 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-100">
                             {lead.notes.map((note, idx) => (
                               <div key={note.id || idx} className="bg-white/40 border border-slate-100/50 p-4 rounded-xl relative group/note">
                                  <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-white uppercase tracking-tighter">
                                     <span>Internal Intel</span>
                                     <span>{fmtDate(note.createdAt)}</span>
                                  </div>
                                  <p className="text-xs font-medium text-black leading-relaxed">{note.note}</p>
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