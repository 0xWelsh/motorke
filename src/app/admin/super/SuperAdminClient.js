"use client";
import { useState } from "react";
import { UserPlus, TrendingUp, Eye, MessageSquare, Check, AlertCircle, Loader2 } from "lucide-react";

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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
            placeholder="Min 6 chars"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-sm px-5 py-2.5 text-sm font-bold transition-colors"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {status === "loading" ? "Creating..." : "Create Admin"}
        </button>

        {status === "success" && (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
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

export function LeadsBoosterForm({ totalActiveCars }) {
  const [count, setCount] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!count) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/admin/boost-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: parseInt(count, 10) }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">Add leads</label>
          <input
            required
            type="number"
            min="1"
            max="1000"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-28 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
            placeholder="50"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !count}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-sm px-5 py-2.5 text-sm font-bold transition-colors"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          {status === "loading" ? "Adding..." : "Add Leads"}
        </button>
      </div>

      {status === "success" && (
        <p className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <Check className="w-4 h-4" /> {message}
        </p>
      )}
      {status === "error" && (
        <p className="inline-flex items-center gap-1.5 text-red-500 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" /> {message}
        </p>
      )}

      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
        Random Kenyan names/phones across {totalActiveCars} active cars. Max 1,000 per request.
      </p>
    </form>
  );
}

export function EventsBoosterForm({ todayEvents }) {
  const [count, setCount] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!count) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/admin/boost-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: parseInt(count, 10) }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">Add events today</label>
          <input
            required
            type="number"
            min="1"
            max="50000"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-28 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
            placeholder="5000"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !count}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-sm px-5 py-2.5 text-sm font-bold transition-colors"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          {status === "loading" ? "Adding..." : "Add Events"}
        </button>
      </div>

      {status === "success" && (
        <p className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <Check className="w-4 h-4" /> {message}
        </p>
      )}
      {status === "error" && (
        <p className="inline-flex items-center gap-1.5 text-red-500 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" /> {message}
        </p>
      )}

      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
        {todayEvents} events today so far. Pages views are spread randomly across today. Max 50,000 per request.
      </p>
    </form>
  );
}

export function ViewBoosterForm({ totalCars }) {
  const [mode, setMode] = useState("multiply");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/admin/boost-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, value: parseInt(value, 10) }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">Action</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
          >
            <option value="multiply">Multiply by</option>
            <option value="floor">Set minimum to</option>
            <option value="add">Add to each</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">Value</label>
          <input
            required
            type="number"
            min="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-28 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-sm px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
            placeholder={mode === "multiply" ? "30" : mode === "floor" ? "3000" : "100"}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !value}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-sm px-5 py-2.5 text-sm font-bold transition-colors"
        >
          {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          {status === "loading" ? "Applying..." : "Apply"}
        </button>
      </div>

      {status === "success" && (
        <p className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <Check className="w-4 h-4" /> {message}
        </p>
      )}
      {status === "error" && (
        <p className="inline-flex items-center gap-1.5 text-red-500 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" /> {message}
        </p>
      )}

      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
        {totalCars} active cars will be affected. Views only — CarView event rows are not duplicated.
      </p>
    </form>
  );
}
