export const metadata = {
  title: "Privacy Policy - Motorke",
  description: "How Motorke collects, uses, and protects personal data.",
};

const sections = [
  {
    title: "1. Data We Collect",
    content:
      "We collect account details (name, email, role), dealer profile data, listing data, and buyer enquiry information submitted through platform forms.",
  },
  {
    title: "2. How We Use Data",
    content:
      "Data is used to operate authentication, connect buyers with dealers, deliver lead notifications, improve product performance, and secure platform operations.",
  },
  {
    title: "3. Email and Notifications",
    content:
      "We send transactional emails such as verification codes, lead alerts, and password reset links. Notification preferences may expand as mobile app channels are introduced.",
  },
  {
    title: "4. Data Sharing",
    content:
      "We do not sell personal data. We may share limited data with service providers required to run infrastructure, email, analytics, and payment workflows.",
  },
  {
    title: "5. Security",
    content:
      "We apply technical and operational controls to protect data, including session controls, password hashing, and access restrictions. No system can be guaranteed fully risk-free.",
  },
  {
    title: "6. Retention",
    content:
      "We retain data as long as needed to provide services, satisfy legal obligations, or resolve disputes. Data may be removed or anonymized when no longer required.",
  },
  {
    title: "7. Your Rights",
    content:
      "You may request account updates or deletion where applicable by contacting support@motorke.com.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFD] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-10">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Legal</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Privacy Policy</h1>
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
