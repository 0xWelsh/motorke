// src/app/layout.js
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CompareBar } from "@/components/CompareSelector";

export const metadata = {
  title:       "Motorke — Find Your Car in Kenya",
  description: "Compare cars from top dealerships across Kenya. Find the best price on Toyota, Subaru, Mazda and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-white min-h-screen">
        <Navbar />
        <main>{children}</main>
        <CompareBar />
        <footer className="border-t border-white/10 mt-20 py-12 text-center text-white/30 text-sm">
          <p>© {new Date().getFullYear()} Motorke Kenya · Built for Kenyan car buyers</p>
        </footer>
      </body>
    </html>
  );
}
