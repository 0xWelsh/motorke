"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, User, Menu, X, ChevronDown, LogOut, Heart,
  LayoutDashboard, Store, PlusCircle, ShieldCheck, Compass
} from "lucide-react";
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
    { href: "/cars",    label: "Inventory", icon: <Store className="w-3.5 h-3.5" /> },
    { href: "/dealers", label: "Dealers",   icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { href: "/compare", label: "Compare",   icon: <Compass className="w-3.5 h-3.5" /> },
  ];

  return (
    <nav className={clsx(
      "sticky top-0 z-[100] transition-all duration-300",
      scrolled
        ? "bg-white/90 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm"
        : "bg-white border-b border-slate-100 py-4"
    )}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between gap-8">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm bg-[var(--brand)]">
              <span className="text-white font-black text-lg tracking-tighter">M</span>
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tighter">
              Motor<span className="text-[var(--brand-accent)]">ke</span>
            </span>
          </Link>

          {/* NAV LINKS */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
                <span className="text-slate-300">{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          {/* SEARCH */}
          <div ref={searchRef} className="hidden xl:flex flex-1 max-w-sm relative group">
            <form onSubmit={handleSearch} className="w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" style={{"--tw-text-opacity":1}} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                placeholder="Search cars..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-400 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium outline-none transition-all placeholder:text-slate-400 text-slate-900"
                style={{"--focus-border":"#0891b2"}}
              />
            </form>
            {showSuggestions && (
              <SearchSuggestions
                suggestions={suggestions}
                loading={loadingSuggestions}
                onSelect={handleSuggestionSelect}
                inputValue={search}
                className="mt-2"
              />
            )}
          </div>

          {/* USER ACTIONS */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 pl-2 pr-4 py-2 rounded-xl hover:border-slate-300 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs uppercase text-white bg-[var(--brand)]">
                    {user.name?.[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{user.name?.split(" ")[0]}</span>
                  <ChevronDown className={clsx("w-3 h-3 text-slate-400 transition-transform duration-300", userMenu && "rotate-180")} />
                </button>

                {userMenu && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-2">
                    <div className="px-4 py-3 bg-slate-50 rounded-xl mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                    </div>
                    <div className="space-y-0.5">
                      {user.role === "ADMIN"  && <MenuDropdownItem href="/admin"   label="Administration"  icon={<LayoutDashboard className="w-4 h-4" />} />}
                      {user.role === "DEALER" && <MenuDropdownItem href="/portal"  label="Dealer Portal"   icon={<Store className="w-4 h-4" />} />}
                      <MenuDropdownItem href="/account" label="Profile Settings" icon={<User className="w-4 h-4" />} />
                      <MenuDropdownItem href="/saved"   label="Watchlist"        icon={<Heart className="w-4 h-4" />} />
                      <div className="my-1 h-px bg-slate-100 mx-3" />
                      <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-white px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:bg-[var(--brand)] bg-[var(--brand-accent)] shadow-sm shadow-[var(--brand-accent)]/10">
                  Get Started
                </Link>
              </div>
            )}

            {user && (user.role === "DEALER" || user.role === "ADMIN") && (
              <>
                <div className="h-5 w-px bg-slate-200" />
                <Link href="/portal/cars/new" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                  <PlusCircle className="w-4 h-4" /> Post Unit
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
            <span className="text-xl font-black text-slate-900">Motor<span className="text-[var(--brand-accent)]">ke</span></span>
            <button onClick={() => setOpen(false)} className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="block text-2xl font-black text-slate-800 py-3 border-b border-slate-100 hover:text-cyan-600 transition-colors"
                style={{"--hover-color":"#0891b2"}}>
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
                className="block py-4 text-center font-black uppercase tracking-widest text-white rounded-2xl"
                style={{background:"#0891b2"}}>
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
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
      <span className="text-slate-300">{icon}</span>
      {label}
    </Link>
  );
}
