import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Donor } from "@/lib/constants";
import { BLOOD_TYPES, BLOOD_TYPE_COLORS, ELIGIBILITY_DAYS, WILAYAS, computeEligibility } from "@/lib/constants";
import { format, differenceInDays, differenceInYears } from "date-fns";
import { ar } from "date-fns/locale";
import { Phone, MessageCircle, MapPin, Calendar, Droplets, User, Pencil, Save, X, CalendarCheck } from "lucide-react";
import { useUpdateDonor } from "@/hooks/useDonors";
import { toast } from "@/components/ui/sonner";

interface DonorDetailsModalProps {
  donor: Donor | null;
  open: boolean;
  onClose: () => void;
}

const DonorDetailsModal = ({ donor, open, onClose }: DonorDetailsModalProps) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Donor>>({});
  const [recordingDate, setRecordingDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const updateMutation = useUpdateDonor();

  useEffect(() => {
    if (donor) {
      setForm(donor);
      setEditing(false);
      setShowDatePicker(false);
      setRecordingDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [donor, open]);

  if (!donor) return null;

  const today = new Date();
  const eligibility = computeEligibility(donor, today);
  const isEligible = eligibility.eligible;
  const daysUntil = donor.last_donation_date
    ? Math.max(0, ELIGIBILITY_DAYS - differenceInDays(today, new Date(donor.last_donation_date)))
    : 0;
  const age = donor.date_of_birth ? differenceInYears(today, new Date(donor.date_of_birth)) : null;
  const colors = BLOOD_TYPE_COLORS[donor.blood_type] || { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/50" };

  const setField = <K extends keyof Donor>(key: K, value: Donor[K] | null) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: donor.id,
        full_name: form.full_name,
        phone_whatsapp: form.phone_whatsapp,
        phone_secondary: form.phone_secondary,
        wilaya: form.wilaya,
        municipality: form.municipality,
        blood_type: form.blood_type,
        last_donation_date: form.last_donation_date,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        is_active: form.is_active,
        total_donations: form.total_donations,
        has_chronic_disease: form.has_chronic_disease,
        eligibility_override: form.eligibility_override ?? null,
        ineligibility_reason: form.ineligibility_reason ?? null,
      });
      toast.success("تم تحديث البيانات بنجاح");
      setEditing(false);
    } catch {
      toast.error("حدث خطأ أثناء التحديث");
    }
  };

  const handleRecordDonationToday = async () => {
    try {
      if (!recordingDate) { toast.error("الرجاء اختيار التاريخ"); return; }
      if (new Date(recordingDate) > today) { toast.error("لا يمكن اختيار تاريخ في المستقبل"); return; }
      await updateMutation.mutateAsync({
        id: donor.id,
        last_donation_date: recordingDate,
        total_donations: (donor.total_donations || 0) + 1,
      });
      toast.success("تم تسجيل التبرع بنجاح");
      onClose();
    } catch {
      toast.error("حدث خطأ أثناء التسجيل");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {editing ? "تعديل بيانات المتبرع" : "تفاصيل المتبرع"}
            </span>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <Pencil className="w-3.5 h-3.5" /> تعديل
              </button>
            )}
          </DialogTitle>
        </DialogHeader>

        {!editing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{donor.full_name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                {donor.blood_type}
              </span>
            </div>

            <div className={`flex flex-col gap-1 px-3 py-2 rounded-xl ${isEligible ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
              <span className="font-medium">
                {isEligible ? `✅ ${eligibility.label}` : `❌ ${eligibility.label}${eligibility.source === "recent" ? "" : ""}`}
              </span>
              {eligibility.reason && (
                <span className="text-xs opacity-80">السبب: {eligibility.reason}</span>
              )}
              {!isEligible && eligibility.source === "recent" && (
                <span className="text-xs opacity-80">{daysUntil} يوم متبقي</span>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{donor.phone_whatsapp}</span>
              </div>
              {donor.phone_secondary && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{donor.phone_secondary}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{[donor.municipality, donor.wilaya].filter(Boolean).join("، ") || "غير محدد"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  آخر تبرع:{" "}
                  {donor.last_donation_date
                    ? format(new Date(donor.last_donation_date), "dd/MM/yyyy", { locale: ar })
                    : "لم يتبرع بعد"}
                </span>
              </div>
              {age !== null && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>العمر: {age} سنة</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Droplets className="w-4 h-4 text-slate-400" />
                <span>عدد التبرعات: {donor.total_donations}</span>
              </div>
              {donor.date_of_birth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>تاريخ الميلاد: {format(new Date(donor.date_of_birth), "dd/MM/yyyy", { locale: ar })}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>الأمراض المزمنة/المعدية: {donor.has_chronic_disease || "غير محدد"}</span>
              </div>
            </div>

            {!showDatePicker ? (
              <button
                onClick={() => setShowDatePicker(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" /> تسجيل تبرع جديد
              </button>
            ) : (
              <div className="space-y-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40">
                <Label className="text-xs text-emerald-800 dark:text-emerald-300">تاريخ التبرع</Label>
                <Input
                  type="date"
                  max={format(today, "yyyy-MM-dd")}
                  value={recordingDate}
                  onChange={(e) => setRecordingDate(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRecordDonationToday}
                    disabled={updateMutation.isPending}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CalendarCheck className="w-4 h-4" /> تأكيد التسجيل
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <a
                href={`tel:${donor.phone_whatsapp}`}
                className="flex-1 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <Phone className="w-4 h-4" /> اتصال
              </a>
              <a
                href={`https://wa.me/${donor.phone_whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              >
                <MessageCircle className="w-4 h-4" /> واتساب
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">الاسم الكامل</Label>
              <Input value={form.full_name ?? ""} onChange={(e) => setField("full_name", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الفصيلة</Label>
                <Select value={form.blood_type ?? ""} onValueChange={(v) => setField("blood_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">الجنس</Label>
                <Select value={form.gender ?? "male"} onValueChange={(v) => setField("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">هاتف واتساب</Label>
                <Input value={form.phone_whatsapp ?? ""} onChange={(e) => setField("phone_whatsapp", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">هاتف ثانوي</Label>
                <Input value={form.phone_secondary ?? ""} onChange={(e) => setField("phone_secondary", e.target.value || null)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الولاية</Label>
                <Select value={form.wilaya ?? ""} onValueChange={(v) => setField("wilaya", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {WILAYAS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">البلدية</Label>
                <Input value={form.municipality ?? ""} onChange={(e) => setField("municipality", e.target.value || null)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">تاريخ آخر تبرع</Label>
                <Input
                  type="date"
                  value={form.last_donation_date ?? ""}
                  onChange={(e) => setField("last_donation_date", e.target.value || null)}
                />
              </div>
              <div>
                <Label className="text-xs">تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={form.date_of_birth ?? ""}
                  onChange={(e) => setField("date_of_birth", e.target.value || null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">عدد التبرعات</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.total_donations ?? 0}
                  onChange={(e) => setField("total_donations", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs">الحالة</Label>
                <Select value={String(form.is_active ?? true)} onValueChange={(v) => setField("is_active", v === "true")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">نشط</SelectItem>
                    <SelectItem value="false">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">الأمراض المزمنة أو المعدية</Label>
              <Input
                placeholder="لا / نعم: اسم المرض"
                value={form.has_chronic_disease ?? ""}
                onChange={(e) => setField("has_chronic_disease", e.target.value || null)}
              />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3 bg-slate-50/60 dark:bg-slate-800/40">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">الأهلية للتبرع (تحكم يدوي)</Label>
              <Select
                value={form.eligibility_override ?? "auto"}
                onValueChange={(v) => setField("eligibility_override", v === "auto" ? null : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">تلقائي (حسب آخر تبرع والأمراض)</SelectItem>
                  <SelectItem value="eligible">مؤهل يدوياً</SelectItem>
                  <SelectItem value="not_eligible">غير مؤهل يدوياً</SelectItem>
                </SelectContent>
              </Select>
              {form.eligibility_override === "not_eligible" && (
                <div>
                  <Label className="text-xs">سبب عدم الأهلية</Label>
                  <Input
                    placeholder="مثال: مرض، ضغط الدم، حمل..."
                    value={form.ineligibility_reason ?? ""}
                    onChange={(e) => setField("ineligibility_reason", e.target.value || null)}
                  />
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يتم اعتبار المتبرع غير مؤهل تلقائياً إذا كان لديه مرض مزمن/معدي. يمكنك تجاوز ذلك يدوياً.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
              <button
                onClick={() => { setForm(donor); setEditing(false); }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" /> إلغاء
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DonorDetailsModal;
