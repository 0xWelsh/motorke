// src/app/admin/users/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Store,
  User as UserIcon,
  Edit3,
  RefreshCw,
  Ban,
  CheckCircle2,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DataTableShell from "@/components/ui/DataTableShell";

export const metadata = { title: "Users | Welsh Motorhub Admin" };

export default async function AdminUsersPage(props) {
  const searchParams = await props.searchParams;
  await requireAdmin();
  const deleted = searchParams?.deleted;

  const users = await db.user.findMany({
    include: { dealer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const roleStyles = {
    ADMIN: "bg-slate-900 text-white border-slate-900",
    DEALER:
      "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
    BUYER: "bg-slate-100 text-slate-600 border-slate-200 dark:border-zinc-800 dark:bg-zinc-900",
  };

  const dealerCount = users.filter((u) => u.role === "DEALER").length;
  const buyerCount = users.filter((u) => u.role === "BUYER").length;

  return (
    <div className="animate-in fade-in duration-700">
      <AdminPageHeader
        eyebrow="Access"
        title="Users"
        description="Buyer accounts, dealer logins, and admin identities."
        stats={[
          { label: "Total", value: users.length },
          { label: "Dealers", value: dealerCount, tone: "text-emerald-700 dark:text-emerald-400" },
          { label: "Buyers", value: buyerCount },
        ]}
        actions={
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-600"
          >
            <UserPlus size={16} /> Add user
          </Link>
        }
      />

      {deleted && (
        <div className="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/45 dark:bg-emerald-950/35 dark:text-emerald-300">
          Profile deleted successfully.
        </div>
      )}

      <DataTableShell>
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              {["User", "Role", "Dealer", "Status", "Joined", ""].map((h) => (
                <th key={h || "actions"} className="px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-900/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${roleStyles[user.role]}`}
                  >
                    {user.role === "ADMIN" && <ShieldCheck size={10} />}
                    {user.role === "DEALER" && <Store size={10} />}
                    {user.role === "BUYER" && <UserIcon size={10} />}
                    {user.role}
                  </span>
                </td>
                <td className="max-w-[160px] truncate px-5 py-4 text-slate-600 dark:text-zinc-400">
                  {user.dealer?.name || "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      user.active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {user.active ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                    {user.active ? "Active" : "Locked"}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-zinc-400">
                  {new Date(user.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500/40 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <Edit3 size={14} /> Edit
                    </Link>
                    <form action={`/api/admin/users/${user.id}/toggle`} method="POST">
                      <button
                        type="submit"
                        className={`rounded-lg p-2 transition ${
                          user.active
                            ? "text-slate-400 hover:text-slate-900"
                            : "text-emerald-600 hover:text-emerald-800"
                        }`}
                        title={user.active ? "Lock account" : "Unlock account"}
                      >
                        {user.active ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                    </form>
                    <Link
                      href={`/admin/users/${user.id}/edit#security`}
                      className="rounded-lg p-2 text-slate-400 transition hover:text-emerald-600"
                      title="Reset security"
                    >
                      <RefreshCw size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No users found</p>
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
