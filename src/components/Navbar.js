"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, User, Menu, X, ChevronDown, LogOut, Heart,
  LayoutDashboard, Store, PlusCircle, ShieldCheck, Compass,
  ArrowUpRight, Bell, Settings, BarChart2, Shield
} from "lucide-react";
import { clsx } from "clsx";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";

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
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
    { href: "/cars",    label: "Cars", icon: <Store className="w-4 h-4" /> },
    { href: "/dealers", label: "Dealers",   icon: <ShieldCheck className="w-4 h-4" /> },
    { href: "/compare", label: "Compare",   icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <nav className={clsx(
      "sticky top-0 z-[100] transition-all duration-300 w-full",
      scrolled
        ? "bg-white/95 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm"
        : "bg-transparent py-5"
    )}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4 sm:gap-8">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group transition-transform active:scale-95">
            <img src="/headerlogo.png" alt="Motorke Digital Showroom" className="h-10 sm:h-12 object-contain" />
          </Link>

          {/* NAV LINKS */}
          <div className="hidden lg:flex items-center gap-5 border-b border-slate-200 pb-2">
            {links.map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-slate-700 hover:text-black transition-all">
                <span className="text-slate-400">{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          {/* SEARCH */}
          <div ref={searchRef} className="hidden xl:flex flex-1 max-w-md relative group">
            <form onSubmit={handleSearch} className="w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                placeholder="Search cars, e.g. Prado, X5, CX-5"
                className="w-full bg-white border border-slate-200 focus:border-[#ff5a2f]/40 focus:bg-white focus:ring-4 focus:ring-[#ff5a2f]/10 rounded-xl py-3 pl-12 pr-6 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 text-slate-900"
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
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-4">
                <NotificationsBell variant="navbar" />
                <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-3 bg-white border border-[#ddd4c8] pl-2 pr-5 py-2 rounded-none hover:border-slate-900 transition-none"
                >
                  <div className="w-9 h-9 rounded-none flex items-center justify-center font-black text-sm uppercase text-white bg-[#ff5a2f]">
                    {user.name?.[0]}
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">{user.name?.split(" ")[0]}</span>
                  <ChevronDown className={clsx("w-4 h-4 text-slate-400 transition-transform duration-500", userMenu && "rotate-180")} />
                </button>

                {userMenu && (
                  <div className="absolute right-0 top-full mt-4 w-72 bg-white border border-[#ddd4c8] rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden p-0 animate-in fade-in slide-in-from-top-2">
                    <div className="px-5 py-5 bg-[#f7f6f3] border-b border-[#ddd4c8] mb-0 rounded-none">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Signed in</p>
                      <p className="text-sm font-black text-slate-900 truncate">{user.email}</p>
                    </div>
                    <div className="space-y-0 divide-y divide-[#ddd4c8]">
                      {user.role === "ADMIN"  && <MenuDropdownItem href="/admin"   label="Administration"  icon={<LayoutDashboard className="w-5 h-5" />} />}
                      {user.role === "DEALER" && <MenuDropdownItem href="/portal"  label="Dealer Portal"   icon={<Store className="w-5 h-5" />} />}
                      <MenuDropdownItem href="/account" label="Profile Settings" icon={<User className="w-5 h-5" />} />
                      <MenuDropdownItem href="/account?tab=saved"   label="Watchlist"        icon={<Heart className="w-5 h-5" />} />
                      <div className="hidden" />
                      <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="w-full flex items-center gap-4 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-[#ff5a2f] hover:bg-[#111111] hover:text-white rounded-none transition-none">
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
                <Link href="/login" className="text-sm font-extrabold text-slate-900 hover:text-black transition-colors px-4">
                  Sign In
                </Link>
                <Link href="/signup" className="mk-pill-btn text-white px-6 py-3 text-xs uppercase transition-all bg-[#111111] hover:bg-[#ff5a2f] active:scale-95 inline-flex items-center gap-2">
                  For Dealers <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {user && (user.role === "DEALER" || user.role === "ADMIN") && (
              <>
                <div className="h-8 w-px bg-[#e5ddd2]" />
                <Link href="/portal/cars/new" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-900 hover:text-[#ff5a2f] transition-colors">
                  <PlusCircle className="w-5 h-5" /> Post Unit
                </Link>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="w-11 h-11 flex items-center justify-center bg-white border border-[#e7e1d8] text-slate-700 rounded-none hover:bg-[#faf7f2] transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[200] bg-black/30" onClick={() => setOpen(false)}>
          <div className="ml-auto h-full w-full max-w-sm bg-[#f5f3ef] border-l border-[#e7e1d8] p-5 sm:p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center gap-2.5">
                <img src="/headerlogo.png" alt="Motorke Digital Showroom" className="h-10 object-contain" />
                <div className="flex flex-col">
                  <span className="inline-flex items-center">
                    <span className="text-[16px] leading-none font-black uppercase tracking-[0.16em] text-slate-900">MOTOR</span>
                    <span className="text-[16px] leading-none font-black uppercase tracking-[0.16em] text-[#ff5a2f]">KE</span>
                  </span>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-600 mt-1 leading-none">
                    Digital Showroom
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-10 h-10 bg-white border border-[#e7e1d8] text-slate-700 rounded-xl flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { handleSearch(e); setOpen(false); }} className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search cars"
                  className="w-full bg-white border border-[#e7e1d8] rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold outline-none"
                />
              </div>
            </form>

            <div className="space-y-1 mb-6">
              {links.map(({ href, label, icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 text-lg font-black text-slate-800 py-3 px-2 border-b border-[#e7e1d8] hover:text-black transition-colors">
                  <span className="text-slate-400">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>

            {/* Help & Resources */}
            <div className="px-2 py-4 border-b border-[#e7e1d8] mb-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mb-3">Help & Resources</p>
              <div className="space-y-2">
                <Link href="/faq" onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  FAQ
                </Link>
                <Link href="/mission" onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  Our Mission
                </Link>
                <Link href="/contact" onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  Contact Support
                </Link>
              </div>
            </div>

            {user && (
              <div className="rounded-2xl border border-[#e7e1d8] bg-white p-4 mb-6">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mb-2">Signed in</p>
                <p className="text-sm font-bold text-slate-900 mb-4 truncate">{user.email}</p>
                <div className="space-y-2">
                  {user.role === "BUYER" && (
                    <Link href="/account?tab=enquiries" onClick={() => setOpen(false)} 
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-[0.08em] transition-colors">
                      <Bell size={16} className="flex-shrink-0" />
                      <span>Enquiry Alerts</span>
                    </Link>
                  )}
                  {user.role === "DEALER" && (
                    <Link href="/portal/leads" onClick={() => setOpen(false)} 
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-extrabold uppercase tracking-[0.08em] transition-colors">
                      <Bell size={16} className="flex-shrink-0" />
                      <span>Lead Alerts</span>
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link href="/admin/leads" onClick={() => setOpen(false)} 
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-extrabold uppercase tracking-[0.08em] transition-colors">
                      <Bell size={16} className="flex-shrink-0" />
                      <span>Lead Alerts</span>
                    </Link>
                  )}
                  <Link href="/account" onClick={() => setOpen(false)} 
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-extrabold uppercase tracking-[0.08em] transition-colors">
                    <Settings size={16} className="flex-shrink-0" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link href="/account?tab=saved" onClick={() => setOpen(false)} 
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-extrabold uppercase tracking-[0.08em] transition-colors">
                    <Heart size={16} className="flex-shrink-0" />
                    <span>Watchlist</span>
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setOpen(false)} 
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-extrabold uppercase tracking-[0.08em] transition-colors">
                      <Shield size={16} className="flex-shrink-0" />
                      <span>Administration</span>
                    </Link>
                  )}
                  {user.role === "DEALER" && (
                    <Link href="/portal" onClick={() => setOpen(false)} 
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-extrabold uppercase tracking-[0.08em] transition-colors">
                      <Store size={16} className="flex-shrink-0" />
                      <span>Dealer Portal</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 pb-4 border-t border-[#e7e1d8] pt-4">
              {!user ? (
                <>
                  <Link href="/signup" onClick={() => setOpen(false)}
                    className="block py-3.5 text-center font-black uppercase tracking-widest text-white rounded-xl bg-[#111111] hover:bg-black transition-colors">
                    For Dealers
                  </Link>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="block py-3.5 text-center font-black uppercase tracking-widest text-slate-700 bg-white border border-[#e7e1d8] rounded-xl hover:bg-slate-50 transition-colors">
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  {(user.role === "DEALER" || user.role === "ADMIN") && (
                    <Link href="/portal/cars/new" onClick={() => setOpen(false)}
                      className="block py-3.5 text-center font-black uppercase tracking-widest text-white rounded-xl bg-[#111111] hover:bg-black transition-colors">
                      Post Unit
                    </Link>
                  )}
                  <form action="/api/auth/logout" method="POST">
                    <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 text-center font-black uppercase tracking-widest text-rose-600 bg-white border border-rose-300 hover:bg-rose-50 rounded-xl transition-colors">
                      <LogOut size={18} strokeWidth={2.5} />
                      <span>Sign Out</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function MenuDropdownItem({ href, label, icon }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 hover:bg-[#fbfcfe] hover:text-[#ff5a2f] rounded-none transition-none">
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}
