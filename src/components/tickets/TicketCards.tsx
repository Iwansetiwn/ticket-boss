"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import Badge from "@/components/ui/badge/Badge";
import TicketPagination from "@/components/tickets/TicketPagination";
import Input from "@/components/form/input/InputField";

export type TicketCardData = {
  id: string;
  clientName?: string | null;
  brand?: string | null;
  subject?: string | null;
  product?: string | null;
  status?: string | null;
  updatedAt: string;
};

type Props = {
  tickets: TicketCardData[];
  initialPageSize?: number;
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

export default function TicketCards({ tickets, initialPageSize = 8 }: Props) {
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

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    return records.filter((ticket) => {
      const haystack = [
        ticket.id,
        ticket.subject ?? "",
        ticket.brand ?? "",
        ticket.product ?? "",
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
    setRecords(tickets)
  }, [tickets])

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

  async function handleDelete(id: string) {
    if (!confirm("Delete this ticket? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json?.error || "Failed to delete ticket");
        return;
      }
      const wasVisible = filteredRecords.some((ticket) => ticket.id === id);
      const nextRecords = records.filter((ticket) => ticket.id !== id);
      setRecords(nextRecords);

      if (wasVisible) {
        const newFilteredLength = filteredRecords.length - 1;
        const newTotal = Math.max(1, Math.ceil(newFilteredLength / pageSize));
        if (page > newTotal) setPage(newTotal);
      }
    } catch (error) {
      console.error("Failed to delete ticket", error);
      alert("Failed to delete ticket");
    }
  }

  return (
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
                placeholder="Search by ticket id, subject, brand, or product"
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

        {paginated.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
            No tickets found for this filter set. Try adjusting your filters to view older shifts.
          </div>
        ) : (
          <div className="space-y-4">
            {paginated.map((ticket) => (
              <article
                key={ticket.id}
                className="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="grid gap-4 lg:flex-1 lg:grid-cols-[150px_150px_180px_minmax(220px,_1fr)]">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Ticket
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">#{ticket.id}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Brand</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{ticket.brand || "—"}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Product</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{ticket.product || "—"}</p>
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
                      onClick={() => handleDelete(ticket.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
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
    </div>
  );
}
