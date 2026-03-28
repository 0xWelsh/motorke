"use client";
// src/components/AccountTabs.js

import { useState, useEffect } from "react";

const fmt      = (n)   => "KSh " + Number(n).toLocaleString("en-KE");
const fmtKm    = (km)  => km ? `${Number(km).toLocaleString("en-KE")} km` : "N/A";
const fmtDate  = (iso) => new Date(iso).toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"numeric" });

const card  = { background:"#111", border:"1px solid rgba(255,255,255,0.05)", borderRadius:24, overflow:"hidden", boxShadow:"0 10px 40px rgba(0,0,0,0.5)" };
const input = { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"16px", fontSize:14, fontFamily:"inherit", outline:"none", color:"white", transition:"all 0.3s" };
const label = { display:"block", fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:8 };
const btn   = (color="#ea580c") => ({ background:color, color:"white", border:"none", borderRadius:16, padding:"16px", fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"inherit", width:"100%", transition:"all 0.3s", boxShadow:`0 0 15px ${color}40` });

export default function AccountTabs({ tab: init, user, savedCars, enquiries }) {
  const [tab,        setTab]       = useState(init || "profile");
  const [saved,      setSaved]     = useState(savedCars);
  const [name,       setName]      = useState(user.name);
  const [email,      setEmail]     = useState(user.email);
  const [phone,      setPhone]     = useState("");
  const [profMsg,    setProfMsg]   = useState("");
  const [pwMsg,      setPwMsg]     = useState("");
  const [pwErr,      setPwErr]     = useState("");
  const [recent,     setRecent]    = useState([]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem("motorke_recent") || "[]")); } catch {}
  }, []);

  const tabs = [
    { id:"profile",   label:"Profile"                        },
    { id:"saved",     label:`Saved (${saved.length})`        },
    { id:"enquiries", label:`Enquiries (${enquiries.length})`},
    { id:"recent",    label:"Recently viewed"                },
  ];

  async function saveProfile(e) {
    e.preventDefault();
    const res = await fetch("/api/account/profile", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name, email, phone }),
    });
    setProfMsg(res.ok ? "success" : "error");
    setTimeout(() => setProfMsg(""), 3000);
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    const fd  = new FormData(e.target);
    const cur = fd.get("current"), np = fd.get("new"), cf = fd.get("confirm");
    if (np !== cf)      { setPwErr("Passwords don't match"); return; }
    if (np.length < 8)  { setPwErr("Minimum 8 characters"); return; }
    const res = await fetch("/api/portal/password", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ current:cur, newPassword:np, confirm:cf }),
    });
    if (res.ok) { setPwMsg("success"); e.target.reset(); setTimeout(() => setPwMsg(""), 3000); }
    else setPwErr("Current password is incorrect");
  }

  async function unsave(carId) {
    await fetch(`/api/saved/${carId}`, { method:"DELETE" });
    setSaved(prev => prev.filter(c => c.id !== carId));
  }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:4, marginBottom:32, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:16, padding:6 }}>
        {tabs.map(({ id, label: l }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:"12px 8px", borderRadius:12, border:"none", cursor:"pointer",
            fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:"inherit", transition:"all 0.3s",
            background: tab===id ? "#ea580c" : "transparent",
            color:      tab===id ? "white"   : "rgba(255,255,255,0.4)",
            boxShadow:  tab===id ? "0 0 15px rgba(234,88,12,0.4)" : "none"
          }}>{l}</button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {tab === "profile" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:24 }}>
          <div style={{ ...card, padding:32 }}>
            <h2 style={{ fontWeight:900, fontSize:"1.25rem", color:"white", marginBottom:24 }}>Personal details</h2>
            {profMsg === "success" && <Alert type="success">Profile updated successfully</Alert>}
            {profMsg === "error"   && <Alert type="error">Something went wrong</Alert>}
            <form onSubmit={saveProfile} style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div><label style={label}>Full name</label><input value={name} onChange={e=>setName(e.target.value)} required style={input} /></div>
              <div><label style={label}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required style={input} /></div>
              <div>
                <label style={label}>Phone number</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 7xx xxx xxx" style={input} />
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:8 }}>Dealers use this to call you back</p>
              </div>
              <button type="submit" style={btn()}>Save changes</button>
            </form>
          </div>

          <div style={{ ...card, padding:32 }}>
            <h2 style={{ fontWeight:900, fontSize:"1.25rem", color:"white", marginBottom:24 }}>Change password</h2>
            {pwMsg === "success" && <Alert type="success">Password updated</Alert>}
            {pwErr && <Alert type="error">{pwErr}</Alert>}
            <form onSubmit={changePassword} style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div><label style={label}>Current password</label><input name="current" type="password" required style={input} /></div>
              <div><label style={label}>New password</label><input name="new" type="password" required minLength={8} style={input} /></div>
              <div><label style={label}>Confirm new password</label><input name="confirm" type="password" required minLength={8} style={input} /></div>
              <button type="submit" style={btn("#1A1A1A")}>Update password</button>
            </form>
          </div>
        </div>
      )}

      {/* ── SAVED CARS ── */}
      {tab === "saved" && (
        saved.length === 0
          ? <Empty icon="🚗" title="No saved cars yet" desc="Tap the bookmark icon on any car to save it here" href="/cars" cta="Browse cars" />
          : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:24 }}>
              {saved.map(car => (
                <div key={car.id} style={card}>
                  <div style={{ position:"relative", aspectRatio:"16/10", background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                    {car.image
                      ? <img src={car.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:40 }}>🚗</div>
                    }
                    {!car.available && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ background:"#1A1A1A", color:"white", fontSize:11, fontWeight:900, padding:"6px 16px", borderRadius:99, letterSpacing:"0.1em" }}>SOLD</span>
                      </div>
                    )}
                    <button onClick={() => unsave(car.id)}
                      title="Remove"
                      style={{ position:"absolute", top:12, right:12, width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", color:"white", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontWeight:700, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                      ×
                    </button>
                  </div>
                  <div style={{ padding:"20px" }}>
                    <a href={`/cars/${car.id}`} style={{ textDecoration:"none" }}>
                      <p style={{ fontWeight:900, fontSize:15, color:"white" }}>{car.year} {car.make} {car.model}</p>
                    </a>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{car.dealer?.name}</p>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
                      <p style={{ fontWeight:900, fontSize:18, color:"#ea580c" }}>{fmt(car.price)}</p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Saved {fmtDate(car.savedAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* ── ENQUIRIES ── */}
      {tab === "enquiries" && (
        enquiries.length === 0
          ? <Empty icon="📩" title="No enquiries yet" desc="When you contact a dealer, your messages appear here" href="/cars" cta="Browse cars" />
          : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {enquiries.map(e => (
                <div key={e.id} style={{ ...card, padding:24, display:"flex", gap:20, alignItems:"flex-start" }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:"rgba(234,88,12,0.1)", color:"#ea580c", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, flexShrink:0 }}>
                    {e.dealer.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                      <div>
                        <p style={{ fontWeight:900, fontSize:15, color:"white" }}>{e.dealer.name}</p>
                        <a href={`/cars/${e.car.id}`} style={{ fontSize:13, color:"#ea580c", textDecoration:"none", fontWeight:600 }}>
                          {e.car.year} {e.car.make} {e.car.model} — {fmt(e.car.price)}
                        </a>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:10, borderRadius:99, padding:"4px 12px", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.05em", background: e.channel==="whatsapp"?"rgba(16,185,129,0.1)":"rgba(255,255,255,0.05)", color: e.channel==="whatsapp"?"#10B981":"rgba(255,255,255,0.6)", border: e.channel==="whatsapp"?"1px solid rgba(16,185,129,0.2)":"1px solid rgba(255,255,255,0.1)" }}>
                          {e.channel === "whatsapp" ? "💬 WhatsApp" : "📧 Form"}
                        </span>
                        <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{fmtDate(e.createdAt)}</p>
                      </div>
                    </div>
                    {e.message && (
                      <p style={{ fontSize:14, color:"rgba(255,255,255,0.7)", marginTop:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:"12px 16px", fontStyle:"italic" }}>
                        "{e.message}"
                      </p>
                    )}
                    <div style={{ display:"flex", gap:12, marginTop:16 }}>
                      {e.dealer.phone && <a href={`tel:${e.dealer.phone}`} style={{ fontSize:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", borderRadius:8, padding:"6px 16px", color:"white", textDecoration:"none", fontWeight:700 }}>📞 Call</a>}
                      {e.dealer.whatsapp && <a href={`https://wa.me/${e.dealer.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"6px 16px", color:"#10B981", textDecoration:"none", fontWeight:700 }}>💬 WhatsApp</a>}
                      {!e.car.available && <span style={{ fontSize:12, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"6px 16px", color:"#ef4444", fontWeight:700 }}>Car sold</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* ── RECENTLY VIEWED ── */}
      {tab === "recent" && (
        recent.length === 0
          ? <Empty icon="👁️" title="No recently viewed cars" desc="Cars you view will appear here for easy access" href="/cars" cta="Browse cars" />
          : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:24 }}>
              {recent.map(car => (
                <a key={car.id} href={`/cars/${car.id}`} style={{ ...card, textDecoration:"none", display:"block", transition:"all 0.3s" }}>
                  <div style={{ aspectRatio:"16/10", background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                    {car.image
                      ? <img src={car.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:36 }}>🚗</div>
                    }
                  </div>
                  <div style={{ padding:"16px 20px" }}>
                    <p style={{ fontWeight:900, fontSize:14, color:"white" }}>{car.title}</p>
                    <p style={{ fontWeight:900, fontSize:15, color:"#ea580c", marginTop:6 }}>{fmt(car.price)}</p>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:8 }}>
                      Viewed {new Date(car.viewedAt).toLocaleDateString("en-KE", { day:"numeric", month:"short" })}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )
      )}
    </div>
  );
}

function Alert({ type, children }) {
  const styles = {
    success: { background:"rgba(16, 185, 129, 0.1)", border:"1px solid rgba(16, 185, 129, 0.2)", color:"#34d399" },
    error:   { background:"rgba(239, 68, 68, 0.1)", border:"1px solid rgba(239, 68, 68, 0.2)", color:"#f87171" },
  };
  return (
    <div style={{ ...styles[type], borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, fontWeight:700 }}>
      {type === "success" ? "✓ " : "⚠ "}{children}
    </div>
  );
}

function Empty({ icon, title, desc, href, cta }) {
  return (
    <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.05)", borderRadius:24, padding:48, textAlign:"center", boxShadow:"0 10px 40px rgba(0,0,0,0.5)" }}>
      <p style={{ fontSize:48, marginBottom:20 }}>{icon}</p>
      <p style={{ fontWeight:900, fontSize:"1.25rem", color:"white", marginBottom:12, letterSpacing:"-0.02em" }}>{title}</p>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, marginBottom:32 }}>{desc}</p>
      <a href={href} style={{ background:"#ea580c", color:"white", textDecoration:"none", borderRadius:16, padding:"14px 32px", fontWeight:900, fontSize:14, display:"inline-block", transition:"all 0.2s", boxShadow:"0 0 15px rgba(234,88,12,0.4)" }}>{cta}</a>
    </div>
  );
}
