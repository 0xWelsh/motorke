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
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/portal",           label: "Overview",   Icon: LayoutDashboard },
  { href: "/portal/inventory", label: "Inventory",  Icon: Package         },
  { href: "/portal/leads",     label: "Inquiries",  Icon: MessageSquare   },
  { href: "/portal/analytics", label: "Performance", Icon: BarChart2       },
  { href: "/portal/subscription",   label: "Subscription", Icon: CreditCard      },
  { href: "/portal/profile",   label: "Settings",   Icon: Settings        },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-200",
        active 
          ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={clsx("transition-transform", !active && "group-hover:scale-110")} />
        <span className="text-sm font-bold tracking-tight">{label}</span>
      </div>
      {active && <ChevronRight size={14} className="opacity-50" />}
    </Link>
  );
}

export default function PortalLayout({ children }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 flex flex-col shrink-0 sticky top-0 h-screen border-r border-white/5 shadow-2xl z-50">
        {/* Branding */}
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-white font-black text-xl">M</span>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tighter block leading-none">
                Motor<span className="text-orange-600">ke</span>
              </span>
              <span className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest mt-1 block">
                Dealer Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="px-4 mb-4">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Management</p>
          </div>
          {links.slice(0, 3).map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="px-4 mb-4 mt-8">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Growth & Billing</p>
          </div>
          {links.slice(3).map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <Link href="/portal/cars/new" 
            className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-500 text-pureWhite font-black py-4 rounded-2xl mb-4 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(234,88,12,0.4)]">
            <Plus size={18} /> Add New Vehicle
          </Link>
          
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 dark:text-slate-500 text-slate-600 hover:text-white text-xs font-bold rounded-xl transition-colors">
              <ExternalLink size={14} /> Main Website
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 dark:text-slate-500 text-slate-600 hover:text-rose-400 text-xs font-bold rounded-xl transition-colors">
                <LogOut size={14} /> Log Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative">
        {/* Modern Top Header / Breadcrumb */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5 px-10 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest">
              <span>Portal</span>
              <ChevronRight size={12} className="text-white/20" />
              <span className="text-white">{links.find(l => l.href === path)?.label || "Dashboard"}</span>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-xs font-black text-white leading-none">Verified Dealer</p>
                <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                   <ShieldCheck size={10} /> Active Plan
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-orange-500 flex items-center justify-center font-black">
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