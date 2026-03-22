"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Navbar({ user }) {
  const [open,      setOpen]      = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [scrolled,  setScrolled]  = useState(false);
  const menuRef = useRef(null);
  const router  = useRouter();

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) router.push(`/cars?search=${encodeURIComponent(search.trim())}`);
    else router.push("/cars");
  }

  const links = [
    { href: "/cars",    label: "Buy a Car"    },
    { href: "/dealers", label: "Dealerships"  },
    { href: "/compare", label: "Compare"      },
    { href: "/duty",    label: "Duty Calc"    },
  ];

  return (
    <nav style={{
      background: "#fff",
      borderBottom: `1px solid ${scrolled ? "#d0d0d0" : "#E2E2E2"}`,
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
      transition: "all 0.2s",
    }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", height: 60, gap: 20 }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 20, color: "#0A2640", letterSpacing: "-0.5px" }}>
              Motor<span style={{ color: "#E8490F" }}>ke</span>
            </span>
          </a>

          {/* Inline search bar — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex" style={{ flex: 1, maxWidth: 380, position: "relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search make, model…"
              style={{
                width: "100%", background: "#F5F5F5", border: "1.5px solid #E2E2E2",
                borderRadius: 99, padding: "8px 44px 8px 16px",
                fontSize: 13, fontFamily: "inherit", outline: "none", color: "#1A1A1A",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#E8490F"}
              onBlur={e => e.target.style.borderColor = "#E2E2E2"}
            />
            <button type="submit" style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: "#E8490F", border: "none", borderRadius: "50%",
              width: 28, height: 28, cursor: "pointer", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>
              ⌕
            </button>
          </form>

          {/* Nav links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 2 }}>
            {links.map(({ href, label }) => (
              <a key={href} href={href} style={{
                textDecoration: "none", color: "#444", fontSize: 13, fontWeight: 500,
                padding: "6px 10px", borderRadius: 7, transition: "all 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.target.style.background = "#F5F5F5"; e.target.style.color = "#0A2640"; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#444"; }}>
                {label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {user ? (
              <div style={{ position: "relative" }} ref={menuRef}>
                <button onClick={() => setUserMenu(!userMenu)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#F5F5F5", border: "1.5px solid #E2E2E2",
                  borderRadius: 99, padding: "5px 12px 5px 6px",
                  cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#E8490F", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  {user.name?.split(" ")[0]}
                  <span style={{ fontSize: 9, color: "#999" }}>▼</span>
                </button>
                {userMenu && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", border: "1px solid #E2E2E2", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.1)", minWidth: 180, overflow: "hidden", zIndex: 200 }}>
                    {user.role === "ADMIN"  && <MenuItem href="/admin"   label="Admin panel" />}
                    {user.role === "DEALER" && <MenuItem href="/portal"  label="My listings" />}
                    <MenuItem href="/account" label="My account" />
                    <MenuItem href="/saved"   label="Saved cars" />
                    <div style={{ borderTop: "1px solid #E2E2E2" }} />
                    <form action="/api/auth/logout" method="POST">
                      <button type="submit" style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#E8490F", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/login" style={{ textDecoration: "none", color: "#0A2640", fontSize: 13, fontWeight: 600, padding: "7px 14px", border: "1.5px solid #E2E2E2", borderRadius: 8 }}>
                  Sign in
                </a>
                <a href="/signup" style={{ textDecoration: "none", background: "#E8490F", color: "white", fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 8 }}>
                  Sign up
                </a>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ display: "block", width: 20, height: 2, background: "#1A1A1A", transition: "all 0.2s", transform: open ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ display: "block", width: 20, height: 2, background: "#1A1A1A", opacity: open ? 0 : 1 }} />
            <span style={{ display: "block", width: 20, height: 2, background: "#1A1A1A", transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: "#fff", borderTop: "1px solid #E2E2E2", padding: "12px 20px 20px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cars…"
              style={{ flex: 1, background: "#F5F5F5", border: "1.5px solid #E2E2E2", borderRadius: 8, padding: "9px 14px", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            <button type="submit" style={{ background: "#E8490F", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Search</button>
          </form>
          {links.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{ display: "block", padding: "11px 8px", color: "#333", fontSize: 14, fontWeight: 500, textDecoration: "none", borderBottom: "1px solid #F5F5F5" }}>{label}</a>
          ))}
          {!user && (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <a href="/login"  style={{ flex: 1, textAlign: "center", padding: "10px", border: "1.5px solid #E2E2E2", borderRadius: 8, color: "#0A2640", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>Sign in</a>
              <a href="/signup" style={{ flex: 1, textAlign: "center", padding: "10px", background: "#E8490F", borderRadius: 8, color: "white", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>Sign up</a>
            </div>
          )}
          {user && (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <a href="/account" style={{ flex: 1, textAlign: "center", padding: "10px", border: "1.5px solid #E2E2E2", borderRadius: 8, color: "#0A2640", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>My account</a>
              <form action="/api/auth/logout" method="POST" style={{ flex: 1 }}>
                <button type="submit" style={{ width: "100%", padding: "10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
              </form>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function MenuItem({ href, label }) {
  return (
    <a href={href} style={{ display: "block", padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#333", textDecoration: "none" }}
      onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {label}
    </a>
  );
}