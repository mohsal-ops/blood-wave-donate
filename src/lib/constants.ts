import { differenceInDays } from "date-fns";

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

export const BLOOD_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "O+": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/50" },
  "O-": { bg: "bg-blue-800/20", text: "text-blue-300", border: "border-blue-800/50" },
  "A+": { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/50" },
  "A-": { bg: "bg-emerald-700/20", text: "text-emerald-300", border: "border-emerald-700/50" },
  "B+": { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" },
  "B-": { bg: "bg-red-700/20", text: "text-red-300", border: "border-red-700/50" },
  "AB+": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/50" },
  "AB-": { bg: "bg-purple-700/20", text: "text-purple-300", border: "border-purple-700/50" },
};

export const WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار",
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر",
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة",
  "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وهران", "البيض",
  "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تيسمسيلت", "الوادي", "خنشلة",
  "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية",
  "غليزان", "تيميمون", "برج باجي مختار", "أولاد جلال", "بني عباس", "إن صالح",
  "إن قزام", "توقرت", "جانت", "المغير", "المنيعة"
];

export const ELIGIBILITY_DAYS = 90; // 3 months

export type Donor = {
  id: string;
  full_name: string;
  phone_whatsapp: string;
  phone_secondary: string | null;
  wilaya: string | null;
  municipality: string | null;
  blood_type: string;
  last_donation_date: string | null;
  date_of_birth: string | null;
  gender: string | null;
  is_active: boolean;
  total_donations: number;
  has_chronic_disease: string | null;
  eligibility_override: string | null; // 'eligible' | 'not_eligible' | null (auto)
  ineligibility_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type EligibilityResult = {
  eligible: boolean;
  days: number;
  label: string;
  reason?: string;
  source: "override" | "inactive" | "chronic" | "recent" | "auto";
};

const isChronic = (val: string | null | undefined) => {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed === "لا" || trimmed.toLowerCase() === "no") return false;
  return true;
};

export const computeEligibility = (donor: Donor, today: Date = new Date()): EligibilityResult => {
  if (donor.eligibility_override === "not_eligible") {
    return { eligible: false, days: 0, label: "غير مؤهل (يدوي)", reason: donor.ineligibility_reason || undefined, source: "override" };
  }
  if (donor.eligibility_override === "eligible") {
    return { eligible: true, days: 0, label: "مؤهل (يدوي) ✅", source: "override" };
  }
  if (!donor.is_active) {
    return { eligible: false, days: 0, label: "غير نشط", source: "inactive" };
  }
  if (isChronic(donor.has_chronic_disease)) {
    return { eligible: false, days: 0, label: "غير مؤهل (مرض)", reason: donor.has_chronic_disease || undefined, source: "chronic" };
  }
  if (!donor.last_donation_date) {
    return { eligible: true, days: 0, label: "مؤهل (لم يتبرع)", source: "auto" };
  }
  const days = differenceInDays(today, new Date(donor.last_donation_date));
  if (days >= ELIGIBILITY_DAYS) {
    return { eligible: true, days: 0, label: "مؤهل ✅", source: "auto" };
  }
  return { eligible: false, days: ELIGIBILITY_DAYS - days, label: `غير مؤهل - ${ELIGIBILITY_DAYS - days} يوم`, source: "recent" };
};
