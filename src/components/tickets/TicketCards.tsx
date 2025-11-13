"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import Badge from "@/components/ui/badge/Badge";
import TicketPagination from "@/components/tickets/TicketPagination";
import Input from "@/components/form/input/InputField";
import { CATEGORY_OPTIONS } from "@/components/tickets/constants";
import { getSupportInboxLink } from "@/lib/supportInbox";
import { stripDailyTicketSuffix } from "@/lib/ticketIdentifier";
import { Modal } from "@/components/ui/modal";
import type { TicketRecord } from "@/types/tickets";

export type TicketCardData = {
  id: string;
  clientName?: string | null;
  brand?: string | null;
  subject?: string | null;
  product?: string | null;
  issueCategory?: string | null;
  ticketUrl?: string | null;
  status?: string | null;
  updatedAt: string;
};

type Props = {
  tickets: TicketCardData[];
  initialPageSize?: number;
  liveRefreshInterval?: number;
};

const statusColorMap: Record<string, "success" | "warning" | "error" | "info"> = {
  open: "success",
  pending: "warning",
  resolved: "success",
  closed: "error",
};

const statusBadgeColor = (status?: string | null) => {
  if (!status) return "info";
  const normalized = status.toLowerCase();
  return statusColorMap[normalized] || "info";
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function TicketCards({ tickets, initialPageSize = 8, liveRefreshInterval }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [records, setRecords] = useState(tickets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7" | "30" | "older" | "custom">("30");
  const [customDate, setCustomDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<TicketCardData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  type UndoToastState = { ticket: TicketRecord | null; label: string; id: string; error?: string };
  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showCalendar) return;
    const handler = (event: MouseEvent) => {
      if (!calendarRef.current) return;
      if (!calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [showCalendar]);

  useEffect(() => {
    if (customDate) {
      const parsed = new Date(customDate);
      if (!Number.isNaN(parsed.getTime())) {
        setCalendarMonth(parsed);
      }
    }
  }, [customDate]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    return records.filter((ticket) => {
      const haystack = [
        ticket.id,
        ticket.subject ?? "",
        ticket.brand ?? "",
        ticket.issueCategory ?? "",
        ticket.ticketUrl ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = needle ? haystack.includes(needle) : true;

      const normalizedStatus = ticket.status?.toLowerCase();
      const matchesStatus =
        statusFilter === "all" ? true : normalizedStatus === statusFilter.toLowerCase();

      const updatedAt = new Date(ticket.updatedAt).getTime();
      let matchesDate = true;
      if (dateFilter === "today") {
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        matchesDate = updatedAt >= startOfDay;
      } else if (dateFilter === "7") {
        matchesDate = now - updatedAt <= msInDay * 7;
      } else if (dateFilter === "30") {
        matchesDate = now - updatedAt <= msInDay * 30;
      } else if (dateFilter === "older") {
        matchesDate = now - updatedAt > msInDay * 30;
      } else if (dateFilter === "custom" && customDate) {
        const filterDay = new Date(customDate).setHours(0, 0, 0, 0);
        const nextDay = filterDay + msInDay;
        matchesDate = updatedAt >= filterDay && updatedAt < nextDay;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [records, search, statusFilter, dateFilter, customDate]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRecords.length / pageSize)),
    [filteredRecords.length, pageSize]
  );

  const paginated = useMemo(
    () => filteredRecords.slice((page - 1) * pageSize, page * pageSize),
    [filteredRecords, page, pageSize]
  );

  useEffect(() => {
    setRecords(tickets);
  }, [tickets]);

  useEffect(() => {
    const minInterval = 4000;
    const baseInterval = Math.max(liveRefreshInterval ?? minInterval, minInterval);
    const idleInterval = baseInterval * 3;
    let isMounted = true;
    let timeoutId: number | null = null;

    const watchedFields: Array<keyof TicketCardData> = [
      "updatedAt",
      "status",
      "ticketUrl",
      "issueCategory",
      "subject",
      "product",
      "brand",
      "clientName"
    ];

    const scheduleNextPoll = () => {
      if (!isMounted) return;
      const delay = document.visibilityState === "visible" ? baseInterval : idleInterval;
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(fetchLatestTickets, delay);
    };

    async function fetchLatestTickets() {
      try {
        const response = await fetch("/api/dashboard/tickets", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { tickets?: TicketCardData[] };
        if (!isMounted || !payload.tickets) return;
        setRecords((prev) => {
          const incoming = payload.tickets ?? [];
          const nextIds = new Set(incoming.map((ticket) => ticket.id));
          const hasStructuralChange =
            prev.length !== incoming.length ||
            incoming.some((ticket) => {
              const previous = prev.find((item) => item.id === ticket.id);
              if (!previous) return true;
              return watchedFields.some((field) => previous[field] !== ticket[field]);
            }) ||
            prev.some((ticket) => !nextIds.has(ticket.id));

          return hasStructuralChange ? incoming : prev;
        });
      } catch (error) {
        console.error("Failed to refresh tickets", error);
      } finally {
        scheduleNextPoll();
      }
    }

    fetchLatestTickets();

    const handleVisibility = () => scheduleNextPoll();

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      if (timeoutId) window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [liveRefreshInterval]);

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    dateFilter !== "30" ||
    Boolean(customDate);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("30");
    setCustomDate("");
    setShowCalendar(false);
    setPage(1);
  }

  function updateTicketMeta(id: string, meta: { issueCategory?: string | null }) {
    setRecords((prev) =>
      prev.map((ticket) => (ticket.id === id ? { ...ticket, ...meta } : ticket))
    );
  }

  const calendarDays = useMemo(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const days: Array<{ date: Date; label: number }> = [];

    const leading = start.getDay();
    for (let i = 0; i < leading; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() - (leading - i));
      days.push({ date, label: date.getDate() });
    }

    for (let day = 1; day <= end.getDate(); day++) {
      days.push({ date: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day), label: day });
    }

    const trailing = 42 - days.length; // fill 6 weeks
    for (let i = 1; i <= trailing; i++) {
      const date = new Date(end);
      date.setDate(end.getDate() + i);
      days.push({ date, label: date.getDate() });
    }

    return days;
  }, [calendarMonth]);

  const formattedCustomDate = customDate
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(customDate)
      )
    : null;

  function isSameDay(dateA: Date, dateB: Date) {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  function handleCalendarSelect(date: Date) {
    setCustomDate(date.toISOString().slice(0, 10));
    setDateFilter("custom");
    setShowCalendar(false);
    setPage(1);
  }

  function changeMonth(offset: number) {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function mapTicketRecordToCard(record: TicketRecord): TicketCardData {
    return {
      id: record.id,
      clientName: record.clientName,
      brand: record.brand,
      subject: record.subject,
      product: record.product,
      issueCategory: record.issueCategory,
      ticketUrl: record.ticketUrl,
      status: record.status,
      updatedAt: record.updatedAt,
    };
  }

  async function fetchTicketSnapshot(id: string): Promise<TicketRecord | null> {
    try {
      const response = await fetch(`/api/tickets/${id}`);
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { ticket: TicketRecord };
      return data.ticket;
    } catch (error) {
      console.error("Failed to fetch ticket details", error);
      return null;
    }
  }

  function openDeleteDialog(ticket: TicketCardData) {
    setTicketToDelete(ticket);
    setDeleteError(null);
  }

  function closeDeleteDialog() {
    if (isDeleting) return;
    setTicketToDelete(null);
  }

  function showUndoToast(record: TicketRecord | null, fallbackLabel: string, fallbackId: string) {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    setUndoToast({ ticket: record, label: fallbackLabel, id: fallbackId, error: undefined });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoToast(null);
      undoTimerRef.current = null;
    }, 3000);
  }

  function dismissUndoToast() {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoToast(null);
  }

  async function handleUndo() {
    if (!undoToast?.ticket) return;
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setIsUndoing(true);
    try {
      const res = await fetch("/api/tickets/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: undoToast.ticket }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to restore ticket");
      }
      const data = (await res.json()) as { ticket: TicketRecord };
      const restoredCard = mapTicketRecordToCard(data.ticket);
      setRecords((prev) => {
        const without = prev.filter((ticket) => ticket.id !== restoredCard.id);
        return [restoredCard, ...without];
      });
      setUndoToast(null);
    } catch (error) {
      console.error("Failed to undo delete", error);
      const message = error instanceof Error ? error.message : "Failed to undo delete";
      setUndoToast((prev) => (prev ? { ...prev, error: message } : prev));
      undoTimerRef.current = window.setTimeout(() => {
        setUndoToast(null);
        undoTimerRef.current = null;
      }, 3000);
    } finally {
      setIsUndoing(false);
    }
  }

  async function confirmDelete() {
    if (!ticketToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    const targetId = ticketToDelete.id;
    const snapshot = await fetchTicketSnapshot(targetId);
    const label = ticketToDelete.subject || `Ticket ${targetId}`;
    try {
      const res = await fetch(`/api/tickets/${targetId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to delete ticket");
      }
      const wasVisible = filteredRecords.some((ticket) => ticket.id === targetId);
      const nextRecords = records.filter((ticket) => ticket.id !== targetId);
      setRecords(nextRecords);

      if (wasVisible) {
        const newFilteredLength = filteredRecords.length - 1;
        const newTotal = Math.max(1, Math.ceil(newFilteredLength / pageSize));
        if (page > newTotal) setPage(newTotal);
      }

      showUndoToast(snapshot, label, targetId);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Failed to delete ticket", error);
      setDeleteError(error instanceof Error ? error.message : "Failed to delete ticket");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-lg shadow-gray-200/40 dark:border-white/5 dark:bg-white/[0.02] dark:shadow-none sm:p-6">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tickets</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and track conversations from any shift or day.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500 dark:text-gray-400">Per page</label>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {[4, 8, 12, 20].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by ticket id, subject, brand, or category"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <div className="flex flex-col gap-2">
                <select
                  value={dateFilter}
                  onChange={(event) => {
                    const value = event.target.value as typeof dateFilter;
                    setDateFilter(value);
                    if (value !== "custom") {
                      setCustomDate("");
                    }
                    setShowCalendar(value === "custom");
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="today">Today</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="older">Older than 30 days</option>
                  <option value="all">All time</option>
                  <option value="custom">Specific day</option>
                </select>
                {dateFilter === "custom" && (
                  <div className="relative" ref={calendarRef}>
                    <button
                      type="button"
                      onClick={() => setShowCalendar((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      <span>{formattedCustomDate || "Choose a date"}</span>
                      <svg
                        className={`size-4 transition ${showCalendar ? "rotate-180" : ""}`}
                        viewBox="0 0 17 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.5 1.5L8.5 8.5L15.5 1.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

                    {showCalendar && (
                      <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-gray-900">
                        <div className="mb-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-white">
                          <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="rounded-full px-2 py-1 text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            ‹
                          </button>
                          <span>
                            {calendarMonth.toLocaleString("en", { month: "long", year: "numeric" })}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="rounded-full px-2 py-1 text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            ›
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 dark:text-gray-500">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                            <span key={day}>{day}</span>
                          ))}
                        </div>
                        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                          {calendarDays.map(({ date, label }, idx) => {
                            const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                            const isSelected = customDate && isSameDay(date, new Date(customDate));
                            const isToday = isSameDay(date, new Date());
                            return (
                              <button
                                type="button"
                                key={`${date.toISOString()}-${idx}`}
                                onClick={() => handleCalendarSelect(date)}
                                className={`h-9 rounded-full text-sm transition ${
                                  isSelected
                                    ? "bg-brand-500 text-white"
                                    : isToday
                                    ? "border border-brand-400 text-brand-500"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                                } ${!isCurrentMonth ? "text-gray-400 dark:text-gray-500" : ""}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
            No tickets found for this filter set. Try adjusting your filters to view older shifts.
          </div>
        ) : (
          <div className="space-y-4">
            {paginated.map((ticket) => {
              const externalTicketUrl = ticket.ticketUrl || getSupportInboxLink(ticket.id);
              const displayTicketId = stripDailyTicketSuffix(ticket.id);

              return (
                <article
                  key={ticket.id}
                  className="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="grid gap-4 lg:flex-1 lg:grid-cols-[150px_150px_220px_minmax(220px,_1fr)]">
                    <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Ticket
                    </p>
                    <Link
                      href={externalTicketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-gray-900 transition hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:focus-visible:ring-offset-gray-900 whitespace-nowrap leading-tight"
                    >
                      #{displayTicketId}
                    </Link>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Brand</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{ticket.brand || "—"}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Category</p>
                    <select
                      value={ticket.issueCategory || "Uncategorized"}
                      onChange={async (event) => {
                        const nextCategory = event.target.value;
                        updateTicketMeta(ticket.id, { issueCategory: nextCategory });
                        try {
                          const res = await fetch(`/api/tickets/${ticket.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ issueCategory: nextCategory }),
                          });
                          if (!res.ok) {
                            throw new Error();
                          }
                        } catch (error) {
                          console.error("Failed to update category", error);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                    <div className="flex flex-col gap-1 lg:col-auto">
                      <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Subject</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {ticket.subject || "No subject"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 text-xs text-gray-500 dark:text-gray-400 sm:items-end sm:text-right">
                    <Badge color={statusBadgeColor(ticket.status)} size="sm">
                      {ticket.status || "Unknown"}
                    </Badge>
                    <span>Updated {formatDate(ticket.updatedAt)}</span>
                    <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => openDeleteDialog(ticket)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      Delete
                    </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length}
          </p>
          <TicketPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Modal
        isOpen={Boolean(ticketToDelete)}
        onClose={closeDeleteDialog}
        showCloseButton={!isDeleting}
        className="max-w-lg p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete ticket</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete
            {ticketToDelete?.subject ? ` "${ticketToDelete.subject}"` : " this ticket"}? This action cannot be
            undone unless you use undo immediately.
          </p>
          {deleteError && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-200">
              {deleteError}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900 disabled:opacity-50 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {undoToast && (
        <div className="fixed bottom-6 left-1/2 z-[1100] w-full max-w-sm -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Ticket deleted</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {undoToast.label} removed. Undo expires in 3 seconds.
              </p>
              {undoToast.error && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">{undoToast.error}</p>
              )}
            </div>
            <button
              onClick={dismissUndoToast}
              aria-label="Dismiss"
              className="text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"
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
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={handleUndo}
              disabled={isUndoing || !undoToast.ticket || Boolean(undoToast.error)}
              className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {isUndoing ? "Restoring…" : "Undo"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
