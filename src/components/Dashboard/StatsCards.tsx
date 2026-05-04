import { Users, UserCheck, CalendarHeart, Droplets } from "lucide-react";
import type { Donor } from "@/lib/constants";
import { computeEligibility } from "@/lib/constants";
import { startOfMonth, isAfter } from "date-fns";

interface StatsCardsProps {
  donors: Donor[];
}

const StatsCards = ({ donors }: StatsCardsProps) => {
  const today = new Date();
  const monthStart = startOfMonth(today);

  const totalDonors = donors.length;

  const eligibleDonors = donors.filter((d) => computeEligibility(d, today).eligible).length;

  const donationsThisMonth = donors.filter(
    (d) => d.last_donation_date && isAfter(new Date(d.last_donation_date), monthStart)
  ).length;

  const bloodTypeCounts: Record<string, number> = {};
  donors.forEach((d) => {
    bloodTypeCounts[d.blood_type] = (bloodTypeCounts[d.blood_type] || 0) + 1;
  });
  const mostCommon = Object.entries(bloodTypeCounts).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { label: "إجمالي المتبرعين", value: totalDonors, icon: Users, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "مؤهلون حالياً", value: eligibleDonors, icon: UserCheck, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { label: "تبرعات هذا الشهر", value: donationsThisMonth, icon: CalendarHeart, color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "أكثر فصيلة شيوعاً", value: mostCommon?.[0] || "-", icon: Droplets, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</span>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
