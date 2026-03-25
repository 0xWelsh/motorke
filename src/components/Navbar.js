"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, User, Menu, X, ChevronDown, LogOut, Heart, LayoutDashboard, Store } from "lucide-react";
import { clsx } from "clsx";

export default function Navbar({ user }) {
  const [open,      setOpen]      = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [scrolled,  setScrolled]  = useState(false);
  const menuRef = useRef(null);
  const router  = useRouter();

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
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
    { href: "/cars",    label: "Inventory" },
    { href: "/dealers", label: "Dealers" },
    { href: "/compare", label: "Compare" },
    { href: "/duty",    label: "Duty Calc" },
  ];

  return (
    <nav className={clsx(
      "sticky top-0 z-[100] transition-all duration-300 border-b",
      scrolled 
        ? "bg-white/80 backdrop-blur-xl border-slate-200 py-2 shadow-sm" 
        : "bg-white border-transparent py-4"
    )}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-amber-500 font-black text-xl">M</span>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              Motor<span className="text-amber-600">ke</span>
            </span>
          </Link>

          {/* Inline search bar — desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search make, model, year..."
              className="w-full bg-slate-100 border-2 border-transparent focus:border-amber-500/20 focus:bg-white rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none transition-all"
            />
          </form>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} 
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setUserMenu(!userMenu)} 
                  className="flex items-center gap-3 bg-slate-900 text-white pl-1.5 pr-4 py-1.5 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-sm">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-bold">{user.name?.split(" ")[0]}</span>
                  <ChevronDown className={clsx("w-4 h-4 text-amber-500 transition-transform", userMenu && "rotate-180")} />
                </button>
                
                {userMenu && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden p-2 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                    </div>

                    {user.role === "ADMIN" && <MenuDropdownItem href="/admin" label="Admin Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} />}
                    {user.role === "DEALER" && <MenuDropdownItem href="/portal" label="Dealer Portal" icon={<Store className="w-4 h-4" />} />}
                    
                    <MenuDropdownItem href="/account" label="My Account" icon={<User className="w-4 h-4" />} />
                    <MenuDropdownItem href="/saved" label="Saved Vehicles" icon={<Heart className="w-4 h-4" />} />
                    
                    <div className="my-1 border-t border-slate-50" />
                    <form action="/api/auth/logout" method="POST">
                      <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-6 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-2xl transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-2xl text-sm font-black transition-all shadow-lg shadow-amber-500/20">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button 
            onClick={() => setOpen(!open)} 
            className="lg:hidden p-2 text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-[73px] bg-white z-[90] p-6 animate-in slide-in-from-right duration-300">
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search cars…"
              className="w-full bg-slate-100 border-transparent rounded-2xl py-4 pl-12 pr-4 text-base font-medium outline-none" 
            />
          </form>

          <div className="space-y-2">
            {links.map(({ href, label }) => (
              <Link 
                key={href} 
                href={href} 
                onClick={() => setOpen(false)} 
                className="block p-4 text-xl font-black text-slate-900 border-b border-slate-50 active:bg-slate-50 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {!user ? (
            <div className="mt-12 grid grid-cols-2 gap-4">
              <Link href="/login" onClick={() => setOpen(false)} className="py-4 text-center font-bold text-slate-900 bg-slate-50 rounded-2xl">
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="py-4 text-center font-black text-black bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="mt-12 space-y-4">
               <Link href="/account" onClick={() => setOpen(false)} className="block w-full py-4 text-center font-black text-white bg-slate-900 rounded-2xl">
                My Account
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="w-full py-4 text-center font-bold text-rose-600 border border-rose-100 rounded-2xl">
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function MenuDropdownItem({ href, label, icon }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-colors">
      {icon}
      {label}
    </Link>
  );
}