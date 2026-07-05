export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Search,
  UserPlus,
  Edit3,
  Ban,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";
import DataTableShell from "@/components/ui/DataTableShell";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Users | BIDGARI Admin" };

function usersHref(opts = {}) {
  const p = new URLSearchParams();
  if (opts.search) p.set("search", opts.search);
  const qs = p.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export default async function AdminUsersPage(props) {
  const searchParams = await props.searchParams;
  await requireAdmin();
  const search = searchParams?.search || "";
  const deleted = searchParams?.deleted;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const total = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const buyerCount = users.filter((u) => u.role === "BUYER").length;
  const dealerCount = users.filter((u) => u.role === "DEALER").length;

  const roleDot = {
    ADMIN: "bg-emerald-500",
    DEALER: "bg-amber-500",
    BUYER: "bg-zinc-500",
  };

  const rowBg = (i) => i % 2 === 0 ? "bg-zinc-900/20" : "bg-transparent";

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Users</h1>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
            <span>{total} total</span>
            <span className="text-emerald-500">{adminCount} admin</span>
            <span>{buyerCount} buyer</span>
            {dealerCount > 0 && <span className="text-amber-500">{dealerCount} dealer</span>}
          </div>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors shrink-0"
        >
          <UserPlus size={15} /> Add user
        </Link>
      </div>

      {/* Search */}
      <form action="/admin/users" method="GET" className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email…"
              autoComplete="off"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:bg-zinc-950"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/users"
              className="rounded-md border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Deleted flash */}
      {deleted && (
        <div className="rounded-lg border border-emerald-800/45 bg-emerald-950/35 px-4 py-2.5 text-sm text-emerald-300">
          Profile deleted successfully.
        </div>
      )}

      {/* Table */}
      <div className="hidden lg:block">
        <DataTableShell>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  {["User", "Role", "Status", "Joined", ""].map((h) => (
                    <th key={h || "actions"} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((user, i) => (
                  <tr key={user.id} className={`transition-colors hover:bg-zinc-800/30 ${rowBg(i)}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-300">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                        <span className={`h-1.5 w-1.5 rounded-full ${roleDot[user.role]}`} />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        user.active ? "text-emerald-400" : "text-zinc-500"
                      }`}>
                        {user.active ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                        {user.active ? "Active" : "Locked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors inline-flex"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </Link>
                        <form action={`/api/admin/users/${user.id}/toggle`} method="POST" className="inline">
                          <button
                            type="submit"
                            className={`rounded-md border p-1.5 transition-colors ${
                              user.active
                                ? "border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700"
                                : "border-emerald-800/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/60"
                            }`}
                            title={user.active ? "Lock account" : "Unlock account"}
                          >
                            {user.active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                        </form>
                        <Link
                          href={`/admin/users/${user.id}/edit#security`}
                          className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors inline-flex"
                          title="Reset security"
                        >
                          <RefreshCw size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <EmptyState
              title="No users found"
              message={search ? "Try a different search term." : "No users have been created yet."}
              actionHref="/admin/users/new"
              actionLabel="Add user"
              secondaryHref={search ? "/admin/users" : null}
              secondaryLabel={search ? "Clear search" : null}
              icon={<Users size={28} className="text-zinc-500" />}
            />
          )}
        </DataTableShell>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 lg:hidden">
        {users.length === 0 ? (
          <EmptyState
            title="No users found"
            message={search ? "Try a different search term." : "No users have been created yet."}
            actionHref="/admin/users/new"
            actionLabel="Add user"
            secondaryHref={search ? "/admin/users" : null}
            secondaryLabel={search ? "Clear search" : null}
            icon={<Users size={28} className="text-zinc-500" />}
          />
        ) : null}
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-300">
                {user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    user.active ? "text-emerald-400" : "text-zinc-500"
                  }`}>
                    {user.active ? <CheckCircle2 size={11} /> : <Ban size={11} />}
                    {user.active ? "Active" : "Locked"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${roleDot[user.role]}`} />
                    {user.role}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-800">
              <Link
                href={`/admin/users/${user.id}/edit`}
                className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Edit
              </Link>
              <form action={`/api/admin/users/${user.id}/toggle`} method="POST" className="inline">
                <button
                  type="submit"
                  className={`rounded-md border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    user.active
                      ? "border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:text-zinc-200"
                      : "border-emerald-800/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/60"
                  }`}
                >
                  {user.active ? "Lock" : "Unlock"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
