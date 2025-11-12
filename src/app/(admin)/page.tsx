import type { Metadata } from "next";
import React from "react";

import TicketMetrics from "@/components/dashboard/TicketMetrics";
import TicketBrandBreakdown from "@/components/dashboard/TicketBrandBreakdown";
import TicketTimelineChart from "@/components/dashboard/TicketTimelineChart";
import TicketPerfCard from "@/components/dashboard/TicketPerfCard";
import TicketIssueComparison from "@/components/dashboard/TicketIssueComparison";
import prisma from "@/lib/prisma";
import { getTicketDayKey, getUtcDayBounds } from "@/lib/ticketIdentifier";

export const metadata: Metadata = {
  title: "Ticket Monitoring Dashboard",
  description: "Live ticket analytics for your ticket monitoring workspace.",
};

type TicketSummary = {
  total: number;
  today: number;
};

const TIMELINE_DAYS = 10;
const TIMEZONE_LABEL = "UTC";

const normalizeLabel = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const toRankedBuckets = <T extends { _count: { _all: number } }>(
  items: T[],
  getLabel: (item: T) => string,
  limit: number
) => {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const label = getLabel(item);
    map.set(label, (map.get(label) ?? 0) + item._count._all);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
};

export default async function DashboardPage() {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = getUtcDayBounds(now);

  const yesterdayReference = new Date(todayStart);
  yesterdayReference.setUTCDate(yesterdayReference.getUTCDate() - 1);
  const { start: yesterdayStart, end: yesterdayEnd } = getUtcDayBounds(
    yesterdayReference
  );

  const timelineStart = new Date(todayStart);
  timelineStart.setUTCDate(timelineStart.getUTCDate() - (TIMELINE_DAYS - 1));

  type BrandGroup = { brand: string | null; _count: { _all: number } };
  type IssueGroup = { issueCategory: string | null; _count: { _all: number } };

  const [
    totalTickets,
    todayTickets,
    yesterdayTickets,
    brandAllRaw,
    brandTodayRaw,
    issueCategoryRaw,
    recentTicketDates,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.ticket.count({
      where: { createdAt: { gte: yesterdayStart, lt: yesterdayEnd } },
    }),
    prisma.ticket.groupBy({
      by: ["brand"],
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["brand"],
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["issueCategory"],
      _count: { _all: true },
    }),
    prisma.ticket.findMany({
      where: { createdAt: { gte: timelineStart, lt: todayEnd } },
      select: { createdAt: true },
    }),
  ]);

  const summary: TicketSummary = {
    total: totalTickets,
    today: todayTickets,
  };

  const brandAllData = toRankedBuckets<BrandGroup>(
    brandAllRaw,
    (item) => normalizeLabel(item.brand, "Unknown"),
    6
  ).map(({ label, count }) => ({ brand: label, count }));

  const brandTodayData = toRankedBuckets<BrandGroup>(
    brandTodayRaw,
    (item) => normalizeLabel(item.brand, "Unknown"),
    6
  ).map(({ label, count }) => ({ brand: label, count }));

  const issueComparisonData = toRankedBuckets<IssueGroup>(
    issueCategoryRaw,
    (item) => normalizeLabel(item.issueCategory, "Uncategorized"),
    6
  ).map(({ label, count }) => ({ category: label, count }));

  const timelineBuckets = new Map<string, number>();
  for (let i = TIMELINE_DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(todayStart);
    day.setUTCDate(day.getUTCDate() - i);
    timelineBuckets.set(getTicketDayKey(day), 0);
  }

  recentTicketDates.forEach((ticket: { createdAt: Date }) => {
    const key = getTicketDayKey(ticket.createdAt);
    if (timelineBuckets.has(key)) {
      timelineBuckets.set(key, (timelineBuckets.get(key) ?? 0) + 1);
    }
  });

  const timelineData = Array.from(timelineBuckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      <TicketMetrics summary={summary} goalPerDay={32} timezoneLabel={TIMEZONE_LABEL} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-8 h-full">
          <TicketTimelineChart data={timelineData} timezoneLabel={TIMEZONE_LABEL} />
        </div>

        <div className="flex h-full flex-col gap-6 lg:col-span-4">
          <TicketPerfCard today={summary.today} yesterday={yesterdayTickets} />
          <TicketBrandBreakdown allTime={brandAllData} today={brandTodayData} />
        </div>
      </div>

      <TicketIssueComparison data={issueComparisonData} />
    </div>
  );
}
