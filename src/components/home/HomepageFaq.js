"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How does BIDGARI verify dealers?",
    a: "Every dealership on BIDGARI goes through a verification process before they can list cars. We confirm business registration, physical showroom existence, and track record. Verified dealers carry a badge on their listings so you know who you're dealing with.",
  },
  {
    q: "Is there a fee to list or buy a car?",
    a: "Listing is free for dealers — no subscription, no commission, no hidden charges. Buyers also pay nothing to browse, compare, or contact sellers. BIDGARI earns from dealer subscription plans that unlock premium features like spotlight placement and boost.",
  },
  {
    q: "How accurate is the duty calculator?",
    a: "Our duty calculator uses current KRA rates (import duty, excise, VAT, IDF, RDL) based on the car's engine size, age, and CIF value. It gives you a close estimate of what the car will cost once it lands in Kenya. For exact figures, consult a licensed clearing agent.",
  },
  {
    q: "Can I compare cars before contacting a dealer?",
    a: "Yes. Pick up to three cars and compare them side by side — specs, pricing, total cost of ownership, and road-readiness signals in one view. No need to hop between tabs or call multiple dealers to get basic info.",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm sm:text-base font-bold text-white pr-4 group-hover:text-[var(--accent)] transition-colors">
          {item.q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[var(--accent)]" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-60 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-zinc-400 leading-relaxed font-medium">
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function HomepageFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-14 sm:py-20 bg-[#080808]">
      <div className="home-shell max-w-3xl">
        <div className="text-center mb-10 sm:mb-12">
          <p className="meta-label text-[var(--accent)] mb-3">FAQ</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="border-t border-white/[0.06]">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
