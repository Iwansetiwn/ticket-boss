import React from "react";

type Props = {
  today: number;
  yesterday: number;
};

const formatter = new Intl.NumberFormat("en-US");

export default function TicketPerfCard({ today, yesterday }: Props) {
  const delta = today - yesterday;
  let trendText: string;

  if (yesterday === 0) {
    trendText =
      today === 0
        ? "No tickets recorded in the last two days."
        : "No tickets yesterday—comparison will appear once there is history.";
  } else if (delta === 0) {
    trendText = "No change from yesterday";
  } else {
    const percent = Math.abs((delta / yesterday) * 100).toFixed(1);
    trendText = delta > 0 ? `${percent}% more than yesterday` : `${percent}% fewer than yesterday`;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">Today vs Yesterday</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-semibold text-gray-900 dark:text-white">{formatter.format(today)}</span>
        <span className="text-sm text-gray-400 dark:text-gray-500">today</span>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Yesterday: {formatter.format(yesterday)} tickets • {trendText}
      </p>
    </div>
  );
}
