"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "@/components/tickets/constants";

type TicketEditFormProps = {
  ticket: {
    id: string;
    clientName: string;
    brand: string;
    subject: string;
    status: string;
    issueCategory: string;
    lastUpdated: string;
    ticketUrl?: string | null;
  };
};

export default function TicketEditForm({ ticket }: TicketEditFormProps) {
  const router = useRouter();
  const [clientName, setClientName] = useState(ticket.clientName ?? "");
  const [brand, setBrand] = useState(ticket.brand ?? "");
  const [subject, setSubject] = useState(ticket.subject ?? "");
  const [status, setStatus] = useState(ticket.status || "Open");
  const [issueCategory, setIssueCategory] = useState(ticket.issueCategory || "Uncategorized");
  const [ticketUrl, setTicketUrl] = useState(ticket.ticketUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(clientName.trim() && brand.trim() && subject.trim());
  }, [brand, clientName, subject]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          brand: brand.trim(),
          subject: subject.trim(),
          status,
          issueCategory,
          ticketUrl: ticketUrl.trim(),
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to update ticket");
      }

      setMessage("Ticket updated successfully.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update ticket";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Client name
            <input
              type="text"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Client name"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Brand
            <input
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Brand"
            />
          </label>

          <label className="col-span-full flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Subject
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Subject"
            />
          </label>

          <label className="col-span-full flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Ticket link
            <input
              type="url"
              inputMode="url"
              value={ticketUrl}
              onChange={(event) => setTicketUrl(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="https://example.com/support/ticket"
            />
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Used when opening the original ticket from this dashboard.
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Category
            <select
              value={issueCategory}
              onChange={(event) => setIssueCategory(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col justify-center text-sm text-gray-500 dark:text-gray-400">
            <span>Last updated</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(ticket.lastUpdated))}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-emerald-500">{message}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
