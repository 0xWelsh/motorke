export const metadata = {
  title: "Terms of Service - Motorke",
  description: "Read the Motorke terms for using our marketplace and dealer tools.",
};

const sections = [
  {
    title: "1. Platform Use",
    content:
      "Motorke provides a digital automotive marketplace for buyers, dealers, and administrators. You agree to use the platform lawfully and provide accurate account and listing information.",
  },
  {
    title: "2. Account Responsibilities",
    content:
      "You are responsible for maintaining the confidentiality of your login credentials. Activity under your account is your responsibility unless reported compromised to support immediately.",
  },
  {
    title: "3. Dealer Listings and Leads",
    content:
      "Dealers must publish truthful inventory details, pricing, and contact information. Lead notifications are provided as tools and do not guarantee completed transactions.",
  },
  {
    title: "4. Prohibited Conduct",
    content:
      "Users must not post misleading listings, scrape protected data, send spam enquiries, abuse APIs, or attempt unauthorized access to accounts, data, or systems.",
  },
  {
    title: "5. Payments and Subscriptions",
    content:
      "Any paid dealer plans or service charges are billed according to active subscription terms. Fees already incurred are non-refundable except where required by law or explicit policy.",
  },
  {
    title: "6. Limitation of Liability",
    content:
      "Motorke is provided as-is. We are not liable for indirect losses, transaction disputes between buyers and dealers, or interruptions caused by third-party providers and integrations.",
  },
  {
    title: "7. Contact",
    content:
      "For legal or platform terms questions, contact support@motorke.com.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFD] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-10">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Legal</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-3 text-sm font-medium text-slate-600">Last updated: April 7, 2026</p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <h2 className="text-base font-black text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
