// src/app/admin/layout.js
import { requireAdmin } from "@/lib/auth";
import { LayoutDashboard, Car, Plus, Upload, Building2, Users, MessageSquare, LogOut } from "lucide-react";

export default async function AdminLayout({ children }) {
  await requireAdmin();

  const links = [
    { href: "/admin",           label: "Dashboard",    Icon: LayoutDashboard },
    { href: "/admin/cars",      label: "All cars",     Icon: Car             },
    { href: "/admin/cars/new",  label: "Add car",      Icon: Plus            },
    { href: "/admin/cars/bulk", label: "Bulk upload",  Icon: Upload          },
    { href: "/admin/dealers",   label: "Dealerships",  Icon: Building2       },
    { href: "/admin/users",     label: "Users",        Icon: Users           },
    { href: "/admin/leads",     label: "Enquiries",    Icon: MessageSquare   },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F7F8FA" }}>
      {/* Sidebar */}
      <aside style={{ width:220, background:"#1C1C1E", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
        {/* Logo */}
        <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <a href="/" style={{ textDecoration:"none" }}>
            <span style={{ fontWeight:800, fontSize:18, color:"white" }}>Motor<span style={{ color:"#F59E0B" }}>ke</span></span>
          </a>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.08em" }}>Admin Panel</p>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto" }}>
          {links.map(({ href, label, Icon }) => (
            <a key={href} href={href} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"9px 12px", borderRadius:9, marginBottom:2,
              textDecoration:"none", color:"rgba(255,255,255,0.55)",
              fontSize:13, fontWeight:500, transition:"all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}>
              <Icon size={15} />
              {label}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, textDecoration:"none", color:"rgba(255,255,255,0.35)", fontSize:13, marginBottom:4 }}
            onMouseEnter={e => { e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
            <Car size={14} /> View site
          </a>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:13, cursor:"pointer", fontFamily:"inherit", width:"100%" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflowX:"hidden" }}>
        {children}
      </main>
    </div>
  );
}