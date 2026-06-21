import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Task } from "../types";
import { Clock, CheckCircle2, AlertTriangle, Sparkles, TrendingUp } from "lucide-react";

interface TaskOntimeReportProps {
  tasks: Task[];
}

export default function TaskOntimeReport({ tasks }: TaskOntimeReportProps) {
  // Bengali numeric helper
  const toBengaliDigits = (num: number | string) => {
    const bdigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (w) => bdigits[Number(w)]);
  };

  // Get completed tasks
  const completedTasks = tasks.filter((t) => t.completed && t.completedAt);

  // Filter completed tasks in the last 7 days for the quick weekly view
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyCompleted = completedTasks.filter((t) => {
    if (!t.completedAt) return false;
    return new Date(t.completedAt).getTime() >= oneWeekAgo;
  });

  // Helper to determine if a completed task was on-time
  const checkIsOnTime = (task: Task): boolean => {
    if (!task.completedAt) return true;
    const compDate = new Date(task.completedAt);
    
    // Parse due date (YYYY-MM-DD)
    const parts = task.dueDate.split("-").map(Number);
    if (parts.length !== 3) return true;
    const [year, month, day] = parts;
    
    // Parse due time (HH:MM or default to end of day)
    const dueTimeStr = task.dueTime || "23:59";
    const [hours, minutes] = dueTimeStr.split(":").map(Number);
    
    const dueMoment = new Date(year, month - 1, day, hours, minutes, 59, 999);
    return compDate.getTime() <= dueMoment.getTime();
  };

  // Calculate stats for weekly window
  const weeklyOnTimeTasks = weeklyCompleted.filter(checkIsOnTime);
  const weeklyOnTimeCount = weeklyOnTimeTasks.length;
  const weeklyLateCount = weeklyCompleted.length - weeklyOnTimeCount;

  // Calculate life-time stats for additional insight if weekly lacks entries
  const totalOnTimeTasks = completedTasks.filter(checkIsOnTime);
  const totalOnTimeCount = totalOnTimeTasks.length;
  const totalLateCount = completedTasks.length - totalOnTimeCount;

  // Decide dynamically which dataset to use (prioritize weekly, fallback to lifetime if weekly is empty)
  const useWeekly = weeklyCompleted.length > 0;
  const activeCompletedCount = useWeekly ? weeklyCompleted.length : completedTasks.length;
  const onTimeCount = useWeekly ? weeklyOnTimeCount : totalOnTimeCount;
  const lateCount = useWeekly ? weeklyLateCount : totalLateCount;

  // Percentage calculation
  const onTimePercentage = activeCompletedCount > 0 
    ? Math.round((onTimeCount / activeCompletedCount) * 100) 
    : 0;

  // Define data for the Recharts BarChart
  const data = [
    {
      name: "সময়মতো",
      সংখ্যা: onTimeCount,
      fill: "#10b981", // Emerald 500
      bg: "bg-emerald-500",
      textClass: "text-emerald-600 dark:text-emerald-400"
    },
    {
      name: "দেরিতে",
      সংখ্যা: lateCount,
      fill: "#f59e0b", // Amber 500
      bg: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400"
    }
  ];

  // Quick feedback phrase based on ontime rate
  const getPromptFeedback = () => {
    if (onTimePercentage >= 90) return "অসাধারণ সময়ানুবর্তিতা! আপনি প্রতিটি কাজ নির্দিষ্ট সময়ের মধ্যেই শেষ করছেন। 🌟";
    if (onTimePercentage >= 70) return "খুব ভালো! নিয়মানুবর্তিতা বজায় রেখে এগিয়ে চলছেন। 👍";
    if (onTimePercentage >= 40) return "উন্নতির সুযোগ আছে। কাজের ওপর ফোকাস বাড়িয়ে সঠিক সময়ে শেষ করার চেষ্টা করুন। 💪";
    return "সময়মতো কাজ শেষ করার জন্য কাজের অগ্রাধিকার রি-ডিজাইন করতে পারেন। 💡";
  };

  return (
    <div id="ontime-report-card" className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md space-y-4">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 p-1.5 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" style={{ animationDuration: "3s" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">⏱️ সময়ের সঠিক ব্যবহার (Time Discipline)</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {useWeekly 
                ? "গত ৭ দিনে সম্পন্ন করা কাজের সঠিক সময়ের বিশ্লেষণ" 
                : "সর্বমোট সম্পন্ন করা কাজের সময়ানুবর্তিতা বিশ্লেষণ"}
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-extrabold px-2.5 py-1 rounded-full uppercase">
          {useWeekly ? "সাপ্তাহিক" : "সর্বমোট"}
        </span>
      </div>

      {activeCompletedCount === 0 ? (
        <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-2.5">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700/30 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">কোনো সম্পন্ন কাজ নেই!</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              এই বিশ্লেষণটি দেখতে আপনার কিছু কাজ সম্পন্ন করতে হবে। এখনই কাজ সম্পন্ন করে সময়মতো সমাপ্তির হার ট্র্যাক করুন!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Chart Area */}
            <div className="sm:col-span-7 h-36 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  barSize={32}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.06)", radius: 6 }}
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
                  <Bar dataKey="সংখ্যা" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick stats panel */}
            <div className="sm:col-span-5 flex flex-col gap-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-705/50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-350 truncate font-semibold">সময়মতো (On Time)</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                  {toBengaliDigits(onTimeCount)}টি
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-705/50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-350 truncate font-semibold">দেরিতে (Late)</span>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                  {toBengaliDigits(lateCount)}টি
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-550/10 dark:from-teal-950/20 dark:to-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/30">
                <div className="flex items-center gap-1 min-w-0">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">সঠিক সময়ে সম্পন্ন:</span>
                </div>
                <span className="text-xs font-black text-teal-700 dark:text-teal-300 font-mono">
                  {toBengaliDigits(onTimePercentage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Hint Text */}
          <div className="bg-slate-50/70 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-100/60 dark:border-slate-800/60 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
              {getPromptFeedback()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
