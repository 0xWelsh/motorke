"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How does BIDGARI verify its cars?",
    a: "Every car we list passes our own checks before it goes live: ownership documents, mileage and condition verification, import duty status, and a physical inspection. We source stock from trusted partner yards, but the verification, the price, and the sale are all ours — you deal with BIDGARI, one team, start to finish.",
  },
  {
    q: "Is there a fee to buy a car through BIDGARI?",
    a: "No. Browsing, comparing, duty estimates, and buying cost nothing extra — the price you see is the price we agree. We earn when a car sells, which is why every listing is inspected and priced to move, not padded with hidden charges.",
  },
  {
    q: "How accurate is the duty calculator?",
    a: "Our duty calculator uses current KRA rates (import duty, excise, VAT, IDF, RDL) based on the car's engine size, age, and CIF value. It gives you a close estimate of what the car will cost once it lands in Kenya. For exact figures, consult a licensed clearing agent.",
  },
  {
    q: "Can I compare cars before enquiring?",
    a: "Yes. Pick up to three cars and compare them side by side — specs, pricing, total cost of ownership, and road-readiness signals in one view. No tab-hopping, no phone tag with five different sellers: one enquiry to BIDGARI covers it all.",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm sm:text-base font-bold text-text pr-4 group-hover:text-[var(--accent)] transition-colors">
          {item.q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-dim shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[var(--accent)]" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-60 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-muted leading-relaxed font-medium">
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function HomepageFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-10 sm:py-14 bg-surface border-y border-border">
      <div className="home-shell max-w-3xl">
        <div className="text-center mb-8 sm:mb-10">
          <p className="meta-label text-[var(--accent)] mb-3">FAQ</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-text tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="border-t border-border">
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
