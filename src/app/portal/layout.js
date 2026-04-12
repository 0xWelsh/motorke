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
  ShieldCheck,
  TrendingUp,
  Menu,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import NotificationsBell from "@/components/NotificationsBell";

const links = [
  { href: "/portal",           label: "Overview",   Icon: LayoutDashboard },
  { href: "/portal/inventory", label: "Inventory",  Icon: Package         },
  { href: "/portal/leads",     label: "Leads",      Icon: MessageSquare   },
  { href: "/portal/analytics", label: "Analytics",  Icon: BarChart2       },
  { href: "/portal/intelligence", label: "Insights", Icon: TrendingUp },
  { href: "/portal/subscription",   label: "Subscription", Icon: CreditCard      },
  { href: "/portal/profile",   label: "Settings",   Icon: Settings        },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-300 relative",
        active 
          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm" 
          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={clsx("transition-all duration-300", active ? "scale-110" : "text-slate-400 group-hover:scale-110 group-hover:text-emerald-500")} />
        <span className={clsx("text-sm transition-all", active ? "font-bold" : "font-semibold")}>{label}</span>
      </div>
      
      {active && (
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-current" />
           <ChevronRight size={14} className="opacity-30" />
        </div>
      )}

      {/* Precision Accent Bar */}
      {active && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full" />
      )}
    </Link>
  );
}

export default function PortalLayout({ children }) {
  const path = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "w-72 bg-white dark:bg-slate-900 flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800/50 z-50 h-full fixed lg:static transition-transform duration-300 shadow-lg lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Close Button */}
        <div className="p-4 flex items-center justify-end lg:hidden">
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-2 bg-slate-900 dark:bg-black px-4 py-2.5 rounded-lg">
             <p className="text-xs font-black text-white uppercase tracking-wider">Overview</p>
          </div>
          {links.slice(0, 3).map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="mb-2 mt-6 bg-slate-900 dark:bg-black px-4 py-2.5 rounded-lg">
             <p className="text-xs font-black text-white uppercase tracking-wider">Management</p>
          </div>
          {links.slice(3).map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <Link href="/portal/cars/bulk" 
            className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-lg mb-2 transition-all uppercase text-xs tracking-wider">
            <Plus size={16} /> Bulk Upload
          </Link>
          <Link href="/portal/cars/new" 
            className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold py-3 rounded-lg mb-3 transition-all shadow-md uppercase text-xs tracking-wider">
            <Plus size={16} /> Add Car
          </Link>
          
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all">
              <ExternalLink size={14} /> Marketplace
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-3 w-full px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 text-xs font-bold uppercase tracking-wider rounded-lg transition-all">
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full min-w-0 overflow-y-auto relative custom-scrollbar flex flex-col bg-white dark:bg-slate-900">
        {/* Modern Top Header / Breadcrumb */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
              <button 
                className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                 <Menu size={20} />
              </button>
              <span className="hidden sm:inline">Management</span>
              <ChevronRight size={12} className="hidden sm:block text-slate-300 dark:text-slate-600" />
              <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{links.find(l => l.href === path)?.label || "Overview"}</span>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end">
                 <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">Motorske</span>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1 uppercase tracking-wider">
                   <ShieldCheck size={12} /> Active Subscription
                </p>
              </div>
              <NotificationsBell variant="portal" />
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center font-bold shadow-sm">
                D
              </div>
           </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10 w-full overflow-y-auto relative z-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}