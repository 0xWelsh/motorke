// src/app/admin/users/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    include: { dealer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">
          Portal users <span className="text-white/30 text-xl font-normal">({users.length})</span>
        </h1>
        <a href="/admin/users/new"
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          + Create user
        </a>
      </div>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-5 py-4">User</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Role</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Dealership</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Status</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Joined</th>
              <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-white/30">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    user.role === "ADMIN"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                      : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-white/50">
                  {user.dealer?.name || <span className="text-white/20">—</span>}
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    user.active
                      ? "bg-green-500/15 text-green-400 border border-green-500/20"
                      : "bg-red-500/15 text-red-400 border border-red-500/20"
                  }`}>
                    {user.active ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-white/30">
                  {new Date(user.createdAt).toLocaleDateString("en-KE")}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <a href={`/admin/users/${user.id}/edit`}
                      className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all">
                      Edit
                    </a>
                    <form action={`/api/admin/users/${user.id}/toggle`} method="POST">
                      <button type="submit"
                        className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all">
                        {user.active ? "Suspend" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-16 text-white/30">No users yet</div>
        )}
      </div>
    </div>
  );
}
