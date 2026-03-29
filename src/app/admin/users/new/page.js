// src/app/admin/users/new/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Create User — Admin" };

export default async function AdminNewUserPage({ searchParams }) {
  await requireAdmin();
  const dealers = await db.dealer.findMany({ orderBy: { name: "asc" } });
  const error   = searchParams.error;

  const inputCls  = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";
  const labelCls  = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <a href="/admin/users" className="text-xs text-white/40 hover:text-white transition-colors">← Users</a>
        <h1 className="text-3xl font-black mt-2">Create portal user</h1>
        <p className="text-white/40 text-sm mt-1">
          Create a login for a dealership or another admin.
        </p>
      </div>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
            {error === "exists"   && "A user with that email already exists."}
            {error === "mismatch" && "Passwords do not match."}
            {error === "notallowed" && "You cannot create another Admin user."}
            {error === "unknown"  && "Something went wrong. Please try again."}
          </div>
        )}

        <form action="/api/admin/users" method="POST" className="space-y-5">
          <div>
            <label className={labelCls}>Full name *</label>
            <input name="name" required placeholder="John Kamau" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input name="email" type="email" required placeholder="john@dealership.co.ke" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Password *</label>
              <input name="password" type="password" required minLength={8} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Confirm *</label>
              <input name="confirm" type="password" required minLength={8} className={inputCls} />
            </div>
          </div>
          <p className="text-xs text-white/20 -mt-2">Share this password with the dealer securely — they can change it after login.</p>

          <div>
            <label className={labelCls}>Role *</label>
            <select name="role" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50">
              <option value="DEALER">Dealer</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Linked dealership *</label>
            <select name="dealerId" required defaultValue="" className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50">
              <option value="" disabled>Select a dealership</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.location}</option>
              ))}
            </select>
          </div>

          <button type="submit"
            className="w-full bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold py-3 rounded-xl transition-colors">
            Create account →
          </button>
        </form>
      </div>

      {/* Tip card */}
      <div className="mt-5 bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-sm text-white/40">
        <p className="font-semibold text-white/60 mb-1">💡 Onboarding a new dealer?</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Make sure the dealership exists — <a href="/admin/dealers/new" className="text-[#f97316]">add it first</a> if not.</li>
          <li>Create the user account here, linked to that dealership.</li>
          <li>Share the login URL (<code className="bg-white/5 px-1 rounded">/login</code>) and their credentials.</li>
          <li>They log in at <code className="bg-white/5 px-1 rounded">/portal</code> and start adding cars.</li>
        </ol>
      </div>
    </div>
  );
}
