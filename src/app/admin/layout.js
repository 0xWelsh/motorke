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
  ShieldAlert
} from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/admin",           label: "Overview",   Icon: LayoutDashboard },
  { href: "/admin/cars",      label: "Inventory",  Icon: Car             },
  { href: "/admin/dealers",   label: "Dealers",    Icon: Building2       },
  { href: "/admin/users",     label: "Users",      Icon: Users           },
  { href: "/admin/leads",     label: "Enquiries",  Icon: MessageSquare   },
];

const quickActions = [
  { href: "/admin/cars/new",  label: "Add Listing", Icon: Plus },
  { href: "/admin/cars/bulk", label: "Bulk Import", Icon: Upload },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-200",
        active 
          ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
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

export default function AdminLayout({ children }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 flex flex-col shrink-0 sticky top-0 h-screen border-r border-white/5 shadow-2xl z-50">
        {/* Branding */}
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-black font-black text-xl">M</span>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tighter block leading-none">
                Motor<span className="text-amber-500">ke</span>
              </span>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1 block">
                System Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="px-4 mb-4">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Platform Management</p>
          </div>
          {links.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="px-4 mb-4 mt-8">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Quick Operations</p>
          </div>
          {quickActions.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white text-xs font-bold rounded-xl transition-colors">
              <ExternalLink size={14} /> Live Website
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-400 text-xs font-bold rounded-xl transition-colors">
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative">
        {/* Modern Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Admin</span>
              <ChevronRight size={12} />
              <span className="text-slate-900">{links.find(l => l.href === path)?.label || "Dashboard"}</span>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-xs font-black text-slate-900 leading-none">Super Administrator</p>
                <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                   <ShieldAlert size={10} /> Full Access
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center font-black">
                A
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