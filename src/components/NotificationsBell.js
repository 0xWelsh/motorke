"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

function formatRelativeTime(value) {
  if (!value) return "Now";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "Now";
  const diffSeconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NotificationsBell({ variant = "portal" }) {
  const isAdmin = variant === "admin";
  const isNavbar = variant === "navbar";
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const dropdownClassName = useMemo(
    () =>
      clsx(
        "absolute right-0 top-full mt-3 w-[360px] max-w-[90vw] rounded-full border shadow-2xl z-50 overflow-hidden",
        isAdmin || isNavbar
          ? "bg-white border-[#ddd4c8] text-slate-900"
          : "bg-white dark:bg-slate-900 border-[#ddd4c8] dark:border-[#ddd4c8] text-slate-900 dark:text-slate-900"
      ),
    [isAdmin, isNavbar]
  );

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=8", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      // Quietly ignore polling errors to avoid disrupting user flow.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const markRead = async (id) => {
    if (!id) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
              readAt: item.readAt || new Date().toISOString(),
            }
          : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        const payload = await response.json();
        setUnreadCount(Number(payload.unreadCount || 0));
      }
    } catch {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    if (busy || unreadCount === 0) return;
    setBusy(true);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (response.ok) {
        const payload = await response.json();
        setUnreadCount(Number(payload.unreadCount || 0));
      }
    } catch {
      fetchNotifications();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "transition-all relative",
          isAdmin
            ? "text-slate-600 hover:text-[#ff5a2f]"
            : isNavbar
              ? "w-10 h-10 rounded-full bg-white border border-[#ddd4c8] text-slate-600 hover:text-[#ff5a2f] hover:border-slate-300 flex items-center justify-center"
            : "w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-[#ddd4c8] dark:border-[#ddd4c8] text-slate-600 dark:text-slate-300 hover:text-[#ff5a2f] dark:hover:text-emerald-400 flex items-center justify-center"
        )}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={clsx(
            "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
            isAdmin || isNavbar
              ? "bg-[#ff5a2f] text-slate-900 border-2 border-white"
              : "bg-[#ff5a2f] text-slate-900 border-2 border-slate-50 dark:border-slate-900"
          )}>
            {Math.min(unreadCount, 99)}
          </span>
        )}
      </button>

      {open && (
        <div className={dropdownClassName}>
          <div className={clsx(
            "px-4 py-3 border-b flex items-center justify-between",
            isAdmin || isNavbar ? "border-[#ddd4c8]" : "border-[#ddd4c8] dark:border-[#ddd4c8]"
          )}>
            <div>
              <p className="text-sm font-bold">Notifications</p>
              <p className={clsx("text-xs", isAdmin || isNavbar ? "text-slate-500" : "text-slate-500 dark:text-slate-400")}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-[#ff5a2f] hover:text-[#ff5a2f] inline-flex items-center gap-1"
                disabled={busy}
              >
                <CheckCheck size={14} /> Mark all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-auto">
            {loading ? (
              <p className={clsx("px-4 py-6 text-sm", isAdmin || isNavbar ? "text-slate-500" : "text-slate-500 dark:text-slate-400")}>
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className={clsx("px-4 py-6 text-sm", isAdmin || isNavbar ? "text-slate-500" : "text-slate-500 dark:text-slate-400")}>
                No notifications yet.
              </p>
            ) : (
              notifications.map((item) => {
                const itemClass = clsx(
                  "block px-4 py-3 border-b transition-colors",
                  isAdmin || isNavbar
                    ? "border-[#ddd4c8] hover:bg-[#fbfcfe]"
                    : "border-[#ddd4c8] dark:border-[#ddd4c8] hover:bg-[#fbfcfe] dark:hover:bg-slate-800/70",
                  item.read ? "opacity-80" : ""
                );

                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold leading-tight">{item.title}</p>
                      {!item.read && <span className="mt-1 w-2 h-2 rounded-full bg-[#ff5a2f] shrink-0" />}
                    </div>
                    <p className={clsx("text-xs mt-1", isAdmin || isNavbar ? "text-slate-600" : "text-slate-600 dark:text-slate-300")}>
                      {item.message}
                    </p>
                    <p className={clsx("text-[11px] mt-1", isAdmin || isNavbar ? "text-slate-500" : "text-slate-500 dark:text-slate-400")}>
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </>
                );

                if (item.link) {
                  return (
                    <Link
                      key={item.id}
                      href={item.link}
                      className={itemClass}
                      onClick={() => {
                        if (!item.read) {
                          markRead(item.id);
                        }
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={clsx(itemClass, "w-full text-left")}
                    onClick={() => {
                      if (!item.read) {
                        markRead(item.id);
                      }
                    }}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
