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
} from "lucide-react";
import { clsx } from "clsx";
import NotificationsBell from "@/components/NotificationsBell";

const links = [
  { href: "/portal",           label: "Overview",   Icon: LayoutDashboard },
  { href: "/portal/inventory", label: "Inventory",  Icon: Package         },
  { href: "/portal/leads",     label: "Leads",      Icon: MessageSquare   },
  { href: "/portal/analytics", label: "Analytics",  Icon: BarChart2       },
  { href: "/portal/subscription",   label: "Subscription", Icon: CreditCard      },
  { href: "/portal/profile",   label: "Settings",   Icon: Settings        },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
        active 
          ? "bg-slate-900 text-white shadow-sm" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}

export default function PortalLayout({ children }) {
  const path = usePathname();

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
           <div className="hidden lg:flex flex-col">
              <span className="text-sm font-bold text-slate-900">Motorske</span>
              <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                 <ShieldCheck size={12} /> Active Subscription
              </p>
           </div>
         </div>
         
         <div className="flex items-center gap-4">
            <NotificationsBell variant="portal" />
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold shadow-sm">
              D
            </div>
         </div>
      </header>

      {/* Horizontal Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3 overflow-x-auto custom-scrollbar flex items-center gap-1">
        <div className="flex items-center gap-1 w-full">
          {/* OVERVIEW Section */}
          <div className="flex items-center gap-1 mr-6">
            {links.slice(0, 3).map(({ href, label, Icon }) => (
              <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
            ))}
          </div>

          {/* MANAGEMENT Section */}
          <div className="flex items-center gap-1">
            {links.slice(3).map(({ href, label, Icon }) => (
              <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}