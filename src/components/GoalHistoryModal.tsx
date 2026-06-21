import React, { useState, useMemo } from "react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, CartesianGrid 
} from "recharts";
import { Task } from "../types";
import { 
  X, Calendar, Target, Award, Sparkles, AlertCircle, RefreshCw, BarChart2, Star, ThumbsUp, Trash2
} from "lucide-react";
import { Language, t } from "../utils/translations";

interface GoalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>; // Optional to allow generating demo tasks
  dailyGoal: number;
  lang?: Language;
}

// Digits mapping helper
const toDigits = (num: number | string, lang: Language) => {
  if (lang !== "bn") return String(num);
  const bdigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (w) => bdigits[Number(w)]);
};

const getMonthName = (monthIdx: number, lang: Language) => {
  if (lang === "en") {
    const englishMonths = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return englishMonths[monthIdx];
  }
  const banglaMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  return banglaMonths[monthIdx];
};

export default function GoalHistoryModal({
  isOpen,
  onClose,
  tasks,
  setTasks,
  dailyGoal,
  lang = "bn"
}: GoalHistoryModalProps) {
  
  if (!isOpen) return null;

  // 1. Calculate the past 30 days history data
  const chartData = useMemo(() => {
    const list = [];
    const now = new Date();
    
    // Create an elegant sequence of the last 30 days (ascending)
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Filter tasks completed on this actual date
      const completedOnDay = tasks.filter((task) => {
        if (!task.completed) return false;
        if (!task.completedAt) return false;
        const taskCompDateStr = task.completedAt.split("T")[0];
        return taskCompDateStr === dateStr;
      });

      const dayNum = d.getDate();
      const monthIdx = d.getMonth();
      const label = lang === "bn" 
        ? `${toDigits(dayNum, lang)} ${getMonthName(monthIdx, lang).slice(0, 3)}`
        : `${getMonthName(monthIdx, lang)} ${dayNum}`;

      list.push({
        dateStr,
        label,
        count: completedOnDay.length,
        isGoalMet: completedOnDay.length >= dailyGoal,
        completedTasks: completedOnDay.map(t => t.title),
        fullDateLabel: lang === "bn"
          ? `${toDigits(dayNum, lang)} ${getMonthName(monthIdx, lang)}, ${toDigits(d.getFullYear(), lang)}`
          : `${getMonthName(monthIdx, lang)} ${dayNum}, ${d.getFullYear()}`
      });
    }
    return list;
  }, [tasks, dailyGoal, lang]);

  // 2. Aggregate statistics from the 30-day timeline
  const stats = useMemo(() => {
    let goalMetDays = 0;
    let totalCompletions = 0;
    let maxCompletions = 0;

    chartData.forEach((day) => {
      totalCompletions += day.count;
      if (day.count >= dailyGoal) {
        goalMetDays++;
      }
      if (day.count > maxCompletions) {
        maxCompletions = day.count;
      }
    });

    const averageCompletions = parseFloat((totalCompletions / 30).toFixed(1));
    const successRate = Math.round((goalMetDays / 30) * 100);

    return {
      goalMetDays,
      totalCompletions,
      maxCompletions,
      averageCompletions,
      successRate
    };
  }, [chartData, dailyGoal]);

  // 3. Optional: Function to pre-fill/populate past 30 days with demo tasks
  const handleGenerateDemoData = () => {
    if (!setTasks) return;
    
    // Multi language support for demo task generation name list
    const demoTaskNames = lang === "en" ? [
      "Morning exercise 🏃‍♂️",
      "Minimalist code revision 💻",
      "Read 50 pages of book 📚",
      "Write daily journal & thoughts ✍️",
      "Try cooking a new recipe 🍳",
      "10 minutes breathing meditation 🧘‍♀️",
      "Update GitHub push commitments 🛠️",
      "Spend valuable home time with family 🏡",
      "English listening / speech practice 🎧",
      "Bug fixing on web applet 🎯",
      "Calculate personal monthly budget 📊",
      "Watering garden and plant care 🌱",
    ] : [
      "সকালের ব্যায়াম করা 🏃‍♂️",
      "মিনিমালিস্ট কোডিং সমাধান 💻",
      "৫০ পৃষ্ঠা বই পড়া 📚",
      "দৈনিক কাজের ডায়েরি লেখা - জার্নালিং ✍️",
      "নতুন রেসিপি ট্রাই করা 🍳",
      "১০ মিনিট ব্রিদিং মেডিটেশন 🧘‍♀️",
      "গিটহাব রিপোজিটরি আপডেট করা 🛠️",
      "পরিবারের সাথে সময় কাটানো 🏡",
      "ইংরেজি লিসেনিং প্র্যাকটিস 🎧",
      "ওয়েবসাইট বাগ ফিক্সিং করা 🎯",
      "বাজেট হিসাব মেলানো 📊",
      "গাছে পানি দেওয়া ও বাগান পরিচর্যা 🌱",
    ];

    const newDemoTasks: Task[] = [];
    const now = new Date();

    // Iterate across the past 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Random number of completed tasks on this day
      const randomCount = Math.floor(Math.random() * 6) + 1; 
      
      for (let j = 0; j < randomCount; j++) {
        const randomTitleIndex = Math.floor(Math.random() * demoTaskNames.length);
        const randomTitle = demoTaskNames[randomTitleIndex];
        
        // Complete time skew
        const hour = String(Math.floor(Math.random() * 12) + 9).padStart(2, "0");
        const minutes = String(Math.floor(Math.random() * 60)).padStart(2, "0");
        const completionTimestamp = `${dateStr}T${hour}:${minutes}:00.000Z`;

        newDemoTasks.push({
          id: `demo-task-${dateStr}-${j}-${Math.random()}`,
          title: `${randomTitle}`,
          category: lang === "en" ? "Demo History 📈" : "ডেমো হিস্ট্রি 📈",
          priority: Math.random() > 0.5 ? "high" : "medium",
          dueDate: dateStr,
          dueTime: `${hour}:${minutes}`,
          completed: true,
          reminderEnabled: false,
          reminderTriggered: false,
          description: lang === "en" 
            ? "Auto-generated demo completion task history to preview chart statistics gracefully." 
            : "অটো-জেনারেটেড ডেমো কমপ্লিশন কাজের হিস্ট্রি যাতে সহজেই চার্ট ভিউ পরীক্ষা করা যায়।",
          createdAt: dateStr,
          completedAt: completionTimestamp,
          timeSpent: Math.floor(Math.random() * 1200) + 180,
        });
      }
    }

    // Append to existing active tasks
    setTasks(prev => {
      const nonDemo = prev.filter(t => !t.id.startsWith("demo-task-"));
      return [...nonDemo, ...newDemoTasks];
    });

    const toast = document.createElement("div");
    toast.className = "fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg font-black text-xs animate-bounce";
    toast.textContent = lang === "en"
      ? "✨ Demo progress history of 30 days loaded successfully!"
      : "✨ ডেমো কাজের ৩০ দিনের রঙিন হিস্ট্রি ডেটা সাফল্যজনকভাবে লোড করা হয়েছে!";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-all");
      setTimeout(() => document.body.removeChild(toast), 400);
    }, 3000);
  };

  const handleClearDemoData = () => {
    if (!setTasks) return;
    setTasks(prev => prev.filter(t => !t.id.startsWith("demo-task-")));

    const toast = document.createElement("div");
    toast.className = "fixed bottom-5 right-5 z-50 bg-slate-950 border border-slate-700 text-slate-300 px-4 py-3 rounded-xl shadow-lg font-bold text-xs animate-pulse";
    toast.textContent = lang === "en"
      ? "🗑️ Demo stats history cleaned up."
      : "🗑️ ডেমো কাজের কমপ্লিশন হিস্ট্রি ক্লিন করা হয়েছে।";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-all");
      setTimeout(() => document.body.removeChild(toast), 400);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/40 dark:bg-slate-950/60 animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-250">
        
        {/* Header styling */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-2xl border border-indigo-550/20">
              <BarChart2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{t(lang, "historyModalTitle")}</span>
                <span className="text-[10px] bg-indigo-600/15 border border-indigo-600/30 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full select-none">
                  {t(lang, "detailStats")}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px] xs:max-w-md sm:max-w-none">
                {t(lang, "historyModalSub")}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            title={t(lang, "close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content inside */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Stats Grid Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            
            {/* Goal Met Days */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">{t(lang, "daysMetText")}</span>
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-lg md:text-2xl font-black text-slate-850 dark:text-slate-100 font-mono">
                  {toDigits(stats.goalMetDays, lang)}
                </span>
                <span className="text-xs text-slate-400 font-bold"> {lang === "bn" ? "দিন / ৩০" : "days / 30"}</span>
              </div>
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded-md max-w-max">
                {lang === "bn" ? `সাফল্য লক্ষ্য ${toDigits(dailyGoal, lang)}টি` : `Target ${dailyGoal}`}
              </p>
            </div>

            {/* Total Completions */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">{t(lang, "totalCompText")}</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-lg md:text-2xl font-black text-slate-850 dark:text-slate-100 font-mono">
                  {toDigits(stats.totalCompletions, lang)}
                </span>
                <span className="text-xs text-slate-450 font-bold"> {lang === "bn" ? "টি" : "tasks"}</span>
              </div>
              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 bg-amber-500/10 dark:bg-amber-500/5 px-2 py-0.5 rounded-md max-w-max">
                {lang === "bn" ? "৩০ দিনে সম্পন্ন" : "in 30 days"}
              </p>
            </div>

            {/* Average daily completions */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">{t(lang, "avgDailyText")}</span>
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-lg md:text-2xl font-black text-slate-850 dark:text-slate-100 font-mono">
                  {toDigits(stats.averageCompletions, lang)}
                </span>
                <span className="text-xs text-slate-450 font-bold"> {lang === "bn" ? "টি / দিন" : "tasks / day"}</span>
              </div>
              <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold mt-1.5 bg-indigo-500/10 dark:bg-indigo-500/5 px-2 py-0.5 rounded-md max-w-max">
                {t(lang, "dailyPerformance")}
              </p>
            </div>

            {/* Max completions in one day */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">{t(lang, "maxCompText")}</span>
                <Star className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-lg md:text-2xl font-black text-slate-850 dark:text-slate-100 font-mono">
                  {toDigits(stats.maxCompletions, lang)}
                </span>
                <span className="text-xs text-slate-450 font-bold"> {lang === "bn" ? "টি কাজ" : "tasks"}</span>
              </div>
              <p className="text-[9px] text-purple-600 dark:text-purple-400 font-bold mt-1.5 bg-purple-500/10 dark:bg-purple-500/5 px-2 py-0.5 rounded-md max-w-max">
                {t(lang, "recordPeak")}
              </p>
            </div>

            {/* Success rate percentage */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 col-span-2 md:col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">{t(lang, "successRateText")}</span>
                <ThumbsUp className="w-4 h-4 text-teal-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-lg md:text-2xl font-black text-slate-850 dark:text-slate-100 font-mono">
                  {toDigits(stats.successRate, lang)}%
                </span>
              </div>
              <p className="text-[9px] text-teal-600 dark:text-teal-400 font-bold mt-1.5 bg-teal-500/10 dark:bg-teal-500/5 px-2 py-0.5 rounded-md max-w-max">
                {t(lang, "goalRatio")}
              </p>
            </div>

          </div>

          {/* Bar Chart Panel */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 md:p-6 shadow-inner relative">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-slate-250">{t(lang, "days30Label")}</span>
              </div>
              <div className="flex items-center gap-3.5 text-[10px] md:text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" /> {t(lang, "metDaysLegend")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-600 rounded-xs" /> {t(lang, "unmetDaysLegend")}</span>
                <span className="flex items-center gap-1"><span className="border-b-2 border-dashed border-rose-500 w-3 inline-block" /> {t(lang, "goalLine", { goal: toDigits(dailyGoal, lang) })}</span>
              </div>
            </div>

            {/* Recharts BarChart Container */}
            <div className="w-full h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontFamily="inherit"
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false}
                    interval={window.innerWidth < 640 ? 3 : 1}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontFamily="inherit"
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const cell = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-xl max-w-xs font-sans text-xs">
                            <p className="font-extrabold text-white text-[13px] border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
                              <span>📅 {cell.fullDateLabel}</span>
                            </p>
                            <p className="my-1 font-bold flex items-center justify-between gap-4">
                              <span className="text-slate-400">{lang === "bn" ? "সমাপ্ত কাজ:" : "Tasks Completed:"}</span>
                              <span className={`font-black ${cell.count >= dailyGoal ? "text-emerald-400" : "text-amber-400"}`}>
                                {toDigits(cell.count, lang)} {lang === "bn" ? "টি" : "tasks"}
                              </span>
                            </p>
                            <p className="my-1 font-bold flex items-center justify-between gap-4">
                              <span className="text-slate-400">{lang === "bn" ? "ডেইলি টার্গেট:" : "Daily Target:"}</span>
                              <span className="text-slate-200 font-black">{toDigits(dailyGoal, lang)} {lang === "bn" ? "টি" : "tasks"}</span>
                            </p>
                            <p className="mt-1 font-bold flex items-center justify-between border-t border-slate-800/50 pt-1.5">
                              <span className="text-slate-400">{lang === "bn" ? "স্থিতি:" : "Status:"}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                cell.count >= dailyGoal 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              }`}>
                                {cell.count >= dailyGoal ? t(lang, "unlockedStatus") : t(lang, "lockedStatus")}
                              </span>
                            </p>

                            {cell.completedTasks && cell.completedTasks.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-800">
                                <p className="text-[10px] font-black text-indigo-400 mb-1">{t(lang, "completedTasksList")}</p>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 font-medium">
                                  {cell.completedTasks.map((tName: string, iIndex: number) => (
                                    <li key={iIndex} className="truncate max-w-[200px]" title={tName}>
                                      {tName}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Goal Limit line indicator */}
                  <ReferenceLine 
                    y={dailyGoal} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="4 4" 
                  />

                  <Bar 
                    dataKey="count" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={window.innerWidth < 640 ? 12 : 24}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count >= dailyGoal ? "#10b981" : "#475569"} 
                        className="transition-colors duration-300 hover:opacity-85"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Guidelines / Tips area */}
          <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-200/55 dark:border-slate-800/80 flex gap-4.5">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl shrink-0 h-max border border-indigo-500/10">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-205 leading-none">
                {t(lang, "bestPerformanceTips")}
              </h4>
              <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                {t(lang, "bestPerformanceDesc")}
              </p>
            </div>
          </div>

        </div>

        {/* Footer controls (Demo data injection) */}
        {setTasks && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t(lang, "demoHelpText")}</span>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto font-black">
              {tasks.some(t => t.id.startsWith("demo-task-")) && (
                <button
                  onClick={handleClearDemoData}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-900/40 hover:border-transparent transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Remove demo history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t(lang, "demoClearBtnText")}</span>
                </button>
              )}
              <button
                onClick={handleGenerateDemoData}
                className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white text-xs font-black rounded-xl border border-transparent shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Generate demo history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t(lang, "demoBtnText")}</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
