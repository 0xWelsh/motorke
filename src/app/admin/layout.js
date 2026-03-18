// src/app/admin/layout.js
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-[#111] border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <a href="/" className="text-xl font-black">
            Motor<span className="text-[#f97316]">ke</span>
          </a>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin",            label: "Dashboard",    icon: "▦" },
            { href: "/admin/dealers",    label: "Dealerships",  icon: "🏢" },
            { href: "/admin/cars",       label: "All cars",     icon: "🚗" },
            { href: "/admin/cars/new",   label: "Add car",      icon: "+" },
            { href: "/admin/users",      label: "Users",        icon: "👤" },
            { href: "/admin/leads",      label: "Enquiries",    icon: "📩" },
          ].map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/30 mb-3 truncate">{user.email}</p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-xs text-white/30 hover:text-white border border-white/10 hover:border-white/20 rounded-lg py-2 transition-all"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
