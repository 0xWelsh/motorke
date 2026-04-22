"use client";

import { useState } from "react";
import { Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";

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
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-white pt-32 sm:pt-40 pb-20 px-6 border-b border-[#EDF2F7]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-8">
            <span>Home</span>
            <span>/</span>
            <span className="text-[#1A202C]">Contact</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-[#1A202C] tracking-tight leading-[1.1] mb-6">
            Get in <br />
            <span className="editorial-heading text-[#718096]">Direct Touch.</span>
          </h1>
          <p className="text-[#718096] text-lg font-medium max-w-2xl">
            Questions? Issues? Our network is built on transparency. Reach out via the channel that suits you best.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Contact Info */}
          <div className="lg:col-span-4 space-y-16">
            <div className="space-y-12">
              {/* Channel 1 */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-6">Digital Correspondence</h3>
                <div className="space-y-2">
                   <a href="mailto:sec@welsh.co.ke" className="text-2xl font-bold text-[#1A202C] hover:text-[#38A169] transition-colors">sec@welsh.co.ke</a>
                   <p className="text-sm font-medium text-[#718096]">Verified Response Time: 24h</p>
                </div>
              </div>

              {/* Channel 2 */}
               <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-6">Operational Hours</h3>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-[#718096]">Mon – Fri</span>
                      <span className="text-[#1A202C]">09:00 – 18:00 EAT</span>
                   </div>
                   <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-[#718096]">Sat – Sun</span>
                      <span className="text-[#1A202C]">10:00 – 16:00 EAT</span>
                   </div>
                </div>
              </div>

              {/* Channel 3 */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-6">HQ Terminal</h3>
                <p className="text-lg font-bold text-[#1A202C]">Nairobi Tech Hub, Kenya</p>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="pt-12 border-t border-[#EDF2F7]">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-6">Self-Service Terminal</h3>
               <div className="grid grid-cols-2 gap-4">
                  <Link href="/faq" className="bg-[#F7FAFC] p-4 text-[10px] font-bold uppercase tracking-widest text-[#1A202C] hover:bg-[#EDF2F7]" style={{ borderRadius: 'var(--radius)' }}>Query FAQ</Link>
                  <Link href="/mission" className="bg-[#F7FAFC] p-4 text-[10px] font-bold uppercase tracking-widest text-[#1A202C] hover:bg-[#EDF2F7]" style={{ borderRadius: 'var(--radius)' }}>Our Mission</Link>
               </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="bg-[#F7FAFC] p-12 text-center" style={{ borderRadius: 'var(--radius)' }}>
                <CheckCircle className="w-12 h-12 text-[#38A169] mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-[#1A202C] mb-4">Transmission Successful.</h3>
                <p className="text-[#718096] font-medium text-lg">
                  We've received your data packet. A representative will contact you shortly.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-8 text-[10px] font-bold uppercase tracking-widest text-[#38A169] hover:underline">Send another enquiry</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Identity Name</label>
                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name" className="w-full bg-[#F7FAFC] border border-transparent px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-[#E2E8F0] transition-all" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Email Address</label>
                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full bg-[#F7FAFC] border border-transparent px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-[#E2E8F0] transition-all" style={{ borderRadius: 'var(--radius)' }} />
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Query Class</label>
                   <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full bg-[#F7FAFC] border border-transparent px-5 py-4 text-sm font-medium outline-none appearance-none cursor-pointer focus:bg-white focus:border-[#E2E8F0] transition-all" style={{ borderRadius: 'var(--radius)' }}>
                      <option value="">Select a reason...</option>
                      <option value="bug">Terminal Bug</option>
                      <option value="partnership">Partnership</option>
                      <option value="dealer">Dealer Listing</option>
                      <option value="general">General Support</option>
                   </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Transmission Content</label>
                   <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} placeholder="Detailed message..." className="w-full bg-[#F7FAFC] border border-transparent px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-[#E2E8F0] transition-all resize-none" style={{ borderRadius: 'var(--radius)' }}></textarea>
                </div>
                <div className="md:col-span-2">
                   <button type="submit" disabled={loading} className="group w-full bg-[#1A202C] text-white py-5 text-xs font-bold uppercase tracking-[0.2em] transition-transform hover:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3" style={{ borderRadius: 'var(--radius)' }}>
                      {loading ? "Transmitting..." : "Send Data Packet"}
                      <Send className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Advisory Section */}
      <section className="py-24 px-6 bg-[#F7FAFC]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-12 text-center">Operational Protocols</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             {[
               { title: "Direct Contact", detail: "For specific vehicle queries, use the 'WhatsApp' link on the car detail page to reach the dealer directly." },
               { title: "Escalations", detail: "For listing disputes or fraud reports, include the Reference ID and email sec@welsh.co.ke immediately." },
               { title: "Business Inquiries", detail: "Seeking to join the network? Include your KRA compliance and physical yard location in the proposal." }
             ].map((item, i) => (
               <div key={i} className="text-center md:text-left">
                  <h3 className="text-sm font-bold text-[#1A202C] uppercase tracking-widest mb-4">{item.title}</h3>
                  <p className="text-sm font-medium text-[#718096] leading-relaxed">{item.detail}</p>
               </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}
