import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDonors } from "@/hooks/useDonors";
import { LogOut, Droplets } from "lucide-react";
import { differenceInYears } from "date-fns";
import DashboardBackground from "@/components/Dashboard/DashboardBackground";
import StatsCards from "@/components/Dashboard/StatsCards";
import DonorsFilters, { type FiltersState } from "@/components/Dashboard/DonorsFilters";
import DonorsTable from "@/components/Dashboard/DonorsTable";
import BloodTypeChart from "@/components/Dashboard/BloodTypeChart";
import EmergencyModal from "@/components/Dashboard/EmergencyModal";
import AddDonorModal from "@/components/Dashboard/AddDonorModal";
import { ELIGIBILITY_DAYS, computeEligibility } from "@/lib/constants";

const defaultFilters: FiltersState = {
  search: "",
  bloodType: "",
  wilaya: "",
  eligibility: "",
  ageMin: 18,
  ageMax: 65,
};

const Dashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: donors = [], isLoading } = useDonors();
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  const filteredDonors = useMemo(() => {
    const today = new Date();
    return donors.filter((d) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!d.full_name.toLowerCase().includes(s) && !d.phone_whatsapp.includes(s)) return false;
      }
      if (filters.bloodType && d.blood_type !== filters.bloodType) return false;
      if (filters.wilaya && d.wilaya !== filters.wilaya) return false;
      if (filters.eligibility) {
        const e = computeEligibility(d, today);
        if (filters.eligibility === "eligible" && !e.eligible) return false;
        if (filters.eligibility === "not_eligible" && e.eligible) return false;
        if (filters.eligibility === "never" && d.last_donation_date) return false;
      }
      if (d.date_of_birth) {
        const age = differenceInYears(today, new Date(d.date_of_birth));
        if (age < filters.ageMin || age > filters.ageMax) return false;
      }
      return true;
    });
  }, [donors, filters]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen relative" dir="rtl">
      <DashboardBackground />

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">لوحة إدارة التبرع بالدم</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">القرارة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddDonorModal />
            <EmergencyModal donors={donors} />
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <StatsCards donors={donors} />

        <DonorsFilters filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <BloodTypeChart donors={donors} />
          </div>
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <DonorsTable donors={filteredDonors} allDonors={donors} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
