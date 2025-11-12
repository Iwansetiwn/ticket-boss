import React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Today Ticket League | Ticket Monitoring",
  description: "Live leaderboard showing ticket counts by teammate for today.",
}

function formatCount(count: number) {
  return count.toLocaleString()
}

export default async function TodayTicketLeaguePage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  type OwnerGroup = { ownerId: string | null; _count: { _all: number } }

  const grouped = await prisma.ticket.groupBy({
    by: ["ownerId"],
    where: {
      createdAt: { gte: startOfDay },
    },
    _count: { _all: true },
  })

  const counts = new Map(
    grouped.filter((g: OwnerGroup) => g.ownerId).map((g: OwnerGroup) => [g.ownerId!, g._count._all])
  )
  const unassignedCount = grouped.find((g: OwnerGroup) => g.ownerId === null)?._count._all ?? 0

  type Owner = {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }

  const owners = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, avatarUrl: true },
  })

  const leaderboard = owners
    .map((owner: Owner) => ({
      owner,
      count: counts.get(owner.id) ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.count - a.count)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  if (!leaderboard.some((entry) => entry.owner.id === user.id)) {
    leaderboard.push({
      owner: {
        id: user.id,
        name: user.name ?? user.email,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
      },
      count: 0,
      rank: leaderboard.length + 1,
    })
  }

  const totalToday =
    leaderboard.reduce((sum, entry) => sum + entry.count, 0) + unassignedCount

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wide text-brand-500">Today&apos;s League</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ticket count by teammate</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Updated {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(startOfDay)} — total tickets today:
            {" "}
            <span className="font-semibold text-gray-900 dark:text-white">{formatCount(totalToday)}</span>
          </p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
          No tickets have been logged today. Check back after the next shift.
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <div
              key={entry.owner.id}
              className={`flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-center lg:justify-between ${
                entry.owner.id === user.id ? "ring-2 ring-brand-400" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                  {entry.owner.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.owner.avatarUrl}
                      alt={entry.owner.name ?? entry.owner.email}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span>{(entry.owner.name ?? entry.owner.email).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {entry.owner.name ?? entry.owner.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{entry.owner.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide">Tickets today</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCount(entry.count)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide">Rank</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">#{entry.rank}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {unassignedCount > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          <p className="font-medium text-gray-900 dark:text-white">Unassigned tickets</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCount(unassignedCount)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tickets logged today that haven&apos;t been claimed yet.</p>
        </div>
      )}
    </div>
  )
}
