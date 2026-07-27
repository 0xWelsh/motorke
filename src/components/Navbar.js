"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search, User, X, Menu, ChevronDown, LogOut, Heart,
  LayoutDashboard, ShieldCheck, Compass,
  ArrowUpRight, Bell, Settings, BarChart2, Shield,
  GitCompare, Calculator, Mail, ChevronRight, Home, BookOpen,
} from "lucide-react";
import { clsx } from "clsx";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import NotificationsBell from "@/components/NotificationsBell";

import { trackUiEvent } from "@/lib/analytics";
import { BRAND_HEADER_LOGO } from "@/lib/site-url";

export default function Navbar({ user }) {
 const router = useRouter();
 const pathname = usePathname();

 const [open, setOpen] = useState(false);
 const [mobileSearch, setMobileSearch] = useState(false);
 const [userMenu, setUserMenu] = useState(false);
 const [search, setSearch] = useState("");
 const [suggestions, setSuggestions] = useState([]);
 const [loadingSuggestions, setLoadingSuggestions] = useState(false);
 const [showSuggestions, setShowSuggestions] = useState(false);
 const [scrolled, setScrolled] = useState(false);
 const menuRef = useRef(null);
 const searchRef = useRef(null);
 const mobileSearchRef = useRef(null);

 const { debouncedTerm } = useDebouncedSearch(search, 300);

 useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
 }, []);

 useEffect(() => {
  document.body.style.overflow = open ? "hidden" : "";
  return () => { document.body.style.overflow = ""; };
 }, [open]);

 useEffect(() => {
  setOpen(false);
  setMobileSearch(false);
  setUserMenu(false);
 }, [pathname]);

 useEffect(() => {
  if (!open) return;
  const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
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
    const res = await fetch(`/api/search/suggestions?query=${encodeURIComponent(debouncedTerm)}`);
    const data = await res.json();
    setSuggestions(data.suggestions || []);
    setShowSuggestions(data.suggestions?.length > 0);
   } catch { setSuggestions([]); setShowSuggestions(false); }
   finally { setLoadingSuggestions(false); }
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
  { href: "/", label: "Home" },
  { href: "/cars", label: "Cars" },
  { href: "/compare", label: "Compare" },
  { href: "/duty", label: "Duty" },
 ];

 function closeMenus() {
  setOpen(false);
  setUserMenu(false);
  setMobileSearch(false);
  setShowSuggestions(false);
 }

 function navigateTo(href, e) {
  if (e?.metaKey || e?.ctrlKey || e?.shiftKey || e?.altKey || e?.button !== 0) return;
  e?.preventDefault();
  closeMenus();
  if (href === pathname) {
   window.scrollTo({ top: 0, behavior: "smooth" });
   return;
  }
  router.push(href);
 }

 return (
  <>
   <nav className={clsx(
    "sticky top-0 z-[100] isolate w-full flex items-center h-16 md:h-20 transition-all duration-300",
    scrolled
     ? "bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-elevated"
     : "bg-[#080808]/60 backdrop-blur-md border-b border-white/[0.04]"
   )}>
 <div className="w-full px-4 md:px-8 lg:px-12">
 <div className="flex items-center justify-between gap-4 lg:gap-6 min-w-0 h-full">

 {/* LOGO */}
 <Link
  href="/"
  onClick={(e) => navigateTo("/", e)}
  className="relative z-20 flex shrink-0 items-center transition-transform active:scale-95"
 >
      <div className="relative h-20 w-40 shrink-0 md:h-24 md:w-64 lg:h-24 lg:w-72">
  <Image
  src={BRAND_HEADER_LOGO}
   alt="BIDGARI"
   fill
   className="object-contain object-left brightness-110"
   priority
    sizes="(max-width: 768px) 160px, 288px"
  />
  </div>
 </Link>

 {/* NAV LINKS (Desktop) */}
 <div className="relative z-20 hidden lg:flex shrink-0 items-center gap-1">
 {links.map(({ href, label }) => (
 <Link
  key={href}
  href={href}
  onClick={(e) => navigateTo(href, e)}
  className="shrink-0 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.15em] text-zinc-400 transition-all hover:text-white rounded-lg hover:bg-white/[0.05]"
  >
  {label}
 </Link>
 ))}
 <a
  href="https://selar.com/m/CircusCarMagazine"
  target="_blank"
  rel="noopener noreferrer"
  className="shrink-0 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.15em] text-zinc-400 transition-all hover:text-white rounded-lg hover:bg-white/[0.05]"
  >
  Magazine
 </a>
 <Link
  href="/contact"
  onClick={(e) => navigateTo("/contact", e)}
  className="shrink-0 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.15em] border border-white/10 text-zinc-300 transition-all hover:bg-white/[0.05] hover:text-white hover:border-white/20 rounded-lg"
  >
  Contact
 </Link>
 </div>

 {/* SEARCH */}
 <div ref={searchRef} className="relative z-10 hidden md:flex min-w-0 flex-1 max-w-sm">
 <form onSubmit={handleSearch} className="w-full relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
 <input
  value={search}
  onChange={e => setSearch(e.target.value)}
  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
  placeholder="Search vehicles..."
  className="w-full h-10 pl-10 pr-4 text-sm font-medium outline-none transition-all bg-white/[0.04] focus:bg-white/[0.08] border border-white/[0.06] focus:border-[var(--accent)] text-white placeholder-zinc-500 rounded-xl"
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
  <div className="hidden lg:flex items-center gap-3">
   {user ? (
 <div className="flex items-center gap-3">
 <NotificationsBell variant="navbar" />
 <div className="relative" ref={menuRef}>
 <button
  onClick={() => setUserMenu(!userMenu)}
  className="flex items-center gap-2.5 h-10 px-3 transition-all bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10 rounded-xl"
  >
  {user.avatarUrl ? (
  <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 object-cover rounded-full ring-2 ring-white/10" />
  ) : (
  <div className="w-6 h-6 flex items-center justify-center font-bold text-[9px] uppercase text-black bg-[var(--accent)] rounded-full">
  {user.name?.[0]}
  </div>
  )}
  <span className="text-sm font-semibold text-zinc-300">
  Menu
  </span>
  <ChevronDown className={clsx("w-3 h-3 transition-transform duration-300", userMenu && "rotate-180", "text-zinc-500")} />
 </button>

 {userMenu && (
 <div className="absolute right-0 top-full mt-2 w-64 bg-[#111111] border border-white/[0.08] shadow-glass-lg overflow-hidden animate-slide-down rounded-xl">
 <div className="px-5 py-4 bg-white/[0.02] border-b border-white/[0.06]">
 <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Signed in as</p>
 <p className="text-sm font-bold text-white truncate">{user.name}</p>
 </div>
 <div className="py-1.5">
 {user.role === "ADMIN" && <MenuDropdownItem href="/admin" label="Dashboard" icon={<LayoutDashboard size={16} />} />}
  <MenuDropdownItem
  href="/account"
  label="Account"
  icon={<User size={16} />}
  />
  <MenuDropdownItem href="/account?tab=saved" label="Watchlist" icon={<Heart size={16} />} />
 <div className="my-1.5 border-t border-white/[0.06]" />
 <form action="/api/auth/logout" method="POST">
 <button type="submit" className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
 <LogOut size={16} /> Sign Out
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Link href="/login" className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white px-3 py-2">
  Sign In
 </Link>
 <Link href="/signup"
  className="h-10 px-5 flex items-center justify-center text-[11px] font-bold uppercase tracking-[0.15em] bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] transition-all active:scale-95 rounded-xl">
  Join
 </Link>
 </div>
 )}
 </div>

 {/* MOBILE ACTIONS */}
  <div className="flex lg:hidden items-center gap-2 shrink-0">
  <button
 type="button"
 onClick={() => {
  const nextOpen = !open;
  setOpen(nextOpen);
  trackUiEvent(nextOpen ? "mobile_menu_open" : "mobile_menu_close", { source: "navbar" });
 }}
 className="w-10 h-10 flex items-center justify-center border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 rounded-xl"
 aria-expanded={open}
 aria-label={open ? "Close menu" : "Open menu"}
 >
   {open ? <X size={20} /> : <Menu size={20} />}
  </button>
  </div>
 </div>
 </div>
 </nav>

 {/* MOBILE SEARCH OVERLAY */}
 {mobileSearch && (
 <div className="fixed inset-0 z-[200] bg-[#080808]/95 backdrop-blur-xl animate-fade-in duration-200">
 <div className="container mx-auto px-6 pt-6">
 <div className="flex items-center justify-between mb-12">
 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Search Inventory</span>
 <button onClick={() => setMobileSearch(false)} className="w-10 h-10 flex items-center justify-center bg-white/[0.05] border border-white/[0.08] text-zinc-400 rounded-xl">
 <X size={20} />
 </button>
 </div>

 <div ref={mobileSearchRef} className="relative">
 <form onSubmit={handleSearch} className="relative">
 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--accent)]" />
 <input
  autoFocus
  value={search}
  onChange={e => setSearch(e.target.value)}
  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
  placeholder="Type car make or model..."
  className="w-full h-14 pl-14 pr-6 text-lg font-bold outline-none bg-white/[0.04] border-b-2 border-white/[0.06] focus:border-[var(--accent)] text-white placeholder-zinc-500 transition-all rounded-xl"
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
 <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Quick Links</p>
 <div className="grid grid-cols-2 gap-3">
 {links.map(({ href, label }) => (
 <Link key={href} href={href} onClick={() => setMobileSearch(false)} className="px-6 py-4 bg-white/[0.03] border border-white/[0.06] text-sm font-bold text-zinc-300 text-center hover:bg-white/[0.06] transition-colors rounded-xl">
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
  className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm animate-fade-in duration-200"
  onClick={() => setOpen(false)}
  aria-hidden
 />
 <div
  className="relative z-10 flex max-h-[min(90dvh,38rem)] w-full flex-col overflow-hidden bg-[#0d0d0d] border-t border-white/[0.08] shadow-glass-lg animate-slide-up duration-300"
  onClick={(e) => e.stopPropagation()}
  >
  <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/10" aria-hidden />
  <div className="shrink-0 border-b border-white/[0.06] px-4 pb-3 pt-3 sm:px-5">
  <div className="flex items-center justify-between gap-3">
  <Link
   href="/"
   onClick={(e) => navigateTo("/", e)}
   className="flex min-w-0 shrink-0 items-center"
   >
     <div className="relative h-20 w-52 shrink-0 sm:h-24 sm:w-64">
   <Image
   src={BRAND_HEADER_LOGO}
    alt="BIDGARI"
    fill
    className="object-contain object-left brightness-110"
     sizes="(max-width: 640px) 208px, 256px"
    />
  </div>
  </Link>
  <button
   type="button"
   onClick={() => setOpen(false)}
   className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
   aria-label="Close menu"
   >
   <X size={20} />
  </button>
  </div>
  {user ? (
  <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
  {user.avatarUrl ? (
   <img
   src={user.avatarUrl}
   alt=""
   className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/10"
   />
  ) : (
   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold uppercase text-black">
   {user.name?.[0] ?? "?"}
   </div>
  )}
  <div className="min-w-0 flex-1">
  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Signed in</p>
  <p className="truncate text-sm font-bold text-white">{user.name}</p>
  </div>
  </div>
  ) : (
  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
  Verified inventory, transparent costs, and direct dealer access.
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
  href="/duty"
  onClick={(e) => navigateTo("/duty", e)}
  icon={<Calculator className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
  label="Duty"
  analyticsEvent="mobile_menu_duty_click"
  />
  <a
  href="https://selar.com/m/CircusCarMagazine"
  target="_blank"
  rel="noopener noreferrer"
  className="flex w-full min-h-[3.15rem] items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition hover:bg-white/[0.05] active:scale-[0.99]"
  >
  <span className="flex min-w-0 flex-1 items-center gap-3">
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400">
  <BookOpen className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
  </span>
  <span className="truncate text-sm font-bold text-zinc-200">Magazine</span>
  </span>
  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
  </a>
  <MobileMenuRow
  href="/contact"
  onClick={(e) => navigateTo("/contact", e)}
  icon={<Mail className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
  label="Contact"
  analyticsEvent="mobile_menu_contact_click"
  />
  </MobileMenuSection>

  <MobileMenuSection title="Account" className="pt-1">
  {user && (
  <>
  {user.role === "ADMIN" && (
  <MobileMenuRow
  href="/admin"
  onClick={() => setOpen(false)}
  icon={<LayoutDashboard className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />}
  label="Dashboard"
  />
  )}
  <div className="flex min-h-[3.15rem] items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left">
  <span className="flex min-w-0 flex-1 items-center gap-3">
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400">
  <Bell className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
  </span>
  <span className="truncate text-sm font-bold text-zinc-200">Notifications</span>
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
  )}
  </MobileMenuSection>
  </div>

  <div
  className="shrink-0 space-y-3 border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-3 sm:px-5"
  style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
  >
  {!user ? (
  <Link
  href="/signup"
  onClick={() => setOpen(false)}
  className="flex h-12 w-full items-center justify-center text-[11px] font-bold uppercase tracking-[0.15em] text-black transition bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.99] rounded-xl"
  >
  Create account
  </Link>
  ) : (
  <form action="/api/auth/logout" method="POST" className="w-full">
  <button
  type="submit"
  className="h-12 w-full text-center text-[11px] font-bold uppercase tracking-[0.15em] text-red-400 transition hover:bg-red-500/10 border border-red-500/20 rounded-xl"
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
 <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
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
  ? "border-[var(--accent)]/20 bg-[var(--accent)]/5"
  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
 );
 const iconWrap = clsx(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
  primary
  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
  : "bg-white/[0.04] text-zinc-400"
 );
 const body = (
 <>
 <span className="flex min-w-0 flex-1 items-center gap-3">
 <span className={iconWrap}>{icon}</span>
 <span className="truncate text-sm font-bold text-zinc-200">{label}</span>
 </span>
 <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
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
 <Link href={href} className="flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-zinc-300 hover:bg-white/[0.05] transition-colors rounded-lg mx-1.5">
 <span className="text-zinc-500">{icon}</span>
 {label}
 </Link>
 );
}
