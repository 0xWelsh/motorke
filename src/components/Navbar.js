"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, User, Menu, X, ChevronDown, LogOut, Heart,
  LayoutDashboard, Store, PlusCircle, ShieldCheck, Compass,
  ArrowUpRight, Bell, Settings, BarChart2, Shield,
  CarFront, BadgeCheck, GitCompare
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
    { href: "/cars",    label: "Cars" },
    { href: "/dealers", label: "Dealers" },
    { href: "/compare", label: "Compare" },
  ];

  return (
    <>
      <nav className={clsx(
        "fixed top-0 z-50 transition-all duration-300 w-full flex items-center h-16 md:h-20",
        scrolled
          ? "bg-white border-b border-gray-100 shadow-sm"
          : "bg-transparent text-white"
      )}>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between gap-8 h-full">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 shrink-0 transition-transform active:scale-95">
               <span className={clsx(
                 "text-xl md:text-2xl font-bold tracking-tight uppercase",
                 scrolled ? "text-[#1A202C]" : "text-white"
               )}>
                 MOTOR<span className="text-[#38A169]">SKE</span>
               </span>
            </Link>

            {/* NAV LINKS (Desktop) */}
            <div className="hidden lg:flex items-center gap-6">
              {links.map(({ href, label }) => (
                <Link key={href} href={href}
                  className={clsx(
                    "text-[13px] font-bold uppercase tracking-widest transition-all hover:opacity-70",
                    scrolled ? "text-[#1A202C]" : "text-white"
                  )}>
                  {label}
                </Link>
              ))}
              <Link href="/contact" 
                className={clsx(
                  "px-6 py-2 text-[13px] font-bold uppercase tracking-widest border transition-all hover:scale-[0.98]",
                  scrolled 
                    ? "border-[#1A202C] text-[#1A202C] hover:bg-[#1A202C] hover:text-white" 
                    : "border-white text-white hover:bg-white hover:text-[#1A202C]"
                )}
                style={{ borderRadius: 'var(--radius)' }}>
                Contact
              </Link>
            </div>

            {/* SEARCH (Minimalist) */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-sm relative group">
              <form onSubmit={handleSearch} className="w-full relative">
                <Search className={clsx(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  scrolled ? "text-[#718096]" : "text-white/70"
                )} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search vehicles..."
                  className={clsx(
                    "w-full h-11 pl-11 pr-5 text-sm font-medium outline-none transition-all",
                    scrolled 
                      ? "bg-[#EDF2F7] focus:bg-white border focus:border-[#1A202C]" 
                      : "bg-white/10 backdrop-blur-md border border-white/20 focus:bg-white/20 text-white placeholder:text-white/60"
                  )}
                  style={{ borderRadius: 'var(--radius)' }}
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

            {/* ACTIONS */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:block">
                 <ThemeToggle simple />
              </div>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <NotificationsBell variant="navbar" />
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setUserMenu(!userMenu)}
                      className={clsx(
                        "flex items-center gap-3 h-11 px-3 transition-all",
                        scrolled ? "bg-[#EDF2F7] hover:bg-[#E2E8F0]" : "bg-white/10 hover:bg-white/20"
                      )}
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 object-cover rounded-full" />
                      ) : (
                        <div className="w-7 h-7 flex items-center justify-center font-bold text-[10px] uppercase text-white bg-[#38A169] rounded-full">
                          {user.name?.[0]}
                        </div>
                      )}
                      <span className={clsx("text-sm font-bold", scrolled ? "text-[#1A202C]" : "text-white")}>
                        Menu
                      </span>
                      <ChevronDown className={clsx("w-3 h-3 transition-transform duration-300", userMenu && "rotate-180", scrolled ? "text-gray-400" : "text-white/60")} />
                    </button>

                    {userMenu && (
                      <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2" style={{ borderRadius: 'var(--radius)' }}>
                        <div className="px-5 py-4 bg-[#F7FAFC] border-b border-gray-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Signed in as</p>
                          <p className="text-sm font-bold text-[#1A202C] truncate">{user.name}</p>
                        </div>
                        <div className="py-2">
                          {user.role === "ADMIN"  && <MenuDropdownItem href="/admin" label="Dashboard" icon={<LayoutDashboard size={18} />} />}
                          {user.role === "DEALER" && <MenuDropdownItem href="/portal" label="Portal" icon={<Store size={18} />} />}
                          <MenuDropdownItem href="/account" label="Account" icon={<User size={18} />} />
                          <MenuDropdownItem href="/account?tab=saved" label="Watchlist" icon={<Heart size={18} />} />
                          <div className="my-2 border-t border-gray-50" />
                          <form action="/api/auth/logout" method="POST">
                            <button type="submit" className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors">
                              <LogOut size={18} /> Sign Out
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className={clsx("text-sm font-bold transition-opacity hover:opacity-70", scrolled ? "text-[#1A202C]" : "text-white")}>
                    Sign In
                  </Link>
                  <Link href="/signup" 
                    className="h-10 px-5 flex items-center justify-center text-xs font-bold uppercase tracking-widest bg-[#38A169] text-white hover:opacity-90 transition-all active:scale-95"
                    style={{ borderRadius: 'var(--radius)' }}>
                    Join
                  </Link>
                </div>
              )}

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setOpen(!open)}
                className={clsx(
                  "lg:hidden w-11 h-11 flex items-center justify-center transition-all",
                  scrolled ? "bg-[#EDF2F7] text-[#1A202C]" : "bg-white/10 text-white"
                )}
                style={{ borderRadius: 'var(--radius)' }}
              >
                {open ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[200] bg-[#1A202C]/40 backdrop-blur-sm animate-in fade-in" onClick={() => setOpen(false)}>
          <div className="ml-auto h-full w-full max-w-xs bg-white p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-12">
              <span className="text-xl font-bold tracking-tight uppercase text-[#1A202C]">
                 MOTOR<span className="text-[#38A169]">SKE</span>
              </span>
              <button onClick={() => setOpen(false)} className="text-[#718096] hover:text-[#1A202C] transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="flex flex-col gap-6 mb-12">
              {links.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="text-lg font-bold uppercase tracking-widest text-[#1A202C] hover:text-[#38A169] transition-colors">
                  {label}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setOpen(false)}
                className="text-lg font-bold uppercase tracking-widest text-[#1A202C] hover:text-[#38A169] transition-colors">
                Contact
              </Link>
            </div>

            <div className="mt-auto space-y-4">
              {!user ? (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="block w-full py-4 text-center text-sm font-bold uppercase tracking-widest border border-[#1A202C] text-[#1A202C] hover:bg-[#1A202C] hover:text-white transition-all"
                    style={{ borderRadius: 'var(--radius)' }}>
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}
                    className="block w-full py-4 text-center text-sm font-bold uppercase tracking-widest bg-[#38A169] text-white hover:opacity-90 transition-all"
                    style={{ borderRadius: 'var(--radius)' }}>
                    Join Now
                  </Link>
                </>
              ) : (
                <Link href="/account" onClick={() => setOpen(false)}
                  className="block w-full py-4 text-center text-sm font-bold uppercase tracking-widest bg-[#EDF2F7] text-[#1A202C] hover:bg-[#E2E8F0] transition-all"
                  style={{ borderRadius: 'var(--radius)' }}>
                  My Account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuDropdownItem({ href, label, icon }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-[#1A202C] hover:bg-[#EDF2F7] transition-all">
      <span className="text-[#718096]">{icon}</span>
      {label}
    </Link>
  );
}
