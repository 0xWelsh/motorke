"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search, User, X, Menu, ChevronDown, LogOut, Heart,
  LayoutDashboard, Compass, GitCompare, Calculator, Mail, ChevronRight, Home, Bell, Phone,
} from "lucide-react";
import { clsx } from "clsx";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import NotificationsBell from "@/components/NotificationsBell";

import { trackUiEvent } from "@/lib/analytics";
import { BRAND_HEADER_LOGO } from "@/lib/site-url";
import { BODY_TYPE_LABELS } from "@/lib/constants";
import { PUBLIC_SUPPORT_EMAIL, PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
import { telHrefFromMsisdn } from "@/lib/phone-hints";
import { loadRecentSearches, saveRecentSearch, toRecentSuggestionItems } from "@/lib/recent-searches";

const NAV_TABS = [
  { key: "search", label: "Search Cars", href: "/cars" },
  { key: "about", label: "About Us", href: "/mission" },
  { key: "member", label: "New Member", href: "/login" },
  { key: null, label: "Testimonials", href: "/testimonials", plain: true },
];

const FEATURED_MAKES = [
  "TOYOTA", "NISSAN", "SUBARU", "MAZDA", "HONDA", "MITSUBISHI",
  "BMW", "MERCEDES-BENZ", "ISUZU", "VOLKSWAGEN", "FORD",
];

const SHAPE_KEYS = ["SUV", "SEDAN", "HATCHBACK", "PICKUP", "WAGON", "MINIVAN", "TRUCK", "BUS", "COUPE", "CONVERTIBLE"];

const KENYA_LOCATIONS = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika",
  "Naivasha", "Nyeri", "Meru", "Kericho", "Kakamega", "Machakos",
];

const ABOUT_LINKS = [
  { label: "About BIDGARI", href: "/mission" },
  { label: "How To Buy", href: "/how-to-buy" },
  { label: "Import Duty & Taxes", href: "/duty" },
  { label: "Trust & Inspections", href: "/trust" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Contact Us", href: "/contact" },
  { label: "Help & FAQ", href: "/faq" },
];

const MEMBER_LINKS = [
  { label: "Create Account", href: "/signup" },
  { label: "Login", href: "/login" },
  { label: "Forgot Password", href: "/forgot-password" },
  { label: "Sell With BIDGARI", href: "/sell" },
];

export default function Navbar({ user, navCounts }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showingRecent, setShowingRecent] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const { debouncedTerm } = useDebouncedSearch(search, 300);

  useEffect(() => () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileSearch(false);
    setUserMenu(false);
    setActiveMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open && !activeMenu && !userMenu) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setUserMenu(false);
        setActiveMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeMenu, userMenu]);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const term = (debouncedTerm || "").trim();
    if (term.length < 2) {
      // Empty input on mobile → show previous searches from localStorage.
      if (mobileSearch && !term) {
        const recent = toRecentSuggestionItems(loadRecentSearches());
        setSuggestions(recent);
        setShowingRecent(recent.length > 0);
        setShowSuggestions(recent.length > 0);
      } else {
        setSuggestions([]);
        setShowingRecent(false);
        setShowSuggestions(false);
      }
      return;
    }
    setShowingRecent(false);
    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await fetch(`/api/search/suggestions?query=${encodeURIComponent(term)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.suggestions?.length > 0);
      } catch { setSuggestions([]); setShowSuggestions(false); }
      finally { setLoadingSuggestions(false); }
    };
    fetchSuggestions();
  }, [debouncedTerm, mobileSearch]);

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      saveRecentSearch(trimmed, `search=${encodeURIComponent(trimmed)}`);
      startTransition(() => { router.push(`/cars?search=${encodeURIComponent(trimmed)}`); });
    } else {
      startTransition(() => { router.push("/cars"); });
    }
  }

  function handleSuggestionSelect(value) {
    const v = String(value || "").trim();
    setSearch(v);
    setShowSuggestions(false);
    if (v) {
      saveRecentSearch(v, `search=${encodeURIComponent(v)}`);
      startTransition(() => { router.push(`/cars?search=${encodeURIComponent(v)}`); });
    }
  }

  function showRecentSearches() {
    const recent = toRecentSuggestionItems(loadRecentSearches());
    setSuggestions(recent);
    setShowingRecent(recent.length > 0);
    setShowSuggestions(recent.length > 0);
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/cars", label: "Cars" },
    { href: "/luxury", label: "Luxury" },
    { href: "/kenya", label: "Kenya" },
    { href: "/compare", label: "Compare" },
    { href: "/duty", label: "Duty" },
  ];

  function closeMenus() {
    setOpen(false);
    setUserMenu(false);
    setMobileSearch(false);
    setShowSuggestions(false);
    setShowingRecent(false);
    setActiveMenu(null);
  }

  function navigateTo(href, e) {
    if (e?.metaKey || e?.ctrlKey || e?.shiftKey || e?.altKey || e?.button !== 0) return;
    e?.preventDefault();
    closeMenus();
    if (href === pathname) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    startTransition(() => { router.push(href); });
  }

  function openMenu(name) {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setActiveMenu(name), 120);
  }

  function scheduleClose() {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveMenu(null), 180);
  }

  return (
    <>
      {/* ─── DESKTOP: utility row (logo · search · Kenya time · auth) ─── */}
      <header className="hidden md:block sticky top-0 z-[100] bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="border-b border-slate-200 bg-white">
          <div className="home-shell">
            <div className="flex h-[78px] items-center justify-between gap-6">
              <Link
                href="/"
                onClick={(e) => navigateTo("/", e)}
                className="flex shrink-0 items-center transition-transform active:scale-95"
              >
                <div className="relative h-12 w-[72px] shrink-0 lg:h-14 lg:w-[84px]">
                  <Image
                    src={BRAND_HEADER_LOGO}
                    alt="BIDGARI"
                    fill
                    priority
                    className="object-contain object-left"
                    sizes="84px"
                  />
                </div>
              </Link>

            <div ref={searchRef} className="hidden md:flex min-w-0 flex-1 max-w-[360px]">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search vehicles..."
                  className="h-9 w-full rounded-[4px] border border-slate-300 bg-white pl-8 pr-3 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--accent)]"
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

            <div className="flex shrink-0 items-center gap-3 lg:gap-4">
              <span className="hidden xl:flex items-center gap-3">
                {PUBLIC_SUPPORT_EMAIL && (
                  <a
                    href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
                    className="inline-flex max-w-[170px] items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:text-[var(--accent)]"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    <span className="truncate">{PUBLIC_SUPPORT_EMAIL}</span>
                  </a>
                )}
                {PUBLIC_SUPPORT_PHONE && (
                  <a
                    href={telHrefFromMsisdn(PUBLIC_SUPPORT_PHONE) || "#"}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:text-[var(--accent)]"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    <span>{PUBLIC_SUPPORT_PHONE}</span>
                  </a>
                )}
              </span>
              <Link
                href="/contact"
                onClick={(e) => navigateTo("/contact", e)}
                className="hidden lg:inline text-[12px] font-semibold text-slate-500 transition-colors hover:text-[var(--accent)]"
              >
                Contact
              </Link>
              <KenyaTime />
              {user ? (
                <div className="flex items-center gap-3">
                  <NotificationsBell variant="navbar" />
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenu(!userMenu)}
                      className="flex h-[32px] items-center gap-2 border border-slate-200 bg-slate-50 px-2.5 transition-colors hover:bg-slate-100"
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-slate-200" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold uppercase text-white">
                          {user.name?.[0]}
                        </div>
                      )}
                      <span className="hidden xl:inline text-[13px] font-semibold text-slate-700">{user.name}</span>
                      <ChevronDown className={clsx("h-3 w-3 text-slate-400 transition-transform duration-300", userMenu && "rotate-180")} />
                    </button>

                    {userMenu && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 shadow-glass-lg overflow-hidden rounded-xl">
                        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        </div>
                        <div className="py-1.5">
                          {user.role === "ADMIN" && <MenuDropdownItem href="/admin" label="Dashboard" icon={<LayoutDashboard size={16} />} />}
                          <MenuDropdownItem href="/account" label="Account" icon={<User size={16} />} />
                          <MenuDropdownItem href="/account?tab=saved" label="Watchlist" icon={<Heart size={16} />} />
                          <div className="my-1.5 border-t border-slate-100" />
                          <form action="/api/auth/logout" method="POST">
                            <button type="submit" className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                              <LogOut size={16} /> Sign Out
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/forgot-password"
                    onClick={(e) => navigateTo("/forgot-password", e)}
                    className="hidden lg:inline text-[11px] font-semibold text-slate-400 transition-colors hover:text-[var(--accent)]"
                  >
                    Forgot?
                  </Link>
                  <Link
                    href="/login"
                    onClick={(e) => navigateTo("/login", e)}
                    className="text-[13px] font-bold uppercase tracking-wide text-slate-700 transition-colors hover:text-slate-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={(e) => navigateTo("/signup", e)}
                    className="inline-flex h-[32px] items-center justify-center bg-[linear-gradient(to_bottom,#d92f2f,#b91520)] px-4 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-colors hover:brightness-105"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP: red nav bar with hover menus ─── */}
      <div className="hidden md:block bg-[linear-gradient(to_bottom,#c62a36,#b51422)] shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
        <div className="home-shell">
          <div className="flex h-[30px] items-stretch text-white">
            {NAV_TABS.map((tab) => (
              <DesktopTab
                key={tab.label}
                label={tab.label}
                href={tab.href}
                triangle={!tab.plain}
                active={tab.key ? activeMenu === tab.key : false}
                onHover={tab.key ? () => openMenu(tab.key) : scheduleClose}
                onLeave={tab.key ? scheduleClose : undefined}
                onClick={(e) => navigateTo(tab.href, e)}
              >
                {tab.key === "search" && activeMenu === "search" && (
                  <SearchMegaMenu counts={navCounts || {}} />
                )}
                {tab.key === "about" && activeMenu === "about" && (
                  <MiniDropdown items={ABOUT_LINKS} />
                )}
                {tab.key === "member" && activeMenu === "member" && (
                  <MiniDropdown items={MEMBER_LINKS} />
                )}
              </DesktopTab>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Desktop tagline strip ─── */}
      <div className="hidden md:block border-b border-slate-200 bg-slate-50">
        <div className="home-shell">
          <p className="py-1.5 text-center text-[11px] font-semibold tracking-wide text-slate-500">
            Every car verified. Every sale handled.
          </p>
        </div>
      </div>
      </header>

      {/* ─── MOBILE header ─── */}
      <nav className="md:hidden sticky top-0 z-[100] flex flex-col w-full border-b border-slate-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="w-full px-4">
          <div className="flex items-center justify-between gap-4 min-w-0 h-16">
            <Link
              href="/"
              onClick={(e) => navigateTo("/", e)}
              className="relative z-20 flex shrink-0 items-center transition-transform active:scale-95"
            >
              <div className="relative h-9 w-[54px] shrink-0">
                <Image
                  src={BRAND_HEADER_LOGO}
                  alt="BIDGARI"
                  fill
                  priority
                  className="object-contain object-left"
                  sizes="54px"
                />
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMobileSearch(true)}
                className="w-10 h-10 flex items-center justify-center border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 rounded-xl"
                aria-label="Search vehicles"
              >
                <Search size={20} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !open;
                  setOpen(nextOpen);
                  trackUiEvent(nextOpen ? "mobile_menu_open" : "mobile_menu_close", { source: "navbar" });
                }}
                className="w-10 h-10 flex items-center justify-center border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 rounded-xl"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        <p className="px-4 pb-1.5 -mt-1 text-center text-[10px] font-semibold tracking-wide text-slate-400">
          Every car verified. Every sale handled.
        </p>
      </nav>

      {/* MOBILE SEARCH OVERLAY */}
      {mobileSearch && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl animate-fade-in duration-200">
          <div className="container mx-auto px-6 pt-6">
            <div className="flex items-center justify-between mb-12">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Search Inventory</span>
              <button onClick={() => setMobileSearch(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div ref={mobileSearchRef} className="relative">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--accent)]" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowingRecent(false); }}
                  onFocus={() => {
                    const term = (search || "").trim();
                    if (term.length < 2) showRecentSearches();
                    else if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Type car make or model..."
                  className="w-full h-14 pl-14 pr-6 text-lg font-bold outline-none bg-slate-50 border-b-2 border-slate-200 focus:border-[var(--accent)] text-slate-900 placeholder-slate-400 transition-all rounded-xl"
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
                  header={showingRecent ? "Recent Searches" : null}
                  className="mt-4"
                />
              )}
            </div>

            <div className="mt-12">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Quick Links</p>
              <div className="grid grid-cols-2 gap-3">
                {links.map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMobileSearch(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 text-center hover:bg-slate-100 transition-colors rounded-xl">
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
          className="md:hidden fixed inset-0 z-[200] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          <div
            className="absolute inset-0 z-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="relative z-10 flex max-h-[min(90dvh,38rem)] w-full flex-col overflow-hidden bg-white border-t border-slate-200 shadow-glass-lg animate-slide-up duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-200" aria-hidden />
            <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/"
                  onClick={(e) => navigateTo("/", e)}
                  className="flex min-w-0 shrink-0 items-center"
                >
                  <div className="relative h-9 w-[54px] shrink-0">
                    <Image
                      src={BRAND_HEADER_LOGO}
                      alt="BIDGARI"
                      fill
                      className="object-contain object-left"
                      sizes="54px"
                    />
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              {user ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold uppercase text-white">
                      {user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Signed in</p>
                    <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Verified inventory, transparent costs, and one trusted BIDGARI team.
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2 sm:px-5">
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
                  href="/"
                  onClick={(e) => navigateTo("/", e)}
                  icon={<Home className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Home"
                  analyticsEvent="mobile_menu_home_click"
                />
                <MobileMenuRow
                  href="/compare"
                  onClick={(e) => navigateTo("/compare", e)}
                  icon={<GitCompare className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Compare"
                  analyticsEvent="mobile_menu_compare_click"
                />
                <MobileMenuRow
                  href="/kenya"
                  onClick={(e) => navigateTo("/kenya", e)}
                  icon={<Compass className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Kenya"
                  analyticsEvent="mobile_menu_kenya_click"
                />
                <MobileMenuRow
                  href="/duty"
                  onClick={(e) => navigateTo("/duty", e)}
                  icon={<Calculator className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Duty"
                  analyticsEvent="mobile_menu_duty_click"
                />
                <MobileMenuRow
                  href="/contact"
                  onClick={(e) => navigateTo("/contact", e)}
                  icon={<Mail className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Contact"
                  analyticsEvent="mobile_menu_contact_click"
                />
                <MobileMenuRow
                  href="/testimonials"
                  onClick={(e) => navigateTo("/testimonials", e)}
                  icon={<Heart className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                  label="Testimonials"
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
                    <div className="flex min-h-[3.15rem] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left">
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Bell className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
                        </span>
                        <span className="truncate text-sm font-bold text-slate-800">Notifications</span>
                      </span>
                      <NotificationsBell variant="navbar" />
                    </div>
                    <MobileMenuRow
                      href="/account"
                      onClick={() => setOpen(false)}
                      icon={<User className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                      label="Account settings"
                    />
                    <MobileMenuRow
                      href="/account?tab=saved"
                      onClick={() => setOpen(false)}
                      icon={<Heart className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                      label="Watchlist"
                    />
                  </>
                ) : (
                  <>
                    <MobileMenuRow
                      href="/login"
                      onClick={() => setOpen(false)}
                      icon={<User className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                      label="Login"
                    />
                    <MobileMenuRow
                      href="/signup"
                      onClick={() => setOpen(false)}
                      icon={<Heart className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                      label="Create account"
                    />
                    <MobileMenuRow
                      href="/sell"
                      onClick={() => setOpen(false)}
                      icon={<Calculator className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
                      label="Sell With BIDGARI"
                    />
                  </>
                )}
              </MobileMenuSection>
            </div>

            <div
              className="shrink-0 space-y-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {!user ? (
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary btn-lg w-full"
                >
                  Create account
                </Link>
              ) : (
                <form action="/api/auth/logout" method="POST" className="w-full">
                  <button
                    type="submit"
                    className="btn btn-danger btn-lg w-full"
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

/* ─── Desktop red-nav tab ─── */
function DesktopTab({ label, href, triangle, active, onHover, onLeave, onClick, children }) {
  return (
    <div
      className="relative flex flex-1"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Link
        href={href}
        onClick={onClick}
        className={clsx(
          "relative flex w-full items-center justify-center gap-1.5 px-3 text-[14px] font-medium uppercase tracking-[0.04em] transition-all",
          active
            ? "bg-[linear-gradient(to_bottom,#d83b47,#c51f2d)] text-[#fff4a0]"
            : "hover:bg-[linear-gradient(to_bottom,#d83b47,#c51f2d)] hover:text-[#fff4a0]"
        )}
      >
        {label}
        {triangle && (
          <span
            className="mb-[2px] inline-block h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-current"
            aria-hidden
          />
        )}
      </Link>
      {children}
    </div>
  );
}

/* ─── Live Kenya time ─── */
function KenyaTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      try {
        setTime(new Intl.DateTimeFormat("en-KE", {
          timeZone: "Africa/Nairobi",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()));
      } catch {
        setTime("");
      }
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return (
    <span className="hidden lg:inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
      Kenya Time: <span className="font-bold text-slate-800 tabular-nums">{time}</span>
    </span>
  );
}

/* ─── Search Cars mega menu ─── */
function SearchMegaMenu({ counts }) {
  const makes = counts?.makes || {};
  const bodyTypes = counts?.bodyTypes || {};
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - i);

  const makeList = FEATURED_MAKES.map((m) => {
    const dbKey = Object.keys(makes).find((k) => k.toLowerCase() === m.toLowerCase());
    return {
      label: m,
      href: `/cars?make=${encodeURIComponent(dbKey || m)}`,
      count: dbKey ? makes[dbKey] : 0,
    };
  });

  const shapeList = SHAPE_KEYS.map((v) => ({
    label: BODY_TYPE_LABELS[v] || v,
    href: `/cars?bodyType=${v}`,
    count: bodyTypes[v] || 0,
  }));

  return (
    <div className="absolute left-0 top-full z-[60] w-[950px] max-w-[calc(100vw-2rem)] border border-[#aaa] bg-[#f4f4f4] shadow-[0_5px_12px_rgba(0,0,0,0.25)] rounded-b-[8px]">
      <div className="grid grid-cols-5 divide-x divide-[#d0d0d0]">
        <MegaColumn title="Inventory">
          <MegaLink href="/cars" label="All Vehicles" />
          <MegaLink href="/cars?sort=newest" label="New Arrivals" />
          <MegaLink href="/cars?featured=1" label="Featured Vehicles" />
          <MegaLink href="/cars?sort=price_asc" label="Best Deals" />
          <MegaLink href="/account?tab=saved" label="Saved Vehicles" />
        </MegaColumn>
        <MegaColumn title="Search By Make">
          {makeList.map((m) => (
            <MegaLink key={m.label} href={m.href} label={m.label} count={m.count} />
          ))}
        </MegaColumn>
        <MegaColumn title="Search By Shape">
          {shapeList.map((s) => (
            <MegaLink key={s.href} href={s.href} label={s.label} count={s.count} />
          ))}
        </MegaColumn>
        <MegaColumn title="Search By Year">
          {years.map((y) => (
            <MegaLink key={y} href={`/cars?minYOM=${y}&maxYOM=${y}`} label={String(y)} />
          ))}
        </MegaColumn>
        <MegaColumn title="Locations">
          {KENYA_LOCATIONS.map((c) => (
            <MegaLink key={c} href={`/cars?county=${encodeURIComponent(c)}`} label={c} />
          ))}
          <div className="mt-2 border-t border-[#d0d0d0] pt-2">
            <MegaLink href="/how-to-buy" label="How To Buy" bold />
          </div>
        </MegaColumn>
      </div>
    </div>
  );
}

function MegaColumn({ title, children }) {
  return (
    <div className="px-4 py-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MegaLink({ href, label, count, bold }) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center justify-between gap-2 py-[3px] text-[13px] text-slate-700 transition-colors hover:text-[#b51422]",
        bold && "font-bold"
      )}
    >
      <span className="group-hover:underline">{label}</span>
      {typeof count === "number" && (
        <span className="text-[11px] font-semibold text-slate-400">({count})</span>
      )}
    </Link>
  );
}

/* ─── Compact About Us / New Member dropdown ─── */
function MiniDropdown({ items }) {
  return (
    <div className="absolute left-0 top-full z-[60] w-[210px] border border-[#aaa] bg-[#f4f4f4] shadow-[0_5px_12px_rgba(0,0,0,0.25)] rounded-b-[8px] py-1.5">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="block px-4 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-white hover:text-[#b51422]"
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

function MobileMenuSection({ title, children, className }) {
  return (
    <div className={clsx("mb-5", className)}>
      {title ? (
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </p>
      ) : null}
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function MobileMenuRow({ icon, label, href, onClick, variant = "default", analyticsEvent }) {
  const primary = variant === "primary";
  const rowClass = clsx(
    "flex w-full min-h-[3.15rem] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99]",
    primary
      ? "border-[var(--accent)]/25 bg-[var(--accent)]/[0.06]"
      : "border-slate-200 bg-white hover:bg-slate-50"
  );
  const iconWrap = clsx(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
    primary
      ? "bg-[var(--accent)]/[0.1] text-[var(--accent)]"
      : "bg-slate-100 text-slate-500"
  );
  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className={iconWrap}>{icon}</span>
        <span className="truncate text-sm font-bold text-slate-800">{label}</span>
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
    <Link href={href} className="flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors rounded-lg mx-1.5">
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}
