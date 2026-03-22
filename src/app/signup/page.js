// src/app/signup/page.js
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign Up — Motorke" };

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect("/");

  const params = await searchParams;
  const error  = sp.error;

  const inputStyle = {
    width: "100%", background: "#F5F5F5", border: "1.5px solid #E2E2E2",
    borderRadius: 10, padding: "12px 16px", fontSize: 15,
    fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none",
    color: "#1A1A1A", display: "block",
  };
  const labelStyle = {
    display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "#F5F5F5" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: 26, color: "#1A1A1A" }}>Motor<span style={{ color: "#E8490F" }}>ke</span></span>
          </a>
          <p style={{ color: "#666", fontSize: 14, marginTop: 6 }}>Create your free account</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E2E2", padding: 32, boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>

          {error && (
            <div style={{ background: "#fff0eb", border: "1px solid #fbc8b5", color: "#c73d0c", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 14 }}>
              {error === "exists"   && "An account with that email already exists."}
              {error === "mismatch" && "Passwords do not match."}
              {error === "short"    && "Password must be at least 8 characters."}
              {error === "unknown"  && "Something went wrong. Please try again."}
            </div>
          )}

          <form action="/api/auth/signup" method="POST" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input name="name" required placeholder="John Kamau" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email address</label>
              <input name="email" type="email" required placeholder="you@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input name="password" type="password" required minLength={8} placeholder="Min. 8 characters" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input name="confirm" type="password" required minLength={8} placeholder="Repeat password" style={inputStyle} />
            </div>

            <button type="submit" style={{
              background: "#E8490F", color: "white", border: "none",
              borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 4,
            }}>
              Create account
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, color: "#666", marginTop: 20 }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#E8490F", fontWeight: 600, textDecoration: "none" }}>Sign in</a>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 20 }}>
          Dealership?{" "}
          <a href="/login" style={{ color: "#666", textDecoration: "none" }}>Dealer login →</a>
        </p>
      </div>
    </div>
  );
}