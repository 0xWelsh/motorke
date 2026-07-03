// src/app/admin/super/page.js
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shield, UserPlus, TrendingUp, Eye, MessageSquare } from "lucide-react";
import { CreateAdminForm, ViewBoosterForm, EventsBoosterForm, LeadsBoosterForm } from "./SuperAdminClient";

export const metadata = { title: "Super Admin | Welsh Motorhub Admin" };

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const allCars = await db.car.findMany({
    select: { id: true, views: true },
  });
  const totalCars = allCars.length;
  const totalViews = allCars.reduce((sum, c) => sum + (c.views || 0), 0);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEvents = await db.marketingEvent.count({ where: { createdAt: { gte: todayStart } } });
  const totalActiveCars = await db.car.count({ where: { available: true } });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-2xl bg-yellow-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Super Admin</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Admin Controls</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm">
            {totalCars} cars · {totalViews.toLocaleString()} total views · {todayEvents.toLocaleString()} events today
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* ── Create Admin ─────────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Admin User</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5">
            Create a new admin or promote an existing user by email.
          </p>

          <CreateAdminForm />
        </section>

        {/* ── View Booster ──────────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">View Booster</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5">
            Bulk-adjust view counts across all cars to build platform traction.
          </p>

          <ViewBoosterForm totalCars={totalCars} />
        </section>

        {/* ── Events Booster ────────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Events Today Booster</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5">
            Seed fake page_view marketing events to inflate the "Views Today" stat on the admin dashboard.
          </p>

          <EventsBoosterForm todayEvents={todayEvents} />
        </section>

        {/* ── Leads Booster ─────────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Leads Booster</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5">
            Seed fake leads with Kenyan names/phones across active cars to show buyer activity.
          </p>

          <LeadsBoosterForm totalActiveCars={totalActiveCars} />
        </section>
      </div>
    </div>
  );
}
