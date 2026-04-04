"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Car, 
  Plus, 
  MessageSquare, 
  BarChart2, 
  Package, 
  CreditCard, 
  Settings, 
  LogOut,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/portal",           label: "Overview",   Icon: LayoutDashboard },
  { href: "/portal/inventory", label: "Inventory",  Icon: Package         },
  { href: "/portal/leads",     label: "Inquiries",  Icon: MessageSquare   },
  { href: "/portal/analytics", label: "Performance", Icon: BarChart2       },
  { href: "/portal/intelligence", label: "Intelligence", Icon: TrendingUp },
  { href: "/portal/subscription",   label: "Subscription", Icon: CreditCard      },
  { href: "/portal/profile",   label: "Settings",   Icon: Settings        },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-300 relative",
        active 
          ? "bg-emerald-50 text-[var(--brand)] shadow-sm" 
          : "text-slate-900 hover:text-emerald-800 hover:bg-slate-50"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={clsx("transition-all duration-300", active ? "text-[var(--brand)] scale-110" : "text-slate-900/40 group-hover:scale-110 group-hover:text-emerald-600")} />
        <span className={clsx("text-sm tracking-tight transition-all", active ? "font-black" : "font-black")}>{label}</span>
      </div>
      
      {active && (
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
           <ChevronRight size={14} className="text-[var(--brand)] opacity-30" />
        </div>
      )}

      {/* Precision Accent Bar */}
      {active && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--brand)] rounded-r-full" />
      )}
    </Link>
  );
}

export default function PortalLayout({ children }) {
  const path = usePathname();

  return (
    <div className="flex h-screen bg-slate-50/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white flex flex-col shrink-0 border-r border-slate-100 z-50 h-full">
        {/* Branding */}
        <div className="p-8 mb-4">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-11 h-11 bg-[var(--brand)] rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-emerald-900/10">
              <img src="/logo.png" alt="M" className="w-10 h-10 object-contain brightness-0 invert" />
            </div>
            <div>
              <img src="/logo.png" alt="Motorke" className="h-12 w-auto object-contain" />
              <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-[0.2em] mt-2 block">
                Dealer Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-3">
             <p className="text-[9px] font-black text-slate-900/20 uppercase tracking-[0.3em]">Core Operations</p>
          </div>
          {links.slice(0, 3).map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="px-4 mb-3 mt-10">
             <p className="text-[9px] font-black text-slate-900/20 uppercase tracking-[0.3em]">Growth & Capital</p>
          </div>
          {links.slice(3).map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* User / Footer */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/30">
          <Link href="/portal/cars/new" 
            className="flex items-center justify-center gap-2 w-full bg-slate-950 hover:bg-black text-white font-black py-4 rounded-2xl mb-6 transition-all hover:scale-[1.02] shadow-xl shadow-slate-900/10 uppercase text-[10px] tracking-widest">
            <Plus size={16} /> Deploy Vehicle
          </Link>
          
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-900/40 hover:text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
              <ExternalLink size={14} /> Marketplace
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-slate-900/40 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                <LogOut size={14} /> Terminate Session
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar">
        {/* Modern Top Header / Breadcrumb */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-10 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <span>Management</span>
              <ChevronRight size={12} className="text-slate-200" />
              <span className="text-slate-900">{links.find(l => l.href === path)?.label || "Overview"}</span>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                 <img src="/logo.png" alt="Motorke" className="h-10 w-auto object-contain" />
                <p className="text-[10px] font-black text-emerald-600 mt-1 flex items-center gap-1 uppercase tracking-[0.1em]">
                   <ShieldCheck size={10} className="fill-emerald-50" /> Active Subscription
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-[var(--brand)] flex items-center justify-center font-black shadow-sm">
                D
              </div>
           </div>
        </header>

        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
}