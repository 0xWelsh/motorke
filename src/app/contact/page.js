"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Clock, ArrowRight, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In production, send to your email service
      // For now, just simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clear form and show success
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setSubmitted(true);

      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen transition-colors duration-300">
      {/* Header */}
      <section className="bg-white dark:bg-[#0a0a0a] pt-32 sm:pt-40 pb-20 px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-8">
            <span>Home</span>
            <span>/</span>
            <span className="text-[#111827] dark:text-white">Contact</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-[#111827] dark:text-white tracking-tight leading-[1.1] mb-6">
            Get in <br />
            <span className="editorial-heading text-[#718096] dark:text-slate-400">Direct Touch.</span>
          </h1>
          <p className="text-[#718096] dark:text-slate-400 text-lg font-medium max-w-2xl leading-relaxed">
            Questions? Issues? Our network is built on transparency. Reach out via the channel that suits you best.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Contact Info */}
          <div className="lg:col-span-4 space-y-16">
            <div className="space-y-12">
              {/* Channel 1 */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-6">Digital Correspondence</h3>
                <div className="space-y-4">
                   <a href="mailto:sec@welsh.co.ke" className="text-2xl font-bold text-[#111827] dark:text-white hover:text-[#38A169] transition-colors">sec@welsh.co.ke</a>
                   <p className="text-sm font-medium text-[#718096] dark:text-slate-500">Verified Response Time: 24h</p>
                </div>
              </div>

              {/* Channel 2 */}
               <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-6">Operational Hours</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm font-medium border-b border-slate-50 dark:border-slate-900 pb-3">
                      <span className="text-[#718096] dark:text-slate-500">Mon – Fri</span>
                      <span className="text-[#111827] dark:text-white">09:00 – 18:00 EAT</span>
                   </div>
                   <div className="flex justify-between items-center text-sm font-medium border-b border-slate-50 dark:border-slate-900 pb-3">
                      <span className="text-[#718096] dark:text-slate-500">Sat – Sun</span>
                      <span className="text-[#111827] dark:text-white">10:00 – 16:00 EAT</span>
                   </div>
                </div>
              </div>

              {/* Channel 3 */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-6">HQ Terminal</h3>
                <p className="text-lg font-bold text-[#111827] dark:text-white">Nairobi Tech Hub, Kenya</p>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-6">Self-Service Terminal</h3>
               <div className="grid grid-cols-2 gap-4">
                  <Link href="/faq" className="bg-slate-50 dark:bg-slate-900 p-4 text-[10px] font-bold uppercase tracking-widest text-[#111827] dark:text-white border border-transparent hover:border-[#38A169]/30 transition-all text-center" style={{ borderRadius: 'var(--radius)' }}>Query FAQ</Link>
                  <Link href="/mission" className="bg-slate-50 dark:bg-slate-900 p-4 text-[10px] font-bold uppercase tracking-widest text-[#111827] dark:text-white border border-transparent hover:border-[#38A169]/30 transition-all text-center" style={{ borderRadius: 'var(--radius)' }}>Our Mission</Link>
               </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="bg-slate-50 dark:bg-[#111111] p-12 text-center border border-slate-100 dark:border-slate-800 shadow-2xl" style={{ borderRadius: 'var(--radius)' }}>
                <CheckCircle className="w-12 h-12 text-[#38A169] mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-[#111827] dark:text-white mb-4">Transmission Successful.</h3>
                <p className="text-[#718096] dark:text-slate-400 font-medium text-lg leading-relaxed">
                  We've received your data packet. A representative will contact you shortly via the verified channels.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-8 text-[10px] font-bold uppercase tracking-widest text-[#38A169] hover:underline">Send another enquiry</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#718096] dark:text-slate-500">Identity Name</label>
                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name" className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 px-5 py-5 text-sm font-bold text-[#111827] dark:text-white outline-none focus:bg-white dark:focus:bg-black focus:border-[#38A169]/50 transition-all" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#718096] dark:text-slate-500">Email Address</label>
                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 px-5 py-5 text-sm font-bold text-[#111827] dark:text-white outline-none focus:bg-white dark:focus:bg-black focus:border-[#38A169]/50 transition-all" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="md:col-span-2 space-y-3">
                   <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#718096] dark:text-slate-500">Query Class</label>
                   <div className="relative group">
                     <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 px-5 py-5 text-sm font-bold text-[#111827] dark:text-white outline-none appearance-none cursor-pointer focus:bg-white dark:focus:bg-black focus:border-[#38A169]/50 transition-all" style={{ borderRadius: 'var(--radius)' }}>
                        <option value="">Select a reason...</option>
                        <option value="bug">Terminal Bug</option>
                        <option value="partnership">Partnership</option>
                        <option value="dealer">Dealer Listing</option>
                        <option value="general">General Support</option>
                     </select>
                     <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                     </div>
                   </div>
                </div>
                <div className="md:col-span-2 space-y-3">
                   <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#718096] dark:text-slate-500">Transmission Content</label>
                   <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} placeholder="Detailed message..." className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 px-5 py-5 text-sm font-bold text-[#111827] dark:text-white outline-none focus:bg-white dark:focus:bg-black focus:border-[#38A169]/50 transition-all resize-none" style={{ borderRadius: 'var(--radius)' }}></textarea>
                </div>
                <div className="md:col-span-2">
                   <button type="submit" disabled={loading} className="group w-full bg-[#111827] dark:bg-white text-white dark:!text-black py-6 text-xs font-bold uppercase tracking-[0.25em] transition-all hover:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl" style={{ borderRadius: 'var(--radius)' }}>
                      {loading ? "Transmitting..." : "Send Data Packet"}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Advisory Section */}
      <section className="py-16 sm:py-24 px-6 bg-slate-50 dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#718096] dark:text-slate-500 mb-12 sm:mb-16 text-center">Operational Protocols</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
             {[
               { title: "Direct Contact", detail: "For specific vehicle queries, use the 'WhatsApp' link on the car detail page to reach the dealer directly." },
               { title: "Escalations", detail: "For listing disputes or fraud reports, include the Reference ID and email sec@welsh.co.ke immediately." },
               { title: "Business Inquiries", detail: "Seeking to join the network? Include your KRA compliance and physical yard location in the proposal." }
             ].map((item, i) => (
               <div key={i} className="text-center md:text-left group">
                  <h3 className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-widest mb-6 group-hover:text-[#38A169] transition-colors">{item.title}</h3>
                  <p className="text-sm font-medium text-[#718096] dark:text-slate-500 leading-relaxed">{item.detail}</p>
               </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}
