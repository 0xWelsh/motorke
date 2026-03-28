"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  Heart, 
  LayoutDashboard, 
  Store,
  PlusCircle,
  ShieldCheck,
  Compass
} from "lucide-react";
import { clsx } from "clsx";

export default function Navbar({ user }) {
  const [open,      setOpen]      = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [scrolled,  setScrolled]  = useState(false);
  const menuRef = useRef(null);
  const router  = useRouter();

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

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) router.push(`/cars?search=${encodeURIComponent(search.trim())}`);
    else router.push("/cars");
  }

  const links = [
    { href: "/cars",    label: "Inventory", icon: <Store className="w-3.5 h-3.5" /> },
    { href: "/dealers", label: "Dealers",   icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { href: "/compare", label: "Compare",   icon: <Compass className="w-3.5 h-3.5" /> },
  ];

  return (
    <nav className={clsx(
      "sticky top-0 z-[100] transition-all duration-500",
      scrolled 
        ? "bg-background/80 backdrop-blur-2xl border-b border-white/5 py-3 shadow-2xl" 
        : "bg-transparent border-b border-transparent py-6"
    )}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between gap-12">
          
          {/* LOGO: THE STANDARD */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(234,88,12,0.4)]">
              <span className="text-black group-hover:text-white font-black text-xl tracking-tighter transition-colors">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white tracking-tighter leading-none">
                Motor<span className="text-white/40 group-hover:text-orange-600 transition-colors">ke</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">Standard</span>
            </div>
          </Link>

          {/* MAIN NAVIGATION */}
          <div className="hidden lg:flex items-center gap-2">
            {links.map(({ href, label, icon }) => (
              <Link key={href} href={href} 
                className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-all">
                <span className="text-white/20 group-hover:text-orange-500 transition-colors">{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          {/* SEARCH: MINIMALIST INTEGRATION */}
          <form onSubmit={handleSearch} className="hidden xl:flex flex-1 max-w-sm relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within:text-white transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Quick search..."
              className="w-full bg-white/5 border border-transparent focus:border-white/20 focus:bg-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-[13px] font-medium outline-none transition-all placeholder:text-white/20 text-white"
            />
          </form>

          {/* USER ACTIONS */}
          <div className="hidden lg:flex items-center gap-6">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setUserMenu(!userMenu)} 
                  className="flex items-center gap-3 bg-white/5 border border-white/10 pl-2 pr-4 py-2 rounded-2xl hover:border-white/30 transition-all shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-xs uppercase">
                    {user.name?.[0]}
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-widest">{user.name?.split(" ")[0]}</span>
                  <ChevronDown className={clsx("w-3 h-3 text-white/30 transition-transform duration-300", userMenu && "rotate-180")} />
                </button>
                
                {userMenu && (
                  <div className="absolute right-0 top-full mt-4 w-72 bg-surface border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-5 py-5 bg-white/5 rounded-[2rem] mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Authenticated as</p>
                      <p className="text-sm font-black text-white truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                      {user.role === "ADMIN" && <MenuDropdownItem href="/admin" label="Administration" icon={<LayoutDashboard className="w-4 h-4" />} />}
                      {user.role === "DEALER" && <MenuDropdownItem href="/portal" label="Dealer Portal" icon={<Store className="w-4 h-4" />} />}
                      
                      <MenuDropdownItem href="/account" label="Profile Settings" icon={<User className="w-4 h-4" />} />
                      <MenuDropdownItem href="/saved" label="Watchlist" icon={<Heart className="w-4 h-4" />} />
                      
                      <div className="my-2 h-px bg-white/5 mx-4" />
                      <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-[1.5rem] transition-colors">
                          <LogOut className="w-4 h-4" />
                          Terminate Session
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-white hover:bg-orange-600 text-black hover:text-pureWhite px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                  Join Standard
                </Link>
              </div>
            )}
            
            <div className="h-6 w-px bg-white/10" />
            
            {user && (user.role === "DEALER" || user.role === "ADMIN") && (
              <Link href="/portal/cars/new" className="hidden xl:flex items-center gap-2 group">
                 <PlusCircle className="w-5 h-5 text-white/30 group-hover:text-orange-500 transition-colors" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Post Unit</span>
              </Link>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className="lg:hidden flex items-center gap-3">
            <button 
              onClick={() => setOpen(!open)} 
              className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-colors"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-0 bg-background z-[200] p-8 animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-between mb-12">
            <span className="text-xl font-black text-white uppercase tracking-tighter">Motor<span className="text-orange-600">ke</span></span>
            <button onClick={() => setOpen(false)} className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {links.map(({ href, label }) => (
              <Link 
                key={href} 
                href={href} 
                onClick={() => setOpen(false)} 
                className="block text-4xl font-black text-white tracking-tighter hover:text-orange-500 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="absolute bottom-12 left-8 right-8 space-y-4">
            {!user ? (
              <div className="grid grid-cols-1 gap-4">
                <Link href="/signup" onClick={() => setOpen(false)} className="py-5 text-center font-black uppercase tracking-widest text-black bg-white rounded-3xl">
                  Join Standard
                </Link>
                <Link href="/login" onClick={() => setOpen(false)} className="py-5 text-center font-black uppercase tracking-widest text-white bg-white/10 rounded-3xl">
                  Sign In
                </Link>
              </div>
            ) : (
               <Link href="/account" onClick={() => setOpen(false)} className="block py-5 text-center font-black uppercase tracking-widest text-black bg-white rounded-3xl">
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
    <Link href={href} className="flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 rounded-[1.5rem] transition-colors">
      <span className="text-white/20">{icon}</span>
      {label}
    </Link>
  );
}
