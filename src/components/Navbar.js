"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search, User, X, Menu, ChevronDown, LogOut, Heart,
  LayoutDashboard, PlusCircle, ShieldCheck, Compass,
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
 const menuRef = useRef(null);
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
 setOpen(false);
 setMobileSearch(false);
 setUserMenu(false);
 }, [pathname]);

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
    <nav className="sticky top-0 z-[100] isolate w-full flex items-center h-20 md:h-24 bg-white border-b border-gray-100 shadow-sm transition-colors duration-300">
 <div className="w-full px-6 md:px-12">
 <div className="flex items-center justify-between gap-4 lg:gap-6 min-w-0 h-full">

 {/* LOGO — horizontal wordmark (not the favicon mark) */}
 <Link
 href="/"
 onClick={(e) => navigateTo("/", e)}
 className="relative z-20 flex shrink-0 items-center transition-transform active:scale-95"
 >
     <div className="relative h-28 w-80 shrink-0 md:h-32 md:w-96 lg:h-32 lg:w-[32rem]">
  <Image
  src={BRAND_HEADER_LOGO}
   alt="BIDGARI"
   fill
   className="object-contain object-left"
   priority
    sizes="(max-width: 768px) 320px, 512px"
   />
  </div>
  </Link>

  {/* NAV LINKS (Desktop) */}
 <div className="relative z-20 hidden lg:flex shrink-0 items-center gap-4 xl:gap-6">
 {links.map(({ href, label }) => (
 <Link
 key={href}
 href={href}
 onClick={(e) => navigateTo(href, e)}
 className="shrink-0 text-[13px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:opacity-70"
 >
 {label}
 </Link>
 ))}
 <a
 href="https://selar.com/m/CircusCarMagazine"
 target="_blank"
 rel="noopener noreferrer"
 className="shrink-0 text-[13px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:opacity-70"
 >
 Magazine
 </a>
 <Link
 href="/contact"
 onClick={(e) => navigateTo("/contact", e)}
 className="shrink-0 px-6 py-2 text-[13px] font-bold uppercase tracking-widest border border-slate-900 text-slate-900 transition-all hover:bg-slate-900 hover:text-white :bg-white :!text-[#0a0a0a]"
 style={{ borderRadius: "var(--radius)" }}
 >
 Contact
 </Link>
 </div>

 {/* SEARCH (Minimalist) */}
 <div ref={searchRef} className="relative z-10 hidden md:flex min-w-0 flex-1 max-w-sm">
 <form onSubmit={handleSearch} className="w-full relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
 <input
 value={search}
 onChange={e => setSearch(e.target.value)}
 onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
 placeholder="Search vehicles..."
 className="w-full h-11 pl-11 pr-5 text-sm font-medium outline-none transition-all bg-[#EDF2F7] focus:bg-white :bg-black border border-transparent focus:border-slate-900 :border-white text-slate-900 "
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
   {user ? (
 <div className="flex items-center gap-4">
 <NotificationsBell variant="navbar" />
 <div className="relative" ref={menuRef}>
 <button
 onClick={() => setUserMenu(!userMenu)}
 className="flex items-center gap-3 h-11 px-3 transition-all bg-[#EDF2F7] hover:bg-[#E2E8F0] :bg-zinc-800"
 style={{ borderRadius: 'var(--radius)' }}
 >
 {user.avatarUrl ? (
 <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 object-cover rounded-full" />
 ) : (
 <div className="w-7 h-7 flex items-center justify-center font-bold text-[10px] uppercase text-white bg-[#38A169] rounded-full">
 {user.name?.[0]}
 </div>
 )}
 <span className="text-sm font-bold text-slate-900 ">
 Menu
 </span>
 <ChevronDown className={clsx("w-3 h-3 transition-transform duration-300", userMenu && "rotate-180", "text-gray-400")} />
 </button>

 {userMenu && (
 <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2" style={{ borderRadius: 'var(--radius)' }}>
 <div className="px-5 py-4 bg-[#F7FAFC] border-b border-gray-100 ">
 <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Signed in as</p>
 <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
 </div>
 <div className="py-2">
 {user.role === "ADMIN" && <MenuDropdownItem href="/admin" label="Dashboard" icon={<LayoutDashboard size={18} />} />}
  <MenuDropdownItem
  href="/account"
  label="Account"
  icon={<User size={18} />}
  />
  <MenuDropdownItem href="/account?tab=saved" label="Watchlist" icon={<Heart size={18} />} />
 <div className="my-2 border-t border-gray-50 " />
 <form action="/api/auth/logout" method="POST">
 <button type="submit" className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 :bg-rose-500/10 transition-colors">
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
 <Link href="/login" className="text-sm font-bold text-slate-900 transition-opacity hover:opacity-70">
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
  <button
 type="button"
 onClick={() => {
 const nextOpen = !open;
 setOpen(nextOpen);
 trackUiEvent(nextOpen ? "mobile_menu_open" : "mobile_menu_close", { source: "navbar" });
 }}
 className="w-10 h-10 flex items-center justify-center border border-slate-200/90 bg-white text-slate-900 transition-all hover:bg-slate-50 :bg-zinc-800 active:scale-95"
 style={{ borderRadius: 'var(--radius)' }}
 aria-expanded={open}
 aria-label={open ? "Close menu" : "Open menu"}
 >
   {open ? <X size={22} /> : <Menu size={22} />}
  </button>
 </div>
 </div>
 </div>
 </nav>

 {/* MOBILE SEARCH OVERLAY */}
 {mobileSearch && (
 <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl animate-in fade-in duration-200">
 <div className="container mx-auto px-6 pt-6">
 <div className="flex items-center justify-between mb-12">
 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38A169]">Search Inventory</span>
 <button onClick={() => setMobileSearch(false)} className="w-10 h-10 flex items-center justify-center bg-[#EDF2F7] text-slate-900 " style={{ borderRadius: 'var(--radius)' }}>
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
 className="w-full h-16 pl-16 pr-6 text-lg font-bold outline-none bg-[#EDF2F7] border-b-2 border-transparent focus:border-[#38A169] text-slate-900 transition-all"
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
 <Link key={href} href={href} onClick={() => setMobileSearch(false)} className="px-6 py-4 bg-[#F7FAFC] text-sm font-bold text-slate-900 text-center" style={{ borderRadius: 'var(--radius)' }}>
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
 className="relative z-10 flex max-h-[min(90dvh,38rem)] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200/90 bg-white/98 shadow-2xl animate-in slide-in-from-bottom duration-300"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-slate-200 " aria-hidden />
 <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-2 sm:px-5">
 <div className="flex items-center justify-between gap-3">
 <Link
 href="/"
 onClick={(e) => navigateTo("/", e)}
 className="flex min-w-0 shrink-0 items-center"
 >
    <div className="relative h-28 w-64 shrink-0 sm:h-32 sm:w-80">
  <Image
  src={BRAND_HEADER_LOGO}
   alt="BIDGARI"
   fill
   className="object-contain object-left"
    sizes="(max-width: 640px) 256px, 320px"
   />
 </div>
 </Link>
 <button
 type="button"
 onClick={() => setOpen(false)}
 className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 :bg-zinc-800 :text-white"
 aria-label="Close menu"
 >
 <X size={22} />
 </button>
 </div>
 {user ? (
 <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 ">
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
 <p className="truncate text-sm font-bold text-slate-900 ">{user.name}</p>
 </div>
 </div>
 ) : (
 <p className="mt-2 text-sm leading-relaxed text-slate-600 ">
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
  className="flex w-full min-h-[3.15rem] items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-left transition active:scale-[0.99]"
  >
  <span className="flex min-w-0 flex-1 items-center gap-3">
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
  <BookOpen className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
  </span>
  <span className="truncate text-sm font-bold text-slate-900">Magazine</span>
  </span>
  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
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
  <div className="flex min-h-[3.15rem] items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-left">
  <span className="flex min-w-0 flex-1 items-center gap-3">
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
  <Bell className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
  </span>
  <span className="truncate text-sm font-bold text-slate-900">Notifications</span>
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
 className="shrink-0 space-y-3 border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5"
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
 className="h-12 w-full text-center text-xs font-bold uppercase tracking-[0.2em] text-rose-600 transition hover:bg-rose-50 :bg-rose-500/10 border border-rose-500/50 "
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
 <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ">
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
 ? "border-[#38A169]/35 bg-[#38A169]/6 "
 : "border-slate-200/90 bg-white "
 );
 const iconWrap = clsx(
 "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
 primary
 ? "bg-white text-[#2F855A] shadow-sm "
 : "bg-slate-100 text-slate-700 "
 );
 const body = (
 <>
 <span className="flex min-w-0 flex-1 items-center gap-3">
 <span className={iconWrap}>{icon}</span>
 <span className="truncate text-sm font-bold text-slate-900 ">{label}</span>
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
 <Link href={href} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-[#EDF2F7] :bg-zinc-800 transition-all">
 <span className="text-[#718096]">{icon}</span>
 {label}
 </Link>
 );
}
