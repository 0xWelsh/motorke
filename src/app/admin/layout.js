"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Car, 
  Plus, 
  Upload, 
  Building2, 
  Users, 
  MessageSquare, 
  LogOut,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  UserPlus
} from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/admin",           label: "Dashboard",   Icon: LayoutDashboard },
  { href: "/admin/cars",      label: "Inventory",   Icon: Car             },
  { href: "/admin/dealers",   label: "Dealers",      Icon: Building2       },
  { href: "/admin/approvals", label: "Approvals",   Icon: ShieldCheck     },
  { href: "/admin/users",     label: "Users",       Icon: Users           },
  { href: "/admin/leads",     label: "Enquiries",   Icon: MessageSquare   },
  { href: "/admin/news",      label: "News",        Icon: Bell            },
];

const quickActions = [
  { href: "/admin/cars/new",  label: "Add Listing", Icon: Plus },
  { href: "/admin/cars/bulk", label: "Bulk Import", Icon: Upload },
  { href: "/admin/dealers/new", label: "Add Dealer", Icon: Building2 },
  { href: "/admin/users/new", label: "Add User", Icon: UserPlus },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-300",
        active 
          ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={clsx("transition-transform duration-500", !active && "group-hover:scale-110 group-hover:text-orange-500")} />
        <span className="text-[13px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-orange-600 shadow-[0_0_12px_rgba(234,88,12,0.8)]" />}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-950 flex flex-col shrink-0 sticky top-0 h-screen z-50 overflow-hidden">
        {/* Abstract Glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-600/10 blur-[100px] -ml-32 -mt-32 pointer-events-none" />
        
        {/* Branding */}
        <div className="p-10 relative z-10">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-all duration-500 shadow-2xl shadow-black">
              <span className="text-slate-900 group-hover:text-white font-black text-2xl tracking-tighter transition-colors">M</span>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tighter block leading-none">
                Motor<span className="dark:text-slate-400 text-slate-600 group-hover:text-orange-600 transition-colors">ke</span>
              </span>
              <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.3em] mt-2 block">
                Standard Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="px-4 mb-6">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Main Systems</p>
          </div>
          {links.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="px-4 mb-6 mt-12">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Quick Operations</p>
          </div>
          {quickActions.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* User / Footer */}
        <div className="p-8 border-t border-white/5 bg-black/20 relative z-10">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 dark:text-slate-500 text-slate-600 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all">
              <ExternalLink size={14} /> Live Showcase
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 dark:text-slate-500 text-slate-600 hover:text-rose-500 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all">
                <LogOut size={14} /> Terminate
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        {/* Modern Top Header */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-2xl border-b border-white/5 px-12 py-5 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              <span className="hover:text-white transition-colors cursor-default">System</span>
              <ChevronRight size={10} className="text-white/20" />
              <span className="text-white">{links.find(l => l.href === path)?.label || "Dashboard"}</span>
           </div>
           
           <div className="flex items-center gap-8">
              <div className="hidden sm:flex items-center gap-6 pr-6 border-r border-white/5">
                 <button onClick={() => alert("Global search is coming in Phase 2!")} className="text-white/40 hover:text-white transition-colors" title="Search">
                    <Search size={18} />
                 </button>
                 <button onClick={() => alert("Notification center is coming in Phase 2!")} className="text-white/40 hover:text-white transition-colors relative" title="Notifications">
                    <Bell size={18} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-600 rounded-full border-2 border-white/10" />
                 </button>
                 <button onClick={() => alert("Dashboard settings are coming in Phase 2!")} className="text-white/40 hover:text-white transition-colors" title="Settings">
                    <Settings size={18} />
                 </button>
              </div>

              <div className="flex items-center gap-4 group cursor-default">
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-[11px] font-black text-white leading-none uppercase tracking-widest">Admin Standard</p>
                  <p className="text-[9px] font-black text-orange-600 mt-1 flex items-center gap-1 uppercase tracking-widest">
                     <ShieldAlert size={10} /> Full Privilege
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-white/10 text-pureWhite flex items-center justify-center font-black text-sm group-hover:bg-orange-600 transition-colors duration-500">
                  AD
                </div>
              </div>
           </div>
        </header>

        <div className="p-12 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
