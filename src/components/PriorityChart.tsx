import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Task } from "../types";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface PriorityChartProps {
  tasks: Task[];
}

export default function PriorityChart({ tasks }: PriorityChartProps) {
  // Filter for incomplete (remaining) tasks
  const remainingTasks = tasks.filter((t) => !t.completed);

  const highCount = remainingTasks.filter((t) => t.priority === "high").length;
  const mediumCount = remainingTasks.filter((t) => t.priority === "medium").length;
  const lowCount = remainingTasks.filter((t) => t.priority === "low").length;

  const totalRemaining = remainingTasks.length;

  // Bengali numeric helpers
  const toBengaliDigits = (num: number | string) => {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[Number(w)]);
  };

  // Recharts data format
  const data = [
    { name: "জরুরি কাজ (High)", value: highCount, color: "#f43f5e", bgLight: "#fff1f2", textClass: "text-rose-600" },
    { name: "মধ্যম কাজ (Medium)", value: mediumCount, color: "#f59e0b", bgLight: "#fef3c7", textClass: "text-amber-600" },
    { name: "সাধারণ কাজ (Low)", value: lowCount, color: "#10b981", bgLight: "#ecfdf5", textClass: "text-emerald-600" }
  ].filter((item) => item.value > 0); // Only render slices with count > 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-1.5 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">📊 গুরুত্বের তালিকা (Task Priority Analysis)</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">অবশিষ্ট কাজগুলোর গুরুত্বের আনুপাতিক চিত্র</p>
          </div>
        </div>
        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-1 rounded-full font-mono">
          বাকি: {toBengaliDigits(totalRemaining)}টি
        </span>
      </div>

      {totalRemaining === 0 ? (
        <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-2.5">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">কোন কাজ বাকি নেই!</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              চমৎকার! বর্তমানের সকল জরুরি ও সাধারণ কাজ সম্পন্ন হয়েছে। নতুন কাজ সংযুক্ত করুন।
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Recharts Pie Chart Stage */}
          <div className="sm:col-span-7 h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  separator=": "
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "11px",
                    fontWeight: "bold",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                  formatter={(value: any) => [`${toBengaliDigits(value)}টি কাজ`]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Absolute overlay at chart center */}
            <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-800 dark:text-white font-mono leading-none">
                {toBengaliDigits(totalRemaining)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                বাকি কাজ
              </span>
            </div>
          </div>

          {/* Color Indicator Legend Panel */}
          <div className="sm:col-span-5 flex flex-col gap-2">
            {[
              { label: "জরুরি (High)", count: highCount, color: "#f43f5e", bg: "bg-rose-500" },
              { label: "মধ্যম (Medium)", count: mediumCount, color: "#f59e0b", bg: "bg-amber-500" },
              { label: "সাধারণ (Low)", count: lowCount, color: "#10b981", bg: "bg-emerald-500" }
            ].map((p, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-705/50 transition-all hover:bg-slate-100/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.bg} shrink-0`} />
                  <span className="text-xs text-slate-600 dark:text-slate-350 truncate font-semibold">
                    {p.label}
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md shadow-sm">
                  {toBengaliDigits(p.count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
