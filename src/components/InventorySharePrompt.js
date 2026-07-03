"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { getThumbnailUrl } from "@/lib/image-transform";

const SHARE_TEMPLATES = [
  { key: "clean", label: "Clean" },
  { key: "urgent", label: "Urgent" },
  { key: "deal", label: "Deal" },
];

export default function InventorySharePrompt({ car, whatsappHrefByTemplate }) {
  const [open, setOpen] = useState(true);
  const [template, setTemplate] = useState("clean");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const dismissHref = useMemo(() => pathname || "/admin/cars", [pathname]);
  const whatsappHref = whatsappHrefByTemplate?.[template] || whatsappHrefByTemplate?.clean || "";
  
  const dismissPrompt = () => {
    setOpen(false);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("created");
    params.delete("car");
    const next = params.toString() ? `${dismissHref}?${params.toString()}` : dismissHref;
    router.replace(next, { scroll: false });
  };

  if (!open || !car || !whatsappHref) return null;

  return (
    <div className="mb-5 sm:mb-7 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 sm:p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
            Car published successfully
          </p>
          <h3 className="mt-1 text-sm sm:text-base font-black text-slate-900">
            Share this car on WhatsApp now
          </h3>
        </div>
        <button
          type="button"
          onClick={dismissPrompt}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-500 hover:text-slate-800"
          aria-label="Close share prompt"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-white p-2.5">
        {car.imageUrl ? (
          <div className="relative h-14 w-20 overflow-hidden rounded-lg">
            <Image src={getThumbnailUrl(car.imageUrl, 320)} alt={car.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="h-14 w-20 rounded-lg bg-slate-100" />
        )}
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black text-slate-900">{car.title}</p>
          <p className="truncate text-[11px] font-semibold text-slate-500">{car.priceLabel}</p>
          <p className="line-clamp-1 text-[11px] text-slate-600">{car.description}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {SHARE_TEMPLATES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTemplate(item.key)}
            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${
              template === item.key
                ? "border-[#2F855A] bg-[#2F855A] text-white"
                : "border-[#ddd4c8] bg-white text-slate-600 hover:text-slate-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-[#20bd5a]"
        >
          <MessageCircle size={14} />
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={dismissPrompt}
          className="inline-flex items-center rounded-xl border border-[#ddd4c8] bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
