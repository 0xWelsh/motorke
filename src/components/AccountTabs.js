"use client";
// src/components/AccountTabs.js

import { useState, useEffect } from "react";

const fmt      = (n)   => "KSh " + Number(n).toLocaleString("en-KE");
const fmtKm    = (km)  => km ? `${Number(km).toLocaleString("en-KE")} km` : "N/A";
const fmtDate  = (iso) => new Date(iso).toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"numeric" });

const card  = { background:"#fff", border:"1px solid #E2E2E2", borderRadius:12, overflow:"hidden" };
const input = { width:"100%", background:"#F5F5F5", border:"1.5px solid #E2E2E2", borderRadius:10, padding:"11px 14px", fontSize:14, fontFamily:"inherit", outline:"none", color:"#1A1A1A" };
const label = { display:"block", fontSize:13, fontWeight:600, color:"#555", marginBottom:5 };
const btn   = (color="#E8490F") => ({ background:color, color:"white", border:"none", borderRadius:10, padding:"11px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit", width:"100%" });

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
      <div style={{ display:"flex", gap:3, marginBottom:20, background:"#fff", border:"1px solid #E2E2E2", borderRadius:12, padding:4 }}>
        {tabs.map(({ id, label: l }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:"9px 8px", borderRadius:9, border:"none", cursor:"pointer",
            fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all 0.15s",
            background: tab===id ? "#E8490F" : "transparent",
            color:      tab===id ? "white"   : "#666",
          }}>{l}</button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {tab === "profile" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
          <div style={{ ...card, padding:24 }}>
            <h2 style={{ fontWeight:700, fontSize:"1rem", marginBottom:20 }}>Personal details</h2>
            {profMsg === "success" && <Alert type="success">Profile updated successfully</Alert>}
            {profMsg === "error"   && <Alert type="error">Something went wrong</Alert>}
            <form onSubmit={saveProfile} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label style={label}>Full name</label><input value={name} onChange={e=>setName(e.target.value)} required style={input} /></div>
              <div><label style={label}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required style={input} /></div>
              <div>
                <label style={label}>Phone number</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 7xx xxx xxx" style={input} />
                <p style={{ fontSize:11, color:"#999", marginTop:4 }}>Dealers use this to call you back</p>
              </div>
              <button type="submit" style={btn()}>Save changes</button>
            </form>
          </div>

          <div style={{ ...card, padding:24 }}>
            <h2 style={{ fontWeight:700, fontSize:"1rem", marginBottom:20 }}>Change password</h2>
            {pwMsg === "success" && <Alert type="success">Password updated</Alert>}
            {pwErr && <Alert type="error">{pwErr}</Alert>}
            <form onSubmit={changePassword} style={{ display:"flex", flexDirection:"column", gap:14 }}>
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
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:16 }}>
              {saved.map(car => (
                <div key={car.id} style={card}>
                  <div style={{ position:"relative", aspectRatio:"16/10", background:"#f0ede8", overflow:"hidden" }}>
                    {car.image
                      ? <img src={car.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:40 }}>🚗</div>
                    }
                    {!car.available && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ background:"#1A1A1A", color:"white", fontSize:11, fontWeight:700, padding:"5px 14px", borderRadius:99 }}>SOLD</span>
                      </div>
                    )}
                    <button onClick={() => unsave(car.id)}
                      title="Remove"
                      style={{ position:"absolute", top:8, right:8, width:28, height:28, borderRadius:"50%", background:"white", border:"none", cursor:"pointer", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }}>
                      ×
                    </button>
                  </div>
                  <div style={{ padding:"14px 16px" }}>
                    <a href={`/cars/${car.id}`} style={{ textDecoration:"none" }}>
                      <p style={{ fontWeight:700, fontSize:15, color:"#1A1A1A" }}>{car.year} {car.make} {car.model}</p>
                    </a>
                    <p style={{ fontSize:12, color:"#999", marginTop:2 }}>{car.dealer?.name}</p>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                      <p style={{ fontWeight:800, fontSize:16, color:"#E8490F" }}>{fmt(car.price)}</p>
                      <p style={{ fontSize:11, color:"#bbb" }}>Saved {fmtDate(car.savedAt)}</p>
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
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {enquiries.map(e => (
                <div key={e.id} style={{ ...card, padding:18, display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:"#fff3e8", color:"#E8490F", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:17, flexShrink:0 }}>
                    {e.dealer.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                      <div>
                        <p style={{ fontWeight:700, fontSize:14, color:"#1A1A1A" }}>{e.dealer.name}</p>
                        <a href={`/cars/${e.car.id}`} style={{ fontSize:13, color:"#E8490F", textDecoration:"none" }}>
                          {e.car.year} {e.car.make} {e.car.model} — {fmt(e.car.price)}
                        </a>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:10, borderRadius:99, padding:"3px 10px", fontWeight:600, background: e.channel==="whatsapp"?"#dcfce7":"#f0f0f0", color: e.channel==="whatsapp"?"#16a34a":"#666" }}>
                          {e.channel === "whatsapp" ? "💬 WhatsApp" : "📧 Form"}
                        </span>
                        <p style={{ fontSize:11, color:"#999" }}>{fmtDate(e.createdAt)}</p>
                      </div>
                    </div>
                    {e.message && (
                      <p style={{ fontSize:13, color:"#555", marginTop:8, background:"#F5F5F5", borderRadius:8, padding:"8px 12px", fontStyle:"italic" }}>
                        "{e.message}"
                      </p>
                    )}
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      {e.dealer.phone && <a href={`tel:${e.dealer.phone}`} style={{ fontSize:12, border:"1px solid #E2E2E2", borderRadius:7, padding:"5px 12px", color:"#444", textDecoration:"none" }}>📞 Call</a>}
                      {e.dealer.whatsapp && <a href={`https://wa.me/${e.dealer.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, background:"#dcfce7", border:"1px solid #bbf7d0", borderRadius:7, padding:"5px 12px", color:"#16a34a", textDecoration:"none", fontWeight:600 }}>💬 WhatsApp</a>}
                      {!e.car.available && <span style={{ fontSize:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, padding:"5px 12px", color:"#dc2626" }}>Car sold</span>}
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
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
              {recent.map(car => (
                <a key={car.id} href={`/cars/${car.id}`} style={{ ...card, textDecoration:"none", display:"block" }}>
                  <div style={{ aspectRatio:"16/10", background:"#f0ede8", overflow:"hidden" }}>
                    {car.image
                      ? <img src={car.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:36 }}>🚗</div>
                    }
                  </div>
                  <div style={{ padding:"12px 14px" }}>
                    <p style={{ fontWeight:700, fontSize:14, color:"#1A1A1A" }}>{car.title}</p>
                    <p style={{ fontWeight:800, fontSize:15, color:"#E8490F", marginTop:6 }}>{fmt(car.price)}</p>
                    <p style={{ fontSize:11, color:"#999", marginTop:4 }}>
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
    success: { background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a" },
    error:   { background:"#fff0eb", border:"1px solid #fbc8b5", color:"#c73d0c" },
  };
  return (
    <div style={{ ...styles[type], borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13 }}>
      {type === "success" ? "✓ " : "⚠ "}{children}
    </div>
  );
}

function Empty({ icon, title, desc, href, cta }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #E2E2E2", borderRadius:12, padding:48, textAlign:"center" }}>
      <p style={{ fontSize:40, marginBottom:16 }}>{icon}</p>
      <p style={{ fontWeight:700, fontSize:"1.1rem", color:"#1A1A1A", marginBottom:8 }}>{title}</p>
      <p style={{ color:"#666", fontSize:14, marginBottom:24 }}>{desc}</p>
      <a href={href} style={{ background:"#E8490F", color:"white", textDecoration:"none", borderRadius:10, padding:"11px 28px", fontWeight:700, fontSize:14, display:"inline-block" }}>{cta}</a>
    </div>
  );
}
