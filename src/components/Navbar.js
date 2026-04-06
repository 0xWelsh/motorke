"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, User, Menu, X, ChevronDown, LogOut, Heart,
  LayoutDashboard, Store, PlusCircle, ShieldCheck, Compass,
  Sun, Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { clsx } from "clsx";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";

export default function Navbar({ user }) {
  const [open,      setOpen]      = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [scrolled,  setScrolled]  = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef   = useRef(null);
  const searchRef = useRef(null);
  const router    = useRouter();
  
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { debouncedTerm } = useDebouncedSearch(search, 300);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!debouncedTerm || debouncedTerm.length < 2) {
      setSuggestions([]); setShowSuggestions(false); return;
    }
    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res  = await fetch(`/api/search/suggestions?query=${encodeURIComponent(debouncedTerm)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.suggestions?.length > 0);
      } catch { setSuggestions([]); setShowSuggestions(false); }
      finally  { setLoadingSuggestions(false); }
    };
    fetchSuggestions();
  }, [debouncedTerm]);

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) router.push(`/cars?search=${encodeURIComponent(search.trim())}`);
    else router.push("/cars");
  }

  function handleSuggestionSelect(value) {
    setSearch(value);
    setShowSuggestions(false);
    router.push(`/cars?search=${encodeURIComponent(value)}`);
  }

  const links = [
    { href: "/cars",    label: "Inventory", icon: <Store className="w-4 h-4" /> },
    { href: "/dealers", label: "Dealers",   icon: <ShieldCheck className="w-4 h-4" /> },
    { href: "/compare", label: "Compare",   icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <nav className={clsx(
      "sticky top-0 z-[100] transition-all duration-500",
      scrolled
        ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 py-3 shadow-md"
        : "bg-white dark:bg-slate-950 border-b border-slate-100 py-5"
    )}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between gap-12">

          {/* LOGO */}
          <Link href="/" className="flex items-center shrink-0 group transition-transform active:scale-95">
            <img src="/logo.png" alt="Motorke" className="h-14 w-auto object-contain" />
          </Link>

          {/* NAV LINKS */}
          <div className="hidden lg:flex items-center gap-2">
            {links.map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[13px] font-extrabold uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:text-brand transition-all">
                <span className="text-slate-400 group-hover:text-brand">{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          {/* SEARCH */}
          <div ref={searchRef} className="hidden xl:flex flex-1 max-w-md relative group">
            <form onSubmit={handleSearch} className="w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand transition-colors" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                placeholder="Search by make, model, or body type..."
                className="w-full bg-slate-50 border border-slate-100 focus:border-brand-accent/30 focus:bg-white focus:ring-4 focus:ring-brand-accent/5 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold outline-none transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
              />
            </form>
            {showSuggestions && (
              <SearchSuggestions
                suggestions={suggestions}
                loading={loadingSuggestions}
                onSelect={handleSuggestionSelect}
                inputValue={search}
                className="mt-3"
              />
            )}
          </div>

          {/* USER ACTIONS */}
          <div className="hidden lg:flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-6">
                <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-200 pl-2 pr-5 py-2 rounded-2xl hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm uppercase text-white bg-brand shadow-lg shadow-brand/20">
                    {user.name?.[0]}
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">{user.name?.split(" ")[0]}</span>
                  <ChevronDown className={clsx("w-4 h-4 text-slate-400 transition-transform duration-500", userMenu && "rotate-180")} />
                </button>

                {userMenu && (
                  <div className="absolute right-0 top-full mt-4 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-3 animate-in fade-in slide-in-from-top-2">
                    <div className="px-5 py-4 bg-slate-50 rounded-2xl mb-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Signed in as</p>
                      <p className="text-sm font-extrabold text-slate-900 truncate">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      {user.role === "ADMIN"  && <MenuDropdownItem href="/admin"   label="Administration"  icon={<LayoutDashboard className="w-5 h-5" />} />}
                      {user.role === "DEALER" && <MenuDropdownItem href="/portal"  label="Dealer Portal"   icon={<Store className="w-5 h-5" />} />}
                      <MenuDropdownItem href="/account" label="Profile Settings" icon={<User className="w-5 h-5" />} />
                      <MenuDropdownItem href="/saved"   label="Watchlist"        icon={<Heart className="w-5 h-5" />} />
                      <div className="my-2 h-px bg-slate-100 mx-4" />
                      <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="w-full flex items-center gap-4 px-5 py-4 text-[11px] font-extrabold uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                          <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-extrabold text-slate-900 hover:text-brand transition-colors px-4">
                  Sign In
                </Link>
                <Link href="/signup" className="text-white px-8 py-4 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all hover:bg-brand bg-brand-accent shadow-lg shadow-brand-accent/20 active:scale-95">
                  Get Started
                </Link>
              </div>
            )}

            {user && (user.role === "DEALER" || user.role === "ADMIN") && (
              <>
                <div className="h-8 w-px bg-slate-100" />
                <Link href="/portal/cars/new" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-900 hover:text-brand transition-colors">
                  <PlusCircle className="w-5 h-5" /> Post Unit
                </Link>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className="lg:hidden">
            <button
              onClick={() => setOpen(!open)}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-0 bg-white z-[200] p-8">
          <div className="flex items-center justify-between mb-10">
            <img src="/logo.png" alt="Motorke" className="h-10 w-auto object-contain" />
            <button onClick={() => setOpen(false)} className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="block text-2xl font-black text-slate-800 py-4 border-b border-slate-100 hover:text-[var(--brand)] transition-colors">
                {label}
              </Link>
            ))}
          </div>
          <div className="absolute bottom-12 left-8 right-8 space-y-3">
            {!user ? (
              <>
                <Link href="/signup" onClick={() => setOpen(false)}
                  className="block py-4 text-center font-black uppercase tracking-widest text-white rounded-2xl bg-[var(--brand)] shadow-lg shadow-[var(--brand)]/10">
                  Get Started
                </Link>
                <Link href="/login" onClick={() => setOpen(false)}
                  className="block py-4 text-center font-black uppercase tracking-widest text-slate-700 bg-slate-100 rounded-2xl">
                  Sign In
                </Link>
              </>
            ) : (
              <Link href="/account" onClick={() => setOpen(false)}
                className="block py-4 text-center font-black uppercase tracking-widest text-white rounded-2xl bg-[var(--brand)] shadow-lg shadow-[var(--brand)]/10">
                My Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MenuDropdownItem({ href, label, icon }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}
