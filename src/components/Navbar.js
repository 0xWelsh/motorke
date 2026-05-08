"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search, User, Menu, X, ChevronDown, LogOut, Heart,
  LayoutDashboard, Store, PlusCircle, ShieldCheck, Compass,
  ArrowUpRight, Bell, Settings, BarChart2, Shield,
  CarFront, GitCompare, Mail, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";
import { trackUiEvent } from "@/lib/analytics";
import { BRAND_HEADER_LOGO } from "@/lib/site-url";

export default function Navbar({ user }) {
  const router    = useRouter();

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
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  return (
    <>
      <nav className="sticky top-0 z-[70] w-full flex items-center h-16 md:h-20 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-zinc-900 shadow-sm transition-colors duration-300">
        <div className="w-full px-6 md:px-12">
          <div className="flex items-center justify-between gap-8 h-full">

            {/* LOGO — horizontal wordmark (not the favicon mark) */}
            <Link href="/" className="flex shrink-0 items-center transition-transform active:scale-95">
              <div className="relative h-12 w-52 shrink-0 md:h-14 md:w-72 lg:h-16 lg:w-80">
                <Image
                  src={BRAND_HEADER_LOGO}
                  alt="Welsh Motorhub"
                  fill
                  className="object-contain object-left invert dark:invert-0"
                  priority
                  sizes="(max-width: 768px) 208px, 320px"
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

            {/* ACTIONS (Desktop) */}
            <div className="hidden lg:flex items-center gap-4">
              <ThemeToggle simple />
              
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
                          <MenuDropdownItem
                            href={user.role === "DEALER" ? "/portal/profile" : "/account"}
                            label="Account"
                            icon={<User size={18} />}
                          />
                          {user.role !== "DEALER" && (
                            <MenuDropdownItem href="/account?tab=saved" label="Watchlist" icon={<Heart size={18} />} />
                          )}
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
            </div>

            {/* MOBILE ACTIONS */}
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <div className="inline-flex items-center justify-center w-10 h-10 border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                <ThemeToggle simple />
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextOpen = !open;
                  setOpen(nextOpen);
                  trackUiEvent(nextOpen ? "mobile_menu_open" : "mobile_menu_close", { source: "navbar" });
                }}
                className="w-10 h-10 flex items-center justify-center border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95"
                style={{ borderRadius: 'var(--radius)' }}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X size={22} /> : <Menu size={22} strokeWidth={2.25} />}
              </button>
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

      {/* MOBILE MENU — bottom sheet */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-[200] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          <div
            className="absolute inset-0 z-0 bg-black/45 backdrop-blur-[3px] animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="relative z-10 flex max-h-[min(90dvh,38rem)] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200/90 bg-white/98 shadow-2xl dark:border-zinc-800 dark:bg-[#0a0a0a]/98 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-slate-600" aria-hidden />
            <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-2 dark:border-zinc-800 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex min-w-0 shrink-0 items-center"
                >
                  <div className="relative h-10 w-44 shrink-0 sm:h-11 sm:w-52">
                    <Image
                      src={BRAND_HEADER_LOGO}
                      alt="Welsh Motorhub"
                      fill
                      className="object-contain object-left invert dark:invert-0"
                      sizes="(max-width: 640px) 176px, 208px"
                    />
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
              {user ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 dark:border-zinc-800 dark:bg-zinc-900/80">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#38A169] text-sm font-bold uppercase text-white">
                      {user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Signed in</p>
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Verified inventory, TCO context, and side-by-side compare in one app.
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-1 sm:px-5">
              <MobileMenuSection title="Explore">
                <MobileMenuRow
                  variant="primary"
                  icon={<Search className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.25} />}
                  label="Search vehicles"
                  analyticsEvent="mobile_menu_search_vehicles_click"
                  onClick={() => {
                    setOpen(false);
                    setMobileSearch(true);
                  }}
                />
                <MobileMenuRow
                  href="/cars"
                  onClick={() => setOpen(false)}
                  icon={<CarFront className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Cars"
                  analyticsEvent="mobile_menu_cars_click"
                />
                <MobileMenuRow
                  href="/dealers"
                  onClick={() => setOpen(false)}
                  icon={<Store className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Dealers"
                  analyticsEvent="mobile_menu_dealers_click"
                />
                <MobileMenuRow
                  href="/compare"
                  onClick={() => setOpen(false)}
                  icon={<GitCompare className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Compare"
                  analyticsEvent="mobile_menu_compare_click"
                />
                <MobileMenuRow
                  href="/contact"
                  onClick={() => setOpen(false)}
                  icon={<Mail className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Contact"
                  analyticsEvent="mobile_menu_contact_click"
                />
              </MobileMenuSection>

              <MobileMenuSection title="Account" className="pt-1">
                {user ? (
                  <>
                    {user.role === "ADMIN" && (
                      <MobileMenuRow
                        href="/admin"
                        onClick={() => setOpen(false)}
                        icon={<LayoutDashboard className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                        label="Dashboard"
                      />
                    )}
                    {user.role === "DEALER" && (
                      <MobileMenuRow
                        href="/portal"
                        onClick={() => setOpen(false)}
                        icon={<Store className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                        label="Dealer portal"
                      />
                    )}
                    <div className="flex min-h-[3.15rem] items-center justify-between gap-3 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                      <NotificationsBell variant="navbar" />
                    </div>
                    <MobileMenuRow
                      href={user.role === "DEALER" ? "/portal/profile" : "/account"}
                      onClick={() => setOpen(false)}
                      icon={<User className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                      label="Account settings"
                    />
                    {user.role !== "DEALER" && (
                      <MobileMenuRow
                        href="/account?tab=saved"
                        onClick={() => setOpen(false)}
                        icon={<Heart className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                        label="Watchlist"
                      />
                    )}
                  </>
                ) : (
                  <MobileMenuRow
                    href="/login"
                    onClick={() => setOpen(false)}
                    icon={<User className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                    label="Sign in"
                  />
                )}
              </MobileMenuSection>
            </div>

            <div
              className="shrink-0 space-y-3 border-t border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:px-5"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {!user ? (
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex h-12 w-full items-center justify-center text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:opacity-90 active:scale-[0.99] bg-[#38A169]"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  Create account
                </Link>
              ) : (
                <form action="/api/auth/logout" method="POST" className="w-full">
                  <button
                    type="submit"
                    className="h-12 w-full text-center text-xs font-bold uppercase tracking-[0.2em] text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/50 dark:border-rose-500/40"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    Sign out
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileMenuSection({ title, children, className }) {
  return (
    <div className={clsx("mb-5", className)}>
      {title ? (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
          {title}
        </p>
      ) : null}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MobileMenuRow({ icon, label, href, onClick, variant = "default", analyticsEvent }) {
  const primary = variant === "primary";
  const rowClass = clsx(
    "flex w-full min-h-[3.15rem] items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition active:scale-[0.99]",
    primary
      ? "border-[#38A169]/35 bg-[#38A169]/6 dark:border-[#38A169]/25 dark:bg-[#38A169]/10"
      : "border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900/35"
  );
  const iconWrap = clsx(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
    primary
      ? "bg-white text-[#2F855A] shadow-sm dark:bg-black/25 dark:text-[#38A169]"
      : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200"
  );
  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className={iconWrap}>{icon}</span>
        <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        onClick={(event) => {
          if (analyticsEvent) trackUiEvent(analyticsEvent, { location: "mobile_menu" });
          onClick?.(event);
        }}
        className={rowClass}
      >
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={(event) => {
        if (analyticsEvent) trackUiEvent(analyticsEvent, { location: "mobile_menu" });
        onClick?.(event);
      }}
      className={rowClass}
    >
      {body}
    </button>
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
