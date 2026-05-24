import Link from "next/link";
import { Mail, MapPin, Store } from "lucide-react";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";

/**
 * Slim utility strip above the main navbar (contact + dealer entry).
 */
export default function SiteTopBar() {
  return (
    <div className="border-b border-slate-800/80 bg-[#111827] text-slate-200">
      <div className="w-full px-6 md:px-12">
        <div className="flex h-8 sm:h-9 md:h-10 items-center justify-between gap-3 text-[10px] sm:text-[11px] md:text-xs font-medium">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1">
            <a
              href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors min-w-0"
            >
              <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate max-w-[10rem] sm:max-w-none">{PUBLIC_SUPPORT_EMAIL}</span>
            </a>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Nairobi, Kenya
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/contact"
              className="hidden lg:inline hover:text-white transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-[#6ee7a8] hover:text-white transition-colors"
            >
              <Store className="h-3.5 w-3.5" aria-hidden />
              Dealer portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
