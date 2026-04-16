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
  ExternalLink,
  ShieldCheck,
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
  { href: "/portal/subscription",   label: "Subscription", Icon: CreditCard      },
  { href: "/portal/profile",   label: "Settings",   Icon: Settings        },
];

function NavLink({ href, label, Icon, active, onClick }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-none transition-none",
        active 
          ? "bg-[#111111] text-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]" 
          : "text-slate-700 hover:text-slate-900 hover:bg-[#fbfcfe]"
      )}
    >
      <Icon size={18} />
      <span className="font-semibold text-[11px] uppercase font-black tracking-[0.10em]">{label}</span>
    </Link>
  );
}

export default function PortalLayout({ children }) {
  const path = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleNavClick = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      
      {/* Backdrop Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-[#111111]/50 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#ddd4c8] px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
         <div className="flex items-center gap-3">
           <button 
             onClick={() => setDrawerOpen(!drawerOpen)}
             className="p-2 -ml-2 text-slate-700 hover:text-slate-900 transition-colors"
           >
             <Menu size={20} />
           </button>
           <div className="hidden lg:flex flex-col">
              <span className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900">Motorske</span>
              <p className="text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-#ff5a2f mt-0.5 flex items-center gap-1">
                 <ShieldCheck size={11} /> Active Subscription
              </p>
           </div>
         </div>
         
         <div className="flex items-center gap-4">
            <NotificationsBell variant="portal" />
            <div className="w-10 h-10 rounded-none bg-[#fbfcfe] border border-[#ddd4c8] text-slate-700 flex items-center justify-center font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
              D
            </div>
         </div>
      </header>

      {/* Floating Drawer */}
      <aside className={clsx(
        "fixed left-0 top-0 h-screen w-72 bg-white border-r border-[#ddd4c8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)] z-50 flex flex-col transition-transform duration-300",
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close Button */}
        <div className="p-4 flex items-center justify-between border-b border-[#ddd4c8]">
          <span className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900">Navigation</span>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="p-1 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* OVERVIEW Section */}
          <div className="mb-4">
            <p className="text-[10px] uppercase font-black tracking-[0.15em] font-bold text-slate-700 uppercase tracking-wide px-4 py-2 mb-2">Overview</p>
            <div className="space-y-1">
              {links.slice(0, 3).map(({ href, label, Icon }) => (
                <NavLink 
                  key={href} 
                  href={href} 
                  label={label} 
                  Icon={Icon} 
                  active={path === href}
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </div>

          {/* MANAGEMENT Section */}
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.15em] font-bold text-slate-700 uppercase tracking-wide px-4 py-2 mb-2">Management</p>
            <div className="space-y-1">
              {links.slice(3).map(({ href, label, Icon }) => (
                <NavLink 
                  key={href} 
                  href={href} 
                  label={label} 
                  Icon={Icon} 
                  active={path === href}
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#ddd4c8] space-y-2">
          <Link 
            href="/portal/cars/bulk"
            onClick={handleNavClick}
            className="flex items-center justify-center gap-2 w-full bg-[#fbfcfe] hover:bg-slate-200 text-slate-900 font-semibold py-2.5 rounded-none transition-none text-[10px] uppercase font-black tracking-[0.15em]"
          >
            <Plus size={14} /> Bulk Upload
          </Link>
          <Link 
            href="/portal/cars/new"
            onClick={handleNavClick}
            className="flex items-center justify-center gap-2 w-full bg-[#111111] hover:bg-[#111111] text-slate-900 font-semibold py-2.5 rounded-none transition-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] text-[10px] uppercase font-black tracking-[0.15em]"
          >
            <Plus size={14} /> Add Car
          </Link>
          
          <div className="pt-2 border-t border-[#ddd4c8] space-y-1">
            <Link 
              href="/"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:text-slate-900 text-[10px] uppercase font-black tracking-[0.15em] font-semibold rounded-none transition-none"
            >
              <ExternalLink size={14} /> Marketplace
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button 
                type="submit" 
                className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-700 hover:text-rose-600 text-[10px] uppercase font-black tracking-[0.15em] font-semibold rounded-none transition-none"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}