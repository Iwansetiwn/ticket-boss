import type { Metadata } from "next";
import React from "react";

import TicketMetrics from "@/components/dashboard/TicketMetrics";
import TicketBrandBreakdown from "@/components/dashboard/TicketBrandBreakdown";
import TicketTimelineChart from "@/components/dashboard/TicketTimelineChart";
import TicketPerfCard from "@/components/dashboard/TicketPerfCard";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Ticket Monitoring Dashboard",
  description: "Live ticket analytics for your ticket monitoring workspace.",
};

type TicketSummary = {
  total: number;
  today: number;
};

export default async function DashboardPage() {
  const tickets = await prisma.ticket.findMany({
    select: {
      brand: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
  });

  const summary: TicketSummary = {
    total: tickets.length,
    today: 0,
  };

  const brandMapAll = new Map<string, number>();
  const brandMapToday = new Map<string, number>();
  const timelineMap = new Map<string, number>();
  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayKey = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let yesterdayCount = 0;

  tickets.forEach((ticket) => {
    const brandKey = ticket.brand?.trim() || "Unknown";

    const dayKey = ticket.updatedAt.toISOString().slice(0, 10);
    if (dayKey === todayKey) summary.today += 1;
    if (dayKey === yesterdayKey) yesterdayCount += 1;

    brandMapAll.set(brandKey, (brandMapAll.get(brandKey) || 0) + 1);
    if (dayKey === todayKey) {
      brandMapToday.set(brandKey, (brandMapToday.get(brandKey) || 0) + 1);
    }

    timelineMap.set(dayKey, (timelineMap.get(dayKey) || 0) + 1);
  });

  const toBrandArray = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([brand, count]) => ({ brand, count }));

  const brandAllData = toBrandArray(brandMapAll);
  const brandTodayData = toBrandArray(brandMapToday);

  const timelineData = Array.from(timelineMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-10)
    .map(([date, count]) => ({ date, count }));

  return (
    <div className="space-y-6 md:space-y-8">
      <TicketMetrics summary={summary} goalPerDay={32} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-8 h-full">
          <TicketTimelineChart data={timelineData} />
        </div>

        <div className="flex h-full flex-col gap-6 lg:col-span-4">
          <TicketPerfCard today={summary.today} yesterday={yesterdayCount} />
          <TicketBrandBreakdown allTime={brandAllData} today={brandTodayData} />
        </div>
      </div>
    </div>
  );
}
