"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, User, Menu, X, ChevronDown, LogOut, Heart,
  LayoutDashboard, Store, PlusCircle, ShieldCheck, Compass,
  ArrowUpRight, Bell, Settings, BarChart2, Shield,
  CarFront, GitCompare
} from "lucide-react";
import { clsx } from "clsx";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar({ user }) {
  const router    = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [open,      setOpen]      = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef   = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const { debouncedTerm } = useDebouncedSearch(search, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    // Standard effect for clicking outside
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

  // Logic to determine which logo to show
  const activeLogo = (mounted && theme === "dark") ? "/logos/logo-dark.png" : "/logos/logo-light.png";

  return (
    <>
      <nav className="fixed top-0 z-50 w-full flex items-center h-16 md:h-20 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-zinc-900 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between gap-8 h-full">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 shrink-0 transition-transform active:scale-95">
              <div className="relative h-8 md:h-10 w-32 md:w-40">
                <Image
                  src={activeLogo}
                  alt="Motorske"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* NAV LINKS (Desktop) */}
            <div className="hidden lg:flex items-center gap-6">
              {links.map(({ href, label }) => (
                <Link key={href} href={href}
                  className="text-[13px] font-bold uppercase tracking-widest text-slate-900 dark:text-white transition-all hover:opacity-70">
                  {label}
                </Link>
              ))}
              <Link href="/contact" 
                className="px-6 py-2 text-[13px] font-bold uppercase tracking-widest border border-slate-900 dark:border-white text-slate-900 dark:text-white transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:!text-[#0a0a0a]"
                style={{ borderRadius: 'var(--radius)' }}>
                Contact
              </Link>
            </div>

            {/* SEARCH (Minimalist) */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-sm relative group">
              <form onSubmit={handleSearch} className="w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search vehicles..."
                  className="w-full h-11 pl-11 pr-5 text-sm font-medium outline-none transition-all bg-[#EDF2F7] dark:bg-zinc-900 focus:bg-white dark:focus:bg-black border border-transparent focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white"
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
                      className="flex items-center gap-3 h-11 px-3 transition-all bg-[#EDF2F7] dark:bg-zinc-900 hover:bg-[#E2E8F0] dark:hover:bg-zinc-800"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 object-cover rounded-full" />
                      ) : (
                        <div className="w-7 h-7 flex items-center justify-center font-bold text-[10px] uppercase text-white bg-[#38A169] rounded-full">
                          {user.name?.[0]}
                        </div>
                      )}
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Menu
                      </span>
                      <ChevronDown className={clsx("w-3 h-3 transition-transform duration-300", userMenu && "rotate-180", "text-gray-400")} />
                    </button>

                    {userMenu && (
                      <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2" style={{ borderRadius: 'var(--radius)' }}>
                        <div className="px-5 py-4 bg-[#F7FAFC] dark:bg-black border-b border-gray-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Signed in as</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        </div>
                        <div className="py-2">
                          {user.role === "ADMIN"  && <MenuDropdownItem href="/admin" label="Dashboard" icon={<LayoutDashboard size={18} />} />}
                          {user.role === "DEALER" && <MenuDropdownItem href="/portal" label="Portal" icon={<Store size={18} />} />}
                          <MenuDropdownItem href="/account" label="Account" icon={<User size={18} />} />
                          <MenuDropdownItem href="/account?tab=saved" label="Watchlist" icon={<Heart size={18} />} />
                          <div className="my-2 border-t border-gray-50 dark:border-zinc-800" />
                          <form action="/api/auth/logout" method="POST">
                            <button type="submit" className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
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
                  <Link href="/login" className="text-sm font-bold text-slate-900 dark:text-white transition-opacity hover:opacity-70">
                    Sign In
                  </Link>
                  <Link href="/signup" 
                    className="h-10 px-5 flex items-center justify-center text-xs font-bold uppercase tracking-widest bg-[#38A169] text-white hover:opacity-90 transition-all active:scale-95"
                    style={{ borderRadius: 'var(--radius)' }}>
                    Join
                  </Link>
                </div>
              )}

              {/* MOBILE ACTIONS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileSearch(!mobileSearch)}
                  className="lg:hidden w-11 h-11 flex items-center justify-center transition-all bg-[#EDF2F7] dark:bg-zinc-900 text-slate-900 dark:text-white"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <Search size={20} />
                </button>

                <button
                  onClick={() => setOpen(!open)}
                  className="lg:hidden w-11 h-11 flex items-center justify-center transition-all bg-[#EDF2F7] dark:bg-zinc-900 text-slate-900 dark:text-white"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {open ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE SEARCH OVERLAY */}
      {mobileSearch && (
        <div className="fixed inset-0 z-[200] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="container mx-auto px-6 pt-6">
            <div className="flex items-center justify-between mb-12">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38A169]">Search Inventory</span>
              <button onClick={() => setMobileSearch(false)} className="w-10 h-10 flex items-center justify-center bg-[#EDF2F7] dark:bg-zinc-900 text-slate-900 dark:text-white" style={{ borderRadius: 'var(--radius)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div ref={mobileSearchRef} className="relative">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#38A169]" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                  placeholder="Type car make or model..."
                  className="w-full h-16 pl-16 pr-6 text-lg font-bold outline-none bg-[#EDF2F7] dark:bg-zinc-900 border-b-2 border-transparent focus:border-[#38A169] text-slate-900 dark:text-white transition-all"
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </form>
              {showSuggestions && (
                <SearchSuggestions
                  suggestions={suggestions}
                  loading={loadingSuggestions}
                  onSelect={(val) => {
                    handleSuggestionSelect(val);
                    setMobileSearch(false);
                  }}
                  inputValue={search}
                  className="mt-4"
                />
              )}
            </div>

            <div className="mt-12">
               <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-6">Quick Links</p>
               <div className="grid grid-cols-2 gap-4">
                  {links.map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setMobileSearch(false)} className="px-6 py-4 bg-[#F7FAFC] dark:bg-zinc-900 text-sm font-bold text-slate-900 dark:text-white text-center" style={{ borderRadius: 'var(--radius)' }}>
                      {label}
                    </Link>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[200] bg-[#1A202C]/40 backdrop-blur-md animate-in fade-in" onClick={() => setOpen(false)}>
          <div className="ml-auto h-full w-full max-w-xs bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-12">
              <div className="relative h-8 w-28">
                <Image
                  src={activeLogo}
                  alt="Motorske"
                  fill
                  className="object-contain"
                />
              </div>
              <button onClick={() => setOpen(false)} className="text-[#718096] hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="flex flex-col gap-6 mb-12">
              {links.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-white hover:text-[#38A169] transition-colors">
                  {label}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setOpen(false)}
                className="text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-white hover:text-[#38A169] transition-colors">
                Contact
              </Link>
            </div>
            
            <div className="mb-12 pt-8 border-t border-gray-100 dark:border-zinc-800">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Appearance</span>
                  <ThemeToggle simple />
               </div>
            </div>

            <div className="mt-auto space-y-4">
              {!user ? (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="block w-full py-4 text-center text-sm font-bold uppercase tracking-widest border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:!text-[#0a0a0a] transition-all"
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
                  className="block w-full py-4 text-center text-sm font-bold uppercase tracking-widest bg-[#EDF2F7] dark:bg-zinc-900 text-slate-900 dark:text-white hover:bg-[#E2E8F0] dark:hover:bg-zinc-800 transition-all"
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
    <Link href={href} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-900 dark:text-white hover:bg-[#EDF2F7] dark:hover:bg-zinc-800 transition-all">
      <span className="text-[#718096]">{icon}</span>
      {label}
    </Link>
  );
}
