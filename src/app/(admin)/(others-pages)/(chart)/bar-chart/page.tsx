import BarChartOne from "@/components/charts/bar/BarChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Ticket Monitoring Bar Chart | Ticket Monitoring - Ticket Monitoring Dashboard Template",
  description:
    "This is Ticket Monitoring Bar Chart page for Ticket Monitoring - Ticket Monitoring Tailwind CSS Admin Dashboard Template",
};

export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
