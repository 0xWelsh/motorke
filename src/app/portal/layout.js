"use client";
// src/app/portal/layout.js
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, Plus, MessageSquare, BarChart2, Package, CreditCard, Settings, LogOut } from "lucide-react";

const links = [
  { href: "/portal",           label: "Dashboard", Icon: LayoutDashboard },
  { href: "/portal/inventory", label: "Inventory", Icon: Package         },
  { href: "/portal/cars/new",  label: "Add car",   Icon: Plus            },
  { href: "/portal/leads",     label: "Leads",     Icon: MessageSquare   },
  { href: "/portal/analytics", label: "Analytics", Icon: BarChart2       },
  { href: "/portal/billing",   label: "Billing",   Icon: CreditCard      },
  { href: "/portal/profile",   label: "Settings",  Icon: Settings        },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <a href={href} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px", borderRadius: 9, marginBottom: 2,
      textDecoration: "none", fontSize: 13, fontWeight: 500,
      transition: "all 0.15s",
      background: active ? "rgba(245,158,11,0.15)" : "transparent",
      color:      active ? "#F59E0B" : "rgba(255,255,255,0.55)",
    }}>
      <Icon size={15} />
      {label}
    </a>
  );
}

export default function PortalLayout({ children }) {
  const path = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>
      <aside style={{ width: 220, background: "#1C1C1E", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>
              Motor<span style={{ color: "#F59E0B" }}>ke</span>
            </span>
          </a>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Dealer Portal
          </p>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {links.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, textDecoration: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 4 }}>
            <Car size={14} /> View site
          </a>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main style={{ flex: 1, overflowX: "hidden" }}>{children}</main>
    </div>
  );
}