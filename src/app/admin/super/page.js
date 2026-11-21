// src/app/admin/super/page.js
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shield, UserPlus } from "lucide-react";
import { CreateAdminForm } from "./SuperAdminClient";

export const metadata = { title: "Super Admin | BIDGARI Admin" };

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const totalCars = await db.car.count();
  const totalViews = await db.car.aggregate({ _sum: { views: true } });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-xl bg-yellow-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Super Admin</span>
          </div>
          <h1 className="text-4xl font-black text-text tracking-tight">Admin Controls</h1>
          <p className="text-muted mt-2 text-sm">
            {totalCars} cars · {totalViews._sum.views?.toLocaleString() || 0} total views
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* ── Create Admin ─────────────────────────────────────────── */}
        <section className="bg-[#1c1c1c]/60 border border-white/[0.08] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="w-5 h-5 text-muted" />
            <h2 className="text-lg font-bold text-text">Add Admin User</h2>
          </div>
          <p className="text-sm text-muted mb-5">
            Create a new admin or promote an existing user by email.
          </p>

          <CreateAdminForm />
        </section>

      </div>
    </div>
  );
}
