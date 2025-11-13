"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { stripDailyTicketSuffix } from "@/lib/ticketIdentifier";

type NotificationItem = {
  id: string;
  message: string;
  ticketId: string;
  ticketSubject: string;
  createdAt: string;
  isRead: boolean;
};

const absoluteFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [pinnedToasts, setPinnedToasts] = useState<NotificationItem[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const seenNotificationsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const relativeFormatter = useMemo(() => new Intl.RelativeTimeFormat("en", { numeric: "auto" }), []);

  const formatRelativeTimestamp = useCallback(
    (iso: string) => {
      const created = new Date(iso).getTime();
      const diffSeconds = Math.round((created - now) / 1000);
      const absSeconds = Math.abs(diffSeconds);

      if (absSeconds < 60) {
        return relativeFormatter.format(diffSeconds, "second");
      }

      const diffMinutes = Math.round(diffSeconds / 60);
      if (Math.abs(diffMinutes) < 60) {
        return relativeFormatter.format(diffMinutes, "minute");
      }

      const diffHours = Math.round(diffMinutes / 60);
      if (Math.abs(diffHours) < 24) {
        return relativeFormatter.format(diffHours, "hour");
      }

      const diffDays = Math.round(diffHours / 24);
      return relativeFormatter.format(diffDays, "day");
    },
    [now, relativeFormatter]
  );

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  const syncNotificationState = useCallback(
    (incoming: NotificationItem[]) => {
      const nextIds = new Set(incoming.map((notification) => notification.id));

      if (initialLoadRef.current) {
        seenNotificationsRef.current = nextIds;
        initialLoadRef.current = false;
        return;
      }

      const previousIds = seenNotificationsRef.current;
      const fresh = incoming.filter((notification) => !previousIds.has(notification.id));

      if (fresh.length) {
        const orderedFresh = [...fresh].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setPinnedToasts((prev) => {
          const existing = new Set(prev.map((notification) => notification.id));
          const dedupedFresh = orderedFresh.filter((notification) => !existing.has(notification.id));
          return [...dedupedFresh, ...prev];
        });
      }

      seenNotificationsRef.current = nextIds;
    },
    []
  );

  const unreadCount = useMemo(
    () => notifications.reduce((total, notification) => total + (notification.isRead ? 0 : 1), 0),
    [notifications]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) {
          setNotifications([]);
          setError(null);
          setLoading(false);
          return;
        }
        throw new Error("Failed to load notifications");
      }
      const data = (await response.json()) as { notifications: NotificationItem[] };
      const normalized = data.notifications ?? [];
      setNotifications(normalized);
      syncNotificationState(normalized);
      setError(null);
    } catch (err) {
      console.error("Notification fetch failed:", err);
      setError("Unable to load notifications right now.");
    } finally {
      setLoading(false);
    }
  }, [syncNotificationState]);

  useEffect(() => {
    const ACTIVE_POLL_MS = 5_000;
    const IDLE_POLL_MS = 30_000;
    let timeoutId: number | null = null;

    const schedule = (delay: number) => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        await fetchNotifications();
        const nextDelay = document.visibilityState === "visible" ? ACTIVE_POLL_MS : IDLE_POLL_MS;
        schedule(nextDelay);
      }, delay);
    };

    fetchNotifications().finally(() => {
      const initialDelay = document.visibilityState === "visible" ? ACTIVE_POLL_MS : IDLE_POLL_MS;
      schedule(initialDelay);
    });

    const handleVisibility = () => {
      const delay = document.visibilityState === "visible" ? ACTIVE_POLL_MS : IDLE_POLL_MS;
      schedule(delay);
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  const markNotificationsRead = useCallback(async () => {
    if (isMarking || unreadCount === 0) return;
    setIsMarking(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    } finally {
      setIsMarking(false);
    }
  }, [isMarking, unreadCount]);

  const markSpecificNotificationsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((notification) => (ids.includes(notification.id) ? { ...notification, isRead: true } : notification))
      );
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  }, []);

  const dismissToast = (id: string) => {
    setPinnedToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleToastView = async (notification: NotificationItem) => {
    await markSpecificNotificationsRead([notification.id]);
    router.push(`/dashboard/tickets/${notification.ticketId}`);
    dismissToast(notification.id);
  };

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markNotificationsRead();
    }
  }, [isOpen, unreadCount, markNotificationsRead]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const clearNotifications = useCallback(async () => {
    if (isClearing || notifications.length === 0) return;

    setIsClearing(true);
    try {
      const response = await fetch("/api/notifications", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }
      setNotifications([]);
      setPinnedToasts([]);
      seenNotificationsRef.current = new Set();
    } catch (err) {
      console.error("Notification clear failed:", err);
    } finally {
      setIsClearing(false);
    }
  }, [isClearing, notifications.length]);

  const renderBody = () => {
    if (loading) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">You&apos;re all caught up.</p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {notifications.map((notification) => (
          <li key={notification.id} className="py-3">
            <Link
              href={`/dashboard/tickets/${notification.ticketId}`}
              onClick={closeDropdown}
              className="flex flex-col gap-1 rounded-xl px-1 py-1 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:bg-white/5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {notification.ticketSubject || `Ticket ${stripDailyTicketSuffix(notification.ticketId)}`}
                </p>
                <span
                  className="text-[11px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap"
                  title={absoluteFormatter.format(new Date(notification.createdAt))}
                >
                  {formatRelativeTimestamp(notification.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{notification.message}</p>
              {!notification.isRead && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">New</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <span className="absolute right-2.5 top-2.5 inline-flex h-2 w-2 rounded-full bg-brand-500" />
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex w-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[340px] lg:right-0"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
          <h5 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h5>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markNotificationsRead}
                disabled={isMarking}
                className="text-xs font-semibold text-brand-500 transition hover:text-brand-600 disabled:opacity-70"
              >
                {isMarking ? "Marking…" : "Mark all read"}
              </button>
            )}
            {notifications.length > 0 && (
              <>
                <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                <button
                  onClick={clearNotifications}
                  disabled={isClearing}
                  className="text-xs font-semibold text-gray-400 transition hover:text-gray-600 disabled:opacity-70 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {isClearing ? "Clearing…" : "Clear all"}
                </button>
              </>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close notifications"
            >
              <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.41077 4.41074C4.7362 4.08531 5.26384 4.08531 5.58927 4.41074L10.0006 8.82207L14.4119 4.41074C14.7373 4.08531 15.265 4.08531 15.5904 4.41074C15.9158 4.73617 15.9158 5.2638 15.5904 5.58924L11.1791 10.0006L15.5904 14.4119C15.9158 14.7373 15.9158 15.265 15.5904 15.5904C15.265 15.9158 14.7373 15.9158 14.4119 15.5904L10.0006 11.1791L5.58927 15.5904C5.26384 15.9158 4.7362 15.9158 4.41077 15.5904C4.08534 15.265 4.08534 14.7373 4.41077 14.4119L8.8221 10.0006L4.41077 5.58924C4.08534 5.26381 4.08534 4.73617 4.41077 4.41074Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-3 max-h-[360px] flex-1 overflow-y-auto pr-1">
          {renderBody()}
        </div>
      </Dropdown>

      {pinnedToasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[1100] flex w-full max-w-md flex-col gap-4">
          {pinnedToasts.map((toast) => (
            <article
              key={toast.id}
              className="rounded-3xl border border-gray-200/80 bg-white/90 p-5 shadow-2xl backdrop-blur-lg transition dark:border-white/10 dark:bg-gray-900/90"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.5c-.69 0-1.25.56-1.25 1.25V4.3a7.5 7.5 0 0 0-6.25 7.2v4.65H4a1.25 1.25 0 0 0 0 2.5h16a1.25 1.25 0 0 0 0-2.5h-.5v-4.65a7.5 7.5 0 0 0-6.25-7.2v-.55c0-.69-.56-1.25-1.25-1.25ZM8.75 20.5c0 .69.56 1.25 1.25 1.25h4c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25h-4c-.69 0-1.25.56-1.25 1.25Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">New ticket logged</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {toast.ticketSubject || `Ticket ${stripDailyTicketSuffix(toast.ticketId)}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                    Please update the ticket&apos;s categories so routing and reporting stay accurate.
                  </p>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.41077 4.41074C4.7362 4.08531 5.26384 4.08531 5.58927 4.41074L10.0006 8.82207L14.4119 4.41074C14.7373 4.08531 15.265 4.08531 15.5904 4.41074C15.9158 4.73617 15.9158 5.2638 15.5904 5.58924L11.1791 10.0006L15.5904 14.4119C15.9158 14.7373 15.9158 15.265 15.5904 15.5904C15.265 15.9158 14.7373 15.9158 14.4119 15.5904L10.0006 11.1791L5.58927 15.5904C5.26384 15.9158 4.7362 15.9158 4.41077 15.5904C4.08534 15.265 4.08534 14.7373 4.41077 14.4119L8.8221 10.0006L4.41077 5.58924C4.08534 5.26381 4.08534 4.73617 4.41077 4.41074Z"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-white/10 dark:text-gray-100">
                  {stripDailyTicketSuffix(toast.ticketId)}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                  Category pending
                </span>
                <span>
                  Logged {formatRelativeTimestamp(toast.createdAt)} • {absoluteFormatter.format(new Date(toast.createdAt))}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => handleToastView(toast)}
                  className="flex-1 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-600"
                >
                  Review ticket
                </button>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 dark:border-white/10 dark:text-gray-200 dark:hover:border-white/30"
                >
                  Mark later
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
