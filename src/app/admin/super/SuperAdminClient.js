"use client";
import { useState } from "react";
import { UserPlus, Check, AlertCircle, Loader2 } from "lucide-react";

export function CreateAdminForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to create admin.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-glass/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-glass/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-glass/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Min 6 chars"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 bg-glass/[0.1] hover:bg-glass/[0.15] disabled:bg-glass/[0.05] text-text rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {status === "loading" ? "Creating..." : "Create Admin"}
        </button>

        {status === "success" && (
          <span className="inline-flex items-center gap-1.5 text-[var(--accent)] text-sm font-semibold">
            <Check className="w-4 h-4" /> {message}
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-1.5 text-red-500 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" /> {message}
          </span>
        )}
      </div>
    </form>
  );
}
