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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-slate-300 text-lg">
            Questions? Issues? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="md:col-span-1">
            <div className="space-y-8">
              {/* Email */}
              <div className="flex gap-4">
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Email</h3>
                  <a
                    href="mailto:sec@welsh.co.ke"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    sec@welsh.co.ke
                  </a>
                  <p className="text-sm text-slate-600 mt-2">
                    Response time: 24-48 hours
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex gap-4">
                <Clock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Support Hours</h3>
                  <p className="text-slate-700 text-sm">
                    Monday – Friday: 9 AM – 6 PM EAT
                  </p>
                  <p className="text-slate-700 text-sm">
                    Saturday – Sunday: 10 AM – 4 PM EAT
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Based In</h3>
                  <p className="text-slate-700 text-sm">Nairobi, Kenya</p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <a href="/faq" className="block text-blue-600 hover:underline">
                    → FAQ
                  </a>
                  <a href="/privacy" className="block text-blue-600 hover:underline">
                    → Privacy Policy
                  </a>
                  <a href="/terms" className="block text-blue-600 hover:underline">
                    → Terms & Conditions
                  </a>
                  <a href="/mission" className="block text-blue-600 hover:underline">
                    → Our Mission
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Message Received! ✓
                </h3>
                <p className="text-green-700">
                  Thanks for reaching out. We'll get back to you within 24-48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a reason...</option>
                    <option value="bug">Report a Bug</option>
                    <option value="fraud">Report Fraud</option>
                    <option value="dealer-issue">Dealer Issue</option>
                    <option value="feature-request">Feature Request</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="general">General Question</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us what's on your mind..."
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Before You Contact Us</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-slate-900 mb-3">For Buyer Questions</h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>✓ Check our <a href="/faq" className="text-blue-600 hover:underline">FAQ page</a></li>
                <li>✓ Contact the dealer directly (number on listing)</li>
                <li>✓ Review other buyer feedback on dealer profile</li>
                <li>✓ Then email us if still unresolved</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-3">For Dealer Support</h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>✓ Check dashboard tutorials</li>
                <li>✓ Review settings and options first</li>
                <li>✓ Try logging out/in (clears cache)</li>
                <li>✓ Then contact us with screenshots</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-3">For Security/Fraud Reports</h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>✓ Include dealer profile link</li>
                <li>✓ Describe the issue with detail</li>
                <li>✓ Attach screenshots/evidence if possible</li>
                <li>✓ Send to: <a href="mailto:sec@welsh.co.ke" className="text-blue-600 hover:underline">sec@welsh.co.ke</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-3">For Partnerships/Press</h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>✓ Email subject: "Partnership Inquiry"</li>
                <li>✓ Include your proposal/media outlet</li>
                <li>✓ Links to your work (if relevant)</li>
                <li>✓ We typically respond within 3 days</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
