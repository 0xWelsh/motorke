// src/app/layout.js
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CompareBar } from "@/components/CompareSelector";
import { ModalProvider } from "@/components/Modal";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Motorke — Find Your Car in Kenya",
  description: "Compare cars from top dealerships across Kenya.",
};

export default async function RootLayout({ children }) {
  const session = await getSession();
  const user    = session?.user ? {
    id:      session.user.id,
    name:    session.user.name,
    email:   session.user.email,
    role:    session.user.role,
  } : null;

  return (
    <html lang="en">
      <body style={{ background: "#F5F5F5", color: "#1A1A1A", minHeight: "100vh" }}>
        <Navbar user={user} />
        <ModalProvider>
          <main style={{ flex: 1 }}>{children}</main>
          <CompareBar />
        </ModalProvider>
        <footer style={{ borderTop: "1px solid #E2E2E2", marginTop: "5rem", padding: "3rem 1.5rem", background: "#111827" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", marginBottom: 12 }}>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Motorke Kenya · Connecting Kenyan car buyers with trusted dealers</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            {[["Browse cars", "/cars"], ["Dealers", "/dealers"], ["Compare", "/compare"], ["Duty calc", "/duty"]].map(([label, href]) => (
              <a key={href} href={href} style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 13 }}>{label}</a>
            ))}
          </div>
        </footer>
      </body>
    </html>
  );
}