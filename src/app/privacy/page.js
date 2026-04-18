export const metadata = {
  title: "Privacy Policy - Motorke",
  description: "How Motorke collects, uses, and protects your personal data.",
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

const sections = [
  {
    title: "1. Who We Are",
    content: "Motorke (\"we\", \"us\", \"our\") is operated by Motorske Ltd, a Kenyan automotive marketplace. This Privacy Policy describes how we collect, use, protect, and share your personal data when you use our platform at motorke.com (\"Platform\").",
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
      { heading: "4.1 Core Service Operations", items: ["Authenticating your account and managing login", "Connecting buyer enquiries to dealer listings", "Delivering lead notifications via email/SMS", "Processing payments for subscriptions"] },
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
      { heading: "5.4 Business Transfers", content: "If Motorke is acquired or merged, your data may transfer to the successor company under the same privacy obligations." },
    ],
  },
  {
    title: "6. Buyer-to-Dealer Data Sharing",
    subsections: [
      { heading: "6.1 What Dealers See", content: "When you (as a buyer) send an enquiry, the dealer receives your name, phone number, email, and enquiry message. This is necessary to facilitate the transaction." },
      { heading: "6.2 Your Control", content: "You can opt out of receiving dealer contact via your account settings. Dealers will still see your enquiry but will not be able to call/message you directly." },
      { heading: "6.3 Dealer Responsibilities", content: "Dealers are responsible for using your contact info only to respond to your enquiry. Motorke is not liable for dealer misuse of your data. Report abuse to support@motorke.com." },
    ],
  },
  {
    title: "7. Cookies and Tracking",
    subsections: [
      { heading: "7.1 Session Cookies", content: "We use session cookies to keep you logged in and maintain security. These are deleted when you close your browser." },
      { heading: "7.2 Analytics Cookies", content: "Tools like Google Analytics track page views and user behavior to help us improve the platform. These data are anonymized and aggregated." },
      { heading: "7.3 Opt-Out", content: "Most browsers allow you to disable cookies via settings. Some platform features may not work without cookies (like login). You can also opt out of analytics tracking—contact support@motorke.com." },
    ],
  },
  {
    title: "8. Data Security",
    subsections: [
      { heading: "8.1 Encryption", content: "Data in transit is encrypted using HTTPS/TLS. Sensitive data at rest (passwords, payment info) is hashed or tokenized—we never store raw credit card or full M-Pesa data." },
      { heading: "8.2 Access Controls", content: "Only authorized employees with a business need can access personal data. Access is logged and monitored." },
      { heading: "8.3 Limitations", content: "While we implement industry-standard security, no system is 100% risk-free. Motorke is not liable for breaches caused by factors beyond our reasonable control (e.g., zero-day exploits, stolen credentials shared with third parties)." },
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
      { heading: "10.1 Access", content: "You can request a copy of all personal data we hold about you. Contact support@motorke.com with \"Data Subject Access Request.\" We will respond within 30 days." },
      { heading: "10.2 Correction", content: "You can update your profile information directly in your account settings. Contact support if you need help correcting locked fields." },
      { heading: "10.3 Deletion", content: "You can request deletion of your account and associated data. Some data (transaction records) may be retained for legal/audit purposes but will be anonymized." },
      { heading: "10.4 Portability", content: "You can request your data in a portable format (CSV). We will provide it within 30 days." },
      { heading: "10.5 Opt-Out of Marketing", content: "Unsubscribe from promotional emails by clicking the link in any marketing email or updating your notification preferences." },
    ],
  },
  {
    title: "11. International Data Transfers",
    subsections: [
      { heading: "11.1 Kenya-Based Operations", content: "Motorke primarily operates from Kenya and stores data in Kenyan and regional African data centers. Some backup copies may be stored in secure international locations for redundancy." },
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
      { heading: "15.1 Privacy Officer", content: "Motorske Ltd Privacy Officer: privacy@motorke.com" },
      { heading: "15.2 Support", content: "General inquiries: support@motorke.com" },
      { heading: "15.3 Legal Requests", content: "Formal data requests or legal matters: legal@motorke.com" },
      { heading: "15.4 Response Time", content: "We will respond to data requests within 30 days. Complex requests may require more time." },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">We Take Privacy Seriously</p>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-600">Last updated April 7, 2026 — Plain language about how your data is used, protected, and shared</p>
        </div>

        {/* Quick Summary */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-12">
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">The Short Version</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ We collect only what's needed to run the platform</li>
            <li>✓ We never sell or rent your data to marketers or brokers</li>
            <li>✓ Your contact info is shared with dealers only when YOU make an enquiry</li>
            <li>✓ Data is encrypted in transit and at rest</li>
            <li>✓ You can access, correct, or delete your data anytime</li>
          </ul>
        </div>

        {/* Data Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">What We Collect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataCategories.map((cat) => (
              <div key={cat.label} className={`border ${cat.color} rounded-lg p-5 space-y-3`}>
                <h3 className="font-bold text-slate-900 dark:text-white">{cat.label}</h3>
                <ul className="space-y-1 text-sm text-slate-700">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Services */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Who We Share Data With</h2>
          <p className="text-slate-600 mb-4">These providers are contractually bound to protect your data and use it only for the stated purpose—not for their own marketing.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-bold text-slate-900 dark:text-white">Service</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-900 dark:text-white">Purpose</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-900 dark:text-white">Data Shared</th>
                </tr>
              </thead>
              <tbody>
                {thirdParties.map((party, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">{party.name}</td>
                    <td className="py-3 px-4 text-slate-600">{party.purpose}</td>
                    <td className="py-3 px-4 text-slate-600">{party.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-10 mb-16">
          {sections.map((section) => (
            <section key={section.title} id={section.title.replace(/\s+/g, '-').toLowerCase()} className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">{section.title}</h2>
              
              {section.content && (
                <p className="text-slate-700 text-sm leading-relaxed mb-4">{section.content}</p>
              )}
              
              {section.subsections && (
                <div className="space-y-4">
                  {section.subsections.map((subsection, idx) => (
                    <div key={idx} className="border-l-4 border-slate-200 dark:border-slate-800 pl-5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">{subsection.heading}</h3>
                      
                      {subsection.content && (
                        <p className="text-slate-700 text-sm leading-relaxed">{subsection.content}</p>
                      )}
                      
                      {subsection.items && (
                        <ul className="text-slate-700 text-sm space-y-1.5 mt-2 list-disc list-inside">
                          {subsection.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center">
            <p className="text-emerald-900 font-bold text-lg mb-1">🔒</p>
            <p className="text-sm font-semibold text-emerald-900">Data Encrypted</p>
            <p className="text-xs text-emerald-800 mt-1">All data in transit and at rest</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
            <p className="text-blue-900 font-bold text-lg mb-1">🚫</p>
            <p className="text-sm font-semibold text-blue-900">Never Sold</p>
            <p className="text-xs text-blue-800 mt-1">Your data is never sold to third parties</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 text-center">
            <p className="text-purple-900 font-bold text-lg mb-1">👤</p>
            <p className="text-sm font-semibold text-purple-900">You Control It</p>
            <p className="text-xs text-purple-800 mt-1">Access, update, or delete anytime</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Questions?</h3>
              <p className="text-xs text-slate-600">privacy@motorke.com</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">General Support</h3>
              <p className="text-xs text-slate-600">support@motorke.com</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Legal Requests</h3>
              <p className="text-xs text-slate-600">legal@motorke.com</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Motorske Ltd, Nairobi, Kenya. This policy is our commitment to your privacy. We believe technology should be trustworthy.
          </p>
        </div>
      </div>
    </div>
  );
}
