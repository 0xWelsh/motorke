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
  Settings,
  Search,
  UserPlus,
  Command
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import NotificationsBell from "@/components/NotificationsBell";

const links = [
  { href: "/admin",           label: "Overview",    Icon: LayoutDashboard },
  { href: "/admin/cars",      label: "Inventory",   Icon: Car             },
  { href: "/admin/dealers",   label: "Dealers Hub", Icon: Building2       },
  { href: "/admin/approvals", label: "Moderation",  Icon: ShieldAlert     },
  { href: "/admin/users",     label: "Network",     Icon: Users           },
  { href: "/admin/leads",     label: "Intelligence",Icon: MessageSquare   },
];

const quickActions = [
  { href: "/admin/cars/new",    label: "New Unit",    Icon: Plus },
  { href: "/admin/dealers/new", label: "Join Partner", Icon: UserPlus },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-5 py-3 rounded-xl transition-all duration-300",
        active 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={clsx("transition-colors", active ? "text-white" : "group-hover:text-emerald-600")} />
        <span className="text-[13px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const path = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleGlobalSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      window.location.href = `/admin/cars?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-0 h-screen z-50">
        {/* Branding */}
        <div className="p-8">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-500 shadow-xl shadow-slate-200">
              <span className="text-white font-black text-2xl tracking-tighter">M</span>
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tighter block leading-none">
                Motor<span className="text-emerald-600">ke</span>
              </span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1.5 block">
                Control Center
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4">
             <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Core Operations</p>
          </div>
          {links.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="px-4 mb-4 mt-8">
             <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Management</p>
          </div>
          {quickActions.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-slate-900 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-white border border-transparent hover:border-slate-200">
            <ExternalLink size={14} /> Live View
          </Link>
          <form action="/api/auth/logout" method="POST" className="mt-1">
            <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 hover:text-rose-600 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-rose-50 hover:border-rose-100 border border-transparent">
              <LogOut size={14} /> Deauthorize
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-5 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              <span className="hover:text-emerald-600 transition-colors cursor-default">Nexus</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-900 font-black">{links.find(l => l.href === path)?.label || "Overview"}</span>
           </div>
           
           <div className="flex items-center gap-8">
              {/* Search */}
              <div className="hidden lg:flex items-center relative group">
                <Search className="absolute left-4 w-4 h-4 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text"
                  placeholder="Universal Search... (Enter)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-[13px] font-medium w-64 focus:w-80 focus:border-emerald-500/50 focus:bg-white focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
                  <NotificationsBell variant="admin" />
                 <button className="text-slate-600 hover:text-slate-900 transition-all" title="Configuration">
                    <Settings size={20} />
                 </button>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-1.5 pr-4 rounded-2xl group cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:bg-emerald-600 transition-all duration-300">
                  AD
                </div>
                <div className="hidden sm:flex flex-col">
                  <p className="text-[11px] font-black text-slate-900 uppercase leading-none">Super Admin</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Verified Node</p>
                </div>
              </div>
           </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
