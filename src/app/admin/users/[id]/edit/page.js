// src/app/admin/users/[id]/edit/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import AdminAvatarUpload from "@/components/AdminAvatarUpload";

export const metadata = { title: "Edit User — Admin" };

export default async function AdminEditUserPage(props) {
  await requireAdmin();
  const params = await props.params;
  const searchParams = await props.searchParams;

  const [user, dealers] = await Promise.all([
    db.user.findUnique({
      where:   { id: params.id },
      include: { dealer: { select: { name: true } } },
    }),
    db.dealer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!user) notFound();

  const saved = searchParams?.saved;
  const error = searchParams?.error;

  const inputCls  = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";
  const selectCls = "w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50 transition-colors";
  const labelCls  = "block text-xs text-white/40 uppercase tracking-wider mb-2";

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <a href="/admin/users" className="text-xs text-white/40 hover:text-white transition-colors">← Users</a>
        <div className="flex items-center gap-5 mt-4">
          <AdminAvatarUpload currentUrl={user.avatarUrl} targetId={user.id} targetType="user" name={user.name} size="lg" />
          <div>
            <h1 className="text-3xl font-black">{user.name}</h1>
            <p className="text-white/30 text-sm mt-1">{user.email}</p>
            <p className="text-xs text-white/40 mt-1">Click the photo to upload or change it</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7 mb-5">
        <h2 className="font-black mb-5">Account details</h2>

        {saved && (
          <div className="bg-green-500/10 border border-green-500/20 text-white text-sm rounded-xl px-4 py-3 mb-5">
            ✓ Changes saved
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-white text-sm rounded-xl px-4 py-3 mb-5">
            {error === "exists" ? "That email is already in use." : 
             error === "notallowed" ? "You cannot grant Admin rights." : 
             error === "self_delete" ? "You cannot delete your own account." : 
             error === "delete_failed" ? "Failed to delete user." : 
             "Something went wrong."}
          </div>
        )}

        <form action={`/api/admin/users/${params.id}`} method="POST" className="space-y-4">
          <div>
            <label className={labelCls}>Full name *</label>
            <input name="name" required defaultValue={user.name} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input name="email" type="email" required defaultValue={user.email} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Role *</label>
            <select name="role" defaultValue={user.role} className={selectCls}>
              <option value="DEALER">Dealer</option>
              {user.role === "ADMIN" && <option value="ADMIN">Admin</option>}
            </select>
          </div>
          <div>
            <label className={labelCls}>Linked dealership</label>
            <select name="dealerId" defaultValue={user.dealerId || ""} className={selectCls}>
              {user.role === "ADMIN" && <option value="">None (Admin only)</option>}
              {user.role !== "ADMIN" && <option value="" disabled>Select a dealership</option>}
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button type="submit"
            className="w-full bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold py-3 rounded-xl transition-colors">
            Save changes
          </button>
        </form>
      </div>

      {/* Reset password */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-7">
        <h2 className="font-black mb-2">Reset password</h2>
        <p className="text-xs text-white/30 mb-5">
          Set a new temporary password for this user. Share it with them securely.
        </p>
        <form action={`/api/admin/users/${params.id}/reset-password`} method="POST" className="space-y-4">
          <div>
            <label className={labelCls}>New password *</label>
            <input name="password" type="password" required minLength={8} className={inputCls} />
          </div>
          <button type="submit"
            className="border border-white/20 hover:border-white/40 text-white/60 hover:text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm">
            Reset password
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-1">Danger zone</h3>
        <p className="text-xs text-white/30 mb-4">
          Deleting a user account permanently revokes their access. Connected data may be removed or unlinked.
        </p>
        <DeleteButton action={`/api/admin/users/${params.id}/delete`} message="Permanently delete this user profile? This cannot be undone." label="Delete User" />
      </div>
    </div>
  );
}
