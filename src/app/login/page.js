// src/app/login/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign In — Motorke" };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) {
    if (session.user.role === "ADMIN")  redirect("/admin");
    if (session.user.role === "DEALER") redirect("/portal");
    redirect("/");
  }

  const params = await searchParams;
  const error  = sp.error;

  const inputStyle = { width:"100%",background:"#F5F5F5",border:"1.5px solid #E2E2E2",borderRadius:10,padding:"12px 16px",fontSize:15,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",color:"#1A1A1A",display:"block" };
  const labelStyle = { display:"block",fontSize:13,fontWeight:600,color:"#444",marginBottom:6 };

  return (
    <div style={{ minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem 1rem",background:"#F5F5F5" }}>
      <div style={{ width:"100%",maxWidth:420 }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <a href="/" style={{ textDecoration:"none" }}>
            <span style={{ fontWeight:800,fontSize:26,color:"#1A1A1A" }}>Motor<span style={{ color:"#E8490F" }}>ke</span></span>
          </a>
          <p style={{ color:"#666",fontSize:14,marginTop:6 }}>Welcome back</p>
        </div>

        <div style={{ background:"#fff",borderRadius:16,border:"1px solid #E2E2E2",padding:32,boxShadow:"0 2px 20px rgba(0,0,0,0.06)" }}>
          {error && (
            <div style={{ background:"#fff0eb",border:"1px solid #fbc8b5",color:"#c73d0c",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:14 }}>
              {error === "invalid" && "Invalid email or password."}
              {error === "inactive" && "Your account has been deactivated."}
              {error === "unknown" && "Something went wrong. Please try again."}
            </div>
          )}

          <form action="/api/auth/login" method="POST" style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div>
              <label style={labelStyle}>Email address</label>
              <input name="email" type="email" required autoComplete="email" placeholder="you@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input name="password" type="password" required placeholder="••••••••" style={inputStyle} />
            </div>
            <button type="submit" style={{ background:"#E8490F",color:"white",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",marginTop:4 }}>
              Sign in
            </button>
          </form>

          <p style={{ textAlign:"center",fontSize:14,color:"#666",marginTop:20 }}>
            Don't have an account?{" "}
            <a href="/signup" style={{ color:"#E8490F",fontWeight:600,textDecoration:"none" }}>Sign up free</a>
          </p>
        </div>
      </div>
    </div>
  );
}