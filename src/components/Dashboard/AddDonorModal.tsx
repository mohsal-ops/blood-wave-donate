import { useState } from "react";
import { UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BLOOD_TYPES, WILAYAS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

const AddDonorModal = () => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: "",
    phone_whatsapp: "",
    phone_secondary: "",
    wilaya: "",
    municipality: "",
    blood_type: "",
    last_donation_date: undefined as Date | undefined,
    date_of_birth: undefined as Date | undefined,
    has_chronic_disease_flag: "no" as "yes" | "no",
    chronic_disease_details: "",
  });

  const reset = () =>
    setForm({
      full_name: "",
      phone_whatsapp: "",
      phone_secondary: "",
      wilaya: "",
      municipality: "",
      blood_type: "",
      last_donation_date: undefined,
      date_of_birth: undefined,
      has_chronic_disease_flag: "no",
      chronic_disease_details: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone_whatsapp || !form.blood_type) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("donors").insert({
      full_name: form.full_name,
      phone_whatsapp: form.phone_whatsapp,
      phone_secondary: form.phone_secondary || null,
      wilaya: form.wilaya || null,
      municipality: form.municipality || null,
      blood_type: form.blood_type,
      last_donation_date: form.last_donation_date
        ? format(form.last_donation_date, "yyyy-MM-dd")
        : null,
      date_of_birth: form.date_of_birth
        ? format(form.date_of_birth, "yyyy-MM-dd")
        : null,
      has_chronic_disease:
        form.has_chronic_disease_flag === "yes"
          ? `نعم: ${form.chronic_disease_details || "غير محدد"}`
          : "لا",
    });
    setSubmitting(false);
    if (error) {
      toast.error("حدث خطأ أثناء إضافة المتبرع");
      return;
    }
    toast.success("تمت إضافة المتبرع بنجاح");
    queryClient.invalidateQueries({ queryKey: ["donors"] });
    reset();
    setOpen(false);
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          إضافة متبرع
        </button>
      </DialogTrigger>
      <DialogContent
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 max-w-lg"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة متبرع جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">الاسم الكامل *</label>
            <input
              className={inputCls}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">هاتف واتساب *</label>
              <input
                className={inputCls}
                value={form.phone_whatsapp}
                onChange={(e) => setForm({ ...form, phone_whatsapp: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">هاتف ثانوي</label>
              <input
                className={inputCls}
                value={form.phone_secondary}
                onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">الولاية</label>
              <select
                className={inputCls}
                value={form.wilaya}
                onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
              >
                <option value="">اختر</option>
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">البلدية</label>
              <input
                className={inputCls}
                value={form.municipality}
                onChange={(e) => setForm({ ...form, municipality: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">فصيلة الدم *</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, blood_type: t })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                    form.blood_type === t
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">آخر تبرع</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${inputCls} flex items-center justify-between cursor-pointer`}
                >
                  <span className={form.last_donation_date ? "" : "text-slate-400"}>
                    {form.last_donation_date
                      ? format(form.last_donation_date, "dd/MM/yyyy", { locale: ar })
                      : "اختر التاريخ"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.last_donation_date}
                  onSelect={(d) => setForm({ ...form, last_donation_date: d })}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">تاريخ الميلاد</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${inputCls} flex items-center justify-between cursor-pointer`}
                >
                  <span className={form.date_of_birth ? "" : "text-slate-400"}>
                    {form.date_of_birth
                      ? format(form.date_of_birth, "dd/MM/yyyy", { locale: ar })
                      : "اختر التاريخ"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.date_of_birth}
                  onSelect={(d) => setForm({ ...form, date_of_birth: d })}
                  disabled={(d) => d > new Date()}
                  captionLayout="dropdown"
                  fromYear={1940}
                  toYear={new Date().getFullYear() - 18}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">هل يعاني من مرض مزمن أو معدي؟</label>
            <div className="flex gap-2">
              {[
                { v: "no", label: "لا" },
                { v: "yes", label: "نعم" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setForm({ ...form, has_chronic_disease_flag: o.v as "yes" | "no" })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    form.has_chronic_disease_flag === o.v
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {form.has_chronic_disease_flag === "yes" && (
              <input
                className={`${inputCls} mt-2`}
                placeholder="يرجى التوضيح (اسم المرض)"
                value={form.chronic_disease_details}
                onChange={(e) => setForm({ ...form, chronic_disease_details: e.target.value })}
              />
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDonorModal;
