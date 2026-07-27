import { getSupportEmail } from "@/lib/site-contact";

export const metadata = {
  title: "Privacy Policy - BIDGARI",
  description: "How BIDGARI collects, uses, and protects your personal data.",
};

const dataCategories = [
  { label: "Account Data", items: ["Name", "Email", "Phone", "Password (hashed)"], color: "bg-blue-50 border-blue-200" },
  { label: "Profile Data", items: ["Avatar", "Business Name", "Location", "Verification Status"], color: "bg-emerald-50 border-emerald-200" },
  { label: "Inventory Data", items: ["Vehicle Details", "Photos", "Availability", "Pricing"], color: "bg-amber-50 border-amber-200" },
  { label: "Activity Data", items: ["Enquiries Made", "Lead Interactions", "Login History", "Device Info"], color: "bg-purple-50 border-purple-200" },
];

const thirdParties = [
  { name: "PostgreSQL Database", purpose: "Data storage and retrieval", data: "All encrypted data" },
  { name: "AWS / Cloud Provider", purpose: "Infrastructure and backups", data: "Encrypted backups, activity logs" },
  { name: "SendGrid", purpose: "Email delivery", data: "Email, name, transaction data" },
  { name: "M-Pesa API", purpose: "Payment processing", data: "Phone, amount, transaction ID" },
  { name: "Pesapal", purpose: "Card payments", data: "Card tokens (never raw cards)" },
  { name: "Cloudflare", purpose: "Security and CDN", data: "IP address, page requests (anonymized)" },
];

function getPrivacySections(support) {
  return [
  {
    title: "1. Who We Are",
    content: "BIDGARI (\"we\", \"us\", \"our\") is a trading name of BIDGARI Ltd, a Kenyan company. This Privacy Policy describes how we collect, use, protect, and share your personal data when you use our platform at welshmotorhub.co.ke (\"Platform\").",
  },
  {
    title: "2. What Data We Collect",
    subsections: [
      { heading: "2.1 Account Information", items: ["Name", "Email address", "Phone number", "Password (hashed, never stored plaintext)", "Date of birth (for age verification)"] },
      { heading: "2.2 Dealer Profile Data", items: ["Business name and registration number", "KRA PIN", "Physical address and county", "Logo or avatars", "Business description", "Verification documents"] },
      { heading: "2.3 Inventory & Listing Data", items: ["Vehicle specifications (make, model, year)", "Pricing, mileage, condition", "Photos and videos you upload", "Contact information in listings"] },
      { heading: "2.4 Interaction & Activity Data", items: ["Enquiries sent by buyers", "Lead interactions and responses", "Search queries", "Pages visited and time spent", "Device information (browser, OS, IP address)", "Cookies and tracking pixels"] },
      { heading: "2.5 Payment Data", items: ["M-Pesa phone number", "Transaction IDs and amounts", "Payment status and timestamps", "Invoice records"] },
    ],
  },
  {
    title: "3. How We Collect Data",
    subsections: [
      { heading: "3.1 Direct Collection", content: "Data you provide when creating accounts, updating profiles, uploading listings, sending enquiries, or subscribing to plans." },
      { heading: "3.2 Automatic Collection", content: "IP addresses, browser cookies, device identifiers, and page click tracking via server logs and analytics tools." },
      { heading: "3.3 Third-Party Sources", content: "M-Pesa verification for phone numbers, KRA records for dealer validation, and analytics partners for aggregated usage data." },
    ],
  },
  {
    title: "4. How We Use Your Data",
    subsections: [
      { heading: "4.1 Core Service Operations", items: ["Authenticating your account and managing login", "Connecting buyer enquiries to dealer listings", "Delivering lead notifications via email/SMS", "Processing payments if and when subscription or paid features are enabled"] },
      { heading: "4.2 Platform Improvement", items: ["Analyzing usage patterns to optimize UX", "Identifying bugs and performance issues", "A/B testing new features", "Aggregating anonymized data for market research"] },
      { heading: "4.3 Security & Compliance", items: ["Detecting fraudulent activity and abuse", "Protecting against unauthorized access", "Maintaining audit logs for disputes", "Complying with KRA tax and legal obligations"] },
      { heading: "4.4 Communication", items: ["Sending transactional emails (verification, reset codes, receipts)", "Notifying about account activity and security alerts", "Promotional emails (opt-out available)", "Support responses and account recovery"] },
    ],
  },
  {
    title: "5. Who We Share Data With",
    subsections: [
      { heading: "5.1 The Core Rule", content: "We never sell, rent, or trade your personal data to third parties for marketing purposes. Full stop." },
      { heading: "5.2 Service Providers (Data Processors)", content: "We share limited data with essential service providers who are contractually bound to protect it and use it only for specified purposes (see list below)." },
      { heading: "5.3 Legal Requirements", content: "We may disclose data if required by Kenyan law, court order, or government agency request. We will notify you unless legally prohibited." },
      { heading: "5.4 Business Transfers", content: "If BIDGARI Ltd is acquired or merged, your data may transfer to the successor company under the same privacy obligations." },
    ],
  },
  {
    title: "6. Buyer-to-Dealer Data Sharing",
    subsections: [
      { heading: "6.1 What Dealers See", content: "When you (as a buyer) send an enquiry, the dealer receives your name, phone number, email, and enquiry message. This is necessary to facilitate the transaction." },
      { heading: "6.2 Your Control", content: "You can opt out of receiving dealer contact via your account settings. Dealers will still see your enquiry but will not be able to call/message you directly." },
      { heading: "6.3 Dealer Responsibilities", content: `Dealers are responsible for using your contact info only to respond to your enquiry. BIDGARI is not liable for dealer misuse of your data. Report abuse to ${support}.` },
    ],
  },
  {
    title: "7. Cookies and Tracking",
    subsections: [
      { heading: "7.1 Session Cookies", content: "We use session cookies to keep you logged in and maintain security. These are deleted when you close your browser." },
      { heading: "7.2 Analytics Cookies", content: "Tools like Google Analytics track page views and user behavior to help us improve the platform. These data are anonymized and aggregated." },
      { heading: "7.3 Opt-Out", content: `Most browsers allow you to disable cookies via settings. Some platform features may not work without cookies (like login). You can also opt out of analytics tracking; contact ${support}.` },
    ],
  },
  {
    title: "8. Data Security",
    subsections: [
      { heading: "8.1 Encryption", content: "Data in transit is encrypted using HTTPS/TLS. Sensitive data at rest (passwords, payment info) is hashed or tokenized—we never store raw credit card or full M-Pesa data." },
      { heading: "8.2 Access Controls", content: "Only authorized employees with a business need can access personal data. Access is logged and monitored." },
      { heading: "8.3 Limitations", content: "While we implement industry-standard security, no system is 100% risk-free. BIDGARI is not liable for breaches caused by factors beyond our reasonable control (e.g., zero-day exploits, stolen credentials shared with third parties)." },
      { heading: "8.4 Incident Response", content: "If we discover a breach affecting your data, we will notify affected users within 30 days and describe the breach, data involved, and remediation steps." },
    ],
  },
  {
    title: "9. Data Retention",
    subsections: [
      { heading: "9.1 Active Accounts", content: "While your account is active, we retain account, profile, and activity data to provide services and maintain platform history." },
      { heading: "9.2 After Deletion", content: "If you delete your account, we retain core data (transactions, enquiries) for 90 days for dispute resolution, then archive or anonymize it. Backups may contain older copies for up to 12 months." },
      { heading: "9.3 Legal Holds", content: "If you are involved in a dispute or investigation, we retain all relevant data indefinitely until the matter is resolved." },
      { heading: "9.4 Aggregated Data", content: "We may retain anonymized, aggregated data (\"5,000 dealers listed 100K cars\") indefinitely for analytics and market research." },
    ],
  },
  {
    title: "10. Your Rights (GDPR-Inspired)",
    subsections: [
      { heading: "10.1 Access", content: `You can request a copy of all personal data we hold about you. Contact ${support} with "Data Subject Access Request." We will respond within 30 days.` },
      { heading: "10.2 Correction", content: "You can update your profile information directly in your account settings. Contact support if you need help correcting locked fields." },
      { heading: "10.3 Deletion", content: "You can request deletion of your account and associated data. Some data (transaction records) may be retained for legal/audit purposes but will be anonymized." },
      { heading: "10.4 Portability", content: "You can request your data in a portable format (CSV). We will provide it within 30 days." },
      { heading: "10.5 Opt-Out of Marketing", content: "Unsubscribe from promotional emails by clicking the link in any marketing email or updating your notification preferences." },
    ],
  },
  {
    title: "11. International Data Transfers",
    subsections: [
      { heading: "11.1 Kenya-Based Operations", content: "BIDGARI primarily operates from Kenya and stores data in Kenyan and regional African data centers. Some backup copies may be stored in secure international locations for redundancy." },
      { heading: "11.2 GDPR Compliance", content: "If you are in the EU, we comply with GDPR requirements including data processing agreements and legitimate interest assessments." },
    ],
  },
  {
    title: "12. Children's Privacy",
    subsections: [
      { heading: "12.1 Age Requirement", content: "The Platform is not intended for users under 18 years old. We do not knowingly collect data from minors." },
      { heading: "12.2 Parental Consent", content: "If a minor has created an account, we will delete it upon request from a parent or guardian." },
    ],
  },
  {
    title: "13. Third-Party Links and Services",
    subsections: [
      { heading: "13.1 External Links", content: "The Platform may link to external websites (Google Maps, news sites, etc.). We are not responsible for their privacy practices. Review their privacy policies separately." },
      { heading: "13.2 Embedded Content", content: "Embedded maps, videos, or widgets from third parties may collect data independently. Refer to their privacy policies." },
    ],
  },
  {
    title: "14. Policy Changes",
    subsections: [
      { heading: "14.1 Updates", content: "We may update this Privacy Policy at any time. Changes are effective when posted. Your continued use of the Platform constitutes acceptance of updated policy." },
      { heading: "14.2 Significant Changes", content: "If changes materially affect how we use your data, we will email you at least 30 days before the effective date and allow you to opt-out by deleting your account." },
    ],
  },
  {
    title: "15. Contact & Requests",
    subsections: [
      { heading: "15.1 Privacy Officer", content: `BIDGARI Ltd Privacy Officer: ${support}` },
      { heading: "15.2 Support", content: `General inquiries: ${support}` },
      { heading: "15.3 Legal Requests", content: `Formal data requests or legal matters: ${support}` },
      { heading: "15.4 Response Time", content: "We will respond to data requests within 30 days. Complex requests may require more time." },
    ],
  },
];
}

export default function PrivacyPage() {
  const support = getSupportEmail();
  const sections = getPrivacySections(support);
  return (
    <div className="bg-[#080808] min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-32 sm:py-40">
        
        {/* Header */}
        <div className="mb-24">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">
            <span>Legal</span>
            <span>/</span>
            <span className="text-white">Privacy Protocol</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight mb-8">
            Data <br />
            <span className="editorial-heading text-zinc-400">Governance.</span>
          </h1>
          <p className="text-lg text-zinc-400 font-medium max-w-2xl">
            Effective as of April 7, 2026. BIDGARI is a trading name of BIDGARI Ltd. This policy explains how we handle
            personal data for the platform.
          </p>
        </div>

        {/* Quick Summary Terminal */}
        <div className="bg-[#0f0f0f] border border-white/[0.06] p-8 sm:p-12 mb-24 rounded-xl">
          <h2 className="text-[10px] font-bold text-white uppercase tracking-widest mb-8">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {[
               "Encryption at rest and in transit.",
               "Zero third-party monetization.",
               "Authorized peer-to-peer data flow.",
               "User-governed data deletion.",
               "Verified dealer access control."
             ].map((line, i) => (
               <div key={i} className="flex gap-4 items-start">
                  <div className="w-2 h-2 bg-[var(--accent)] shrink-0 mt-1.5" style={{ borderRadius: '1px' }}></div>
                  <p className="text-sm font-bold text-white leading-relaxed">{line}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-32">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-12">Asset Classification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dataCategories.map((cat) => (
              <div key={cat.label} className="bg-[#0f0f0f] border border-white/[0.06] p-8 space-y-6 shadow-sm rounded-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{cat.label}</h3>
                <ul className="space-y-3">
                  {cat.items.map((item) => (
                    <li key={item} className="text-xs font-medium text-zinc-400 whitespace-nowrap">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Processor Registry */}
        <div className="mb-32">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-12">Authorized Sub-Processors</h2>
          <div className="border border-white/[0.06] overflow-x-auto rounded-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0f0f0f] border-b border-white/[0.06]">
                  <th className="py-5 px-8 text-[10px] font-bold text-white uppercase tracking-widest">Entity</th>
                  <th className="py-5 px-8 text-[10px] font-bold text-white uppercase tracking-widest">Protocol Purpose</th>
                  <th className="py-5 px-8 text-[10px] font-bold text-white uppercase tracking-widest">Data Variable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {thirdParties.map((party, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-6 px-8 text-sm font-bold text-white">{party.name}</td>
                    <td className="py-6 px-8 text-sm font-medium text-zinc-400">{party.purpose}</td>
                    <td className="py-6 px-8 text-sm font-medium text-zinc-400">{party.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl space-y-24 mb-32">
          {sections.map((section) => (
            <section key={section.title} className="scroll-mt-40">
              <h2 className="text-2xl font-bold text-white mb-8 lg:text-3xl">{section.title}</h2>
              
              {section.content && (
                <p className="text-lg text-zinc-400 leading-relaxed font-medium mb-8">{section.content}</p>
              )}
              
              {section.subsections && (
                <div className="space-y-12">
                  {section.subsections.map((subsection, idx) => (
                    <div key={idx} className="group">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 group-hover:text-[var(--accent)] transition-colors">{subsection.heading}</h3>
                      
                      {subsection.content && (
                        <p className="text-sm font-medium text-zinc-400 leading-relaxed">{subsection.content}</p>
                      )}
                      
                      {subsection.items && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 mt-4">
                          {subsection.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                               <div className="w-1 h-1 bg-white/[0.06] shrink-0" />
                               {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Support Grid */}
        <div className="pt-24 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-16">
          <div>
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4">Privacy Terminal</h3>
            <a href={`mailto:${support}`} className="inline-flex items-center justify-center h-11 px-5 bg-[#0f0f0f] border border-white/[0.06] text-sm font-bold text-zinc-400 hover:text-[var(--accent)]">
              {support}
            </a>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4">Legal Hub</h3>
            <a href={`mailto:${support}`} className="inline-flex items-center justify-center h-11 px-5 bg-[#0f0f0f] border border-white/[0.06] text-sm font-bold text-zinc-400 hover:text-[var(--accent)]">
              {support}
            </a>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4">Station HQ</h3>
            <p className="text-sm font-bold text-zinc-400">Nairobi Terminal, Kenya</p>
          </div>
        </div>
      </div>
    </div>
  );
}
