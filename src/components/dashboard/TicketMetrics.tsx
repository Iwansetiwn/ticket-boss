"use client";

import React, { useState } from "react";

import Badge from "@/components/ui/badge/Badge";
import { ShootingStarIcon, BoltIcon } from "@/icons";

type TicketSummary = {
  total: number;
  today: number;
};

type Props = {
  summary: TicketSummary;
  goalPerDay: number;
  timezoneLabel: string;
};

const formatter = new Intl.NumberFormat("en-US");

export default function TicketMetrics({ summary, goalPerDay, timezoneLabel }: Props) {
  const [dailyGoal, setDailyGoal] = useState(goalPerDay);
  const progress = Math.min(100, Math.round((summary.today / dailyGoal) * 100));
  const remaining = Math.max(dailyGoal - summary.today, 0);

  const handleGoalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);

    if (Number.isNaN(nextValue)) {
      return;
    }

    const normalizedValue = Math.max(Math.floor(nextValue), 1);
    setDailyGoal(normalizedValue);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">All-time Tickets</p>
            <h3 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{formatter.format(summary.total)}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tracking since your dashboard went live.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
            <ShootingStarIcon className="size-6" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tickets Today</p>
            <h3 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{formatter.format(summary.today)}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Since 12:00 AM {timezoneLabel}.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15">
            <BoltIcon className="size-6" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Daily Goal</p>
              <h3 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{dailyGoal} tickets</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Keeps the queue healthy.</p>
            </div>
            <Badge color={remaining > 0 ? "warning" : "success"} size="sm">
              {remaining > 0 ? `${remaining} remaining` : "Goal met"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <label className="font-medium text-gray-700 dark:text-gray-300" htmlFor="daily-goal-input">
              Goal limit
            </label>
            <input
              id="daily-goal-input"
              type="number"
              min={1}
              step={1}
              value={dailyGoal}
              onChange={handleGoalChange}
              className="w-24 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-brand-400 dark:focus:ring-brand-500/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all dark:bg-brand-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
