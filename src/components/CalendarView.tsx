import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Trash2, Check, Clock, Plus, X, Sparkles, AlertCircle, Filter,
  Award, ListTodo
} from "lucide-react";
import { Task } from "../types";
import { t, Language } from "../utils/translations";

interface CalendarViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (task: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: "high" | "medium" | "low";
    category: string;
  }) => void;
  categoryColors?: Record<string, string>;
  lang?: Language;
}

export default function CalendarView({ tasks, onToggleComplete, onDelete, onAddTask, categoryColors = {}, lang = "bn" }: CalendarViewProps) {
  const today = new Date();
  
  const defaultCats = ["ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য"];
  const customCats = Object.keys(categoryColors).filter(cat => !defaultCats.includes(cat));

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed (Jan=0, Dec=11)
  
  // Selected day for viewing and quick task adding
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Category Filtering State
  const [selectedCategory, setSelectedCategory] = useState<string>("সব");

  // Quick Add state for selected date
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newCategory, setNewCategory] = useState<string>("ব্যক্তিগত");
  const [isQuickCustomCategory, setIsQuickCustomCategory] = useState(false);
  const [quickCustomCategoryText, setQuickCustomCategoryText] = useState("");
  
  // Selected task detail state
  const [clickedTask, setClickedTask] = useState<Task | null>(null);

  // Category Icon Map
  const categoryIcons: Record<string, string> = {
    "ব্যক্তিগত": "🏠",
    "কাজ": "💼",
    "পড়াশোনা": "📚",
    "স্বাস্থ্য": "❤️",
    "অন্যান্য": "✨"
  };

  const defaultCategories = ["ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য"];

  // Unique list of categories present in the current tasks
  const customCategories = Array.from(new Set(
    tasks
      .map(t => t.category)
      .filter((cat): cat is string => typeof cat === "string" && cat.trim() !== "" && !defaultCategories.includes(cat))
  ));

  const availableCategories = ["সব", ...defaultCategories, ...customCategories];

  // Universal digit helper based on language selection
  const formatDigits = (val: number | string) => {
    if (lang === "bn") {
      const bDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      return String(val).replace(/[0-9]/g, (w) => bDigits[Number(w)]);
    }
    return String(val);
  };

  const monthsList = lang === "bn" ? [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ] : [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekdaysShortList = lang === "bn" ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const translateCategory = (catName: string) => {
    if (lang === "bn") return catName;
    const mapping: Record<string, string> = {
      "ব্যক্তিগত": "Personal",
      "কাজ": "Work",
      "পড়াশোনা": "Study",
      "স্বাস্থ্য": "Health",
      "অন্যান্য": "Others",
      "সব": "All"
    };
    return mapping[catName] || catName;
  };

  const translatePriority = (priority: string) => {
    if (lang === "bn") {
      return priority === "high" ? "জরুরি" : priority === "medium" ? "মধ্যম" : "নিম্ন";
    }
    return priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low";
  };

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Monthly dates configuration
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarGridCells: {
    dayNum: number;
    monthOffset: -1 | 0 | 1; // -1 for prev month, 0 for current, 1 for next
    year: number;
    month: number;
    dateString: string;
  }[] = [];

  // 1. Pre-populate cells with previous month end days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = totalDaysInPrevMonth - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYearVal}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;
    
    calendarGridCells.push({
      dayNum: prevDay,
      monthOffset: -1,
      year: prevYearVal,
      month: prevMonthIdx,
      dateString: dateStr
    });
  }

  // 2. Populate current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarGridCells.push({
      dayNum: i,
      monthOffset: 0,
      year: currentYear,
      month: currentMonth,
      dateString: dateStr
    });
  }

  // 3. Populate post-month start days to complete standard 42-cell layout
  const remainingCells = 42 - calendarGridCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYearVal}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    
    calendarGridCells.push({
      dayNum: i,
      monthOffset: 1,
      year: nextYearVal,
      month: nextMonthIdx,
      dateString: dateStr
    });
  }

  // Quick submit for creating task
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedDateStr) return;
    
    onAddTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      dueDate: selectedDateStr,
      dueTime: newTime,
      priority: newPriority,
      category: isQuickCustomCategory ? (quickCustomCategoryText.trim() || "অন্যান্য") : newCategory
    });

    // Reset fields
    setNewTitle("");
    setNewDesc("");
    setNewTime("09:00");
    setNewPriority("medium");
    setNewCategory("ব্যক্তিগত");
    setIsQuickCustomCategory(false);
    setQuickCustomCategoryText("");
    setIsQuickAddOpen(false);
  };

  // Category mapping styles
  const categoryBadgeColors: Record<string, string> = {
    "ব্যক্তিগত": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-900/40",
    "কাজ": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/40",
    "পড়াশোনা": "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/40",
    "স্বাস্থ্য": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/40",
    "অন্যান্য": "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
  };

  // Convert time to 12h formats dynamically
  const formatTimeLocalized = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const m = parseInt(minutes);
    if (lang === "bn") {
      const ampm = h >= 12 ? "অপরাহ্ন" : "পূর্বাহ্ন";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${formatDigits(displayH)}:${formatDigits(m.toString().padStart(2, "0"))} ${ampm}`;
    } else {
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
    }
  };

  return (
    <div className="calendar-view bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-8 border border-slate-150 dark:border-slate-800/85 shadow-lg space-y-6 relative overflow-hidden transition-all duration-300">
      {/* Upper ambient background decoration */}
      <div className="absolute right-0 top-0 w-44 h-44 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Calendar Header with navigation switches */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
            <CalendarIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              {t(lang, "monthlyCalendarView")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t(lang, "monthlyCalendarDesc")}
            </p>
          </div>
        </div>

        {/* Navigation block */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToToday}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-97 select-none"
          >
            {t(lang, "todayBtn")}
          </button>
          
          <div className="flex items-center bg-slate-50 dark:bg-slate-850 p-1 rounded-xl border border-slate-200/50 dark:border-slate-750">
            <button
              onClick={handlePrevMonth}
              title={lang === "bn" ? "পূর্ববর্তী মাস" : "Previous Month"}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            
            <span className="px-3 text-xs md:text-sm font-black text-slate-800 dark:text-slate-205 min-w-[120px] text-center select-none">
              {monthsList[currentMonth]} {formatDigits(currentYear)}
            </span>

            <button
              onClick={handleNextMonth}
              title={lang === "bn" ? "পরবর্তী মাস" : "Next Month"}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Statistics Bar for the visible month */}
      {(() => {
        const targetMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
        const monthlyTasks = tasks.filter((t) => t.dueDate.startsWith(targetMonthPrefix));
        const totalMonthCount = monthlyTasks.length;
        const completedMonthCount = monthlyTasks.filter((t) => t.completed).length;
        const pendingMonthCount = totalMonthCount - completedMonthCount;
        const completionPercentage = totalMonthCount > 0 ? Math.round((completedMonthCount / totalMonthCount) * 100) : 0;

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Tasks Card */}
            <div className="p-3 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 shrink-0">
                <ListTodo className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate">
                  {t(lang, "monthlyTotalTasks", { month: monthsList[currentMonth] })}
                </p>
                <p className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {formatDigits(totalMonthCount)} {lang === "bn" ? "টি" : "tasks"}
                </p>
              </div>
            </div>

            {/* Completed Tasks Card */}
            <div className="p-3 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate">
                  {t(lang, "monthlyCompleted")}
                </p>
                <p className="text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatDigits(completedMonthCount)} {lang === "bn" ? "টি" : "tasks"}
                </p>
              </div>
            </div>

            {/* Pending Tasks Card */}
            <div className="p-3 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 truncate">
                  {t(lang, "monthlyActive")}
                </p>
                <p className="text-sm md:text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatDigits(pendingMonthCount)} {lang === "bn" ? "টি" : "tasks"}
                </p>
              </div>
            </div>

            {/* Progress/Completion Rate Card */}
            <div className="p-3 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl flex flex-col justify-between shadow-xs col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500">
                    {t(lang, "monthlyProgressRate")}
                  </span>
                </div>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{formatDigits(completionPercentage)}%</span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2 border border-slate-200/50 dark:border-slate-700/50">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Category Filter Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-150/80 dark:border-slate-800/50 shadow-sm hover:shadow-md hover:border-slate-200/90 dark:hover:border-slate-700/80 transition-all duration-300">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-705 dark:text-slate-350 select-none">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shadow-sm border border-teal-100/50 dark:border-teal-900/30">
            <span className="text-sm">🏷️</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-800 dark:text-slate-200 font-extrabold">{t(lang, "categoryFilterTitle")}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t(lang, "categoryFilterDesc")}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {selectedCategory !== "সব" && (
            <button
              onClick={() => setSelectedCategory("সব")}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 hover:text-rose-750 hover:shadow-xs text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-100 dark:border-rose-900/40 active:scale-95 shrink-0"
              title={lang === "bn" ? "ফিল্টার মুছে ফেলুন" : "Clear Filters"}
            >
              <X className="w-3.5 h-3.5 stroke-[2.5] text-rose-500 animate-pulse" />
              {t(lang, "clearFilters")}
            </button>
          )}

          <div className="relative min-w-[210px] w-full sm:w-auto group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-bold pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-slate-50/20 dark:hover:bg-slate-800/40 hover:shadow-sm transition-all duration-200 cursor-pointer appearance-none"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-slate-900 dark:text-slate-100 py-2">
                  {cat === "সব" ? `🌈 ${lang === "bn" ? "সব ক্যাটাগরি" : "All Categories"}` : `${categoryIcons[cat] || "🏷️"} ${translateCategory(cat)}`}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors duration-200">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid for calendar columns */}
      <div className="space-y-2.5">
        {/* Days of week titles */}
        <div className="hidden md:grid grid-cols-7 gap-2 text-center text-[10px] md:text-xs font-black tracking-wider text-slate-400 uppercase select-none pb-1">
          {weekdaysShortList.map((day, idx) => (
            <div 
              key={idx} 
              className={`py-1 rounded-md ${
                idx === 5 ? "text-emerald-500 font-extrabold" : idx === 0 ? "text-rose-500 font-extrabold" : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Desktop 6-Week Day Grid blocks */}
        <div className="hidden md:grid grid-cols-7 gap-1.5 md:gap-2.5 min-h-[420px]">
          {calendarGridCells.map((cell, idx) => {
            const isCurrentMonth = cell.monthOffset === 0;
            const cellTasks = tasks.filter((t) => {
              const matchedDate = t.dueDate === cell.dateString;
              const matchedCategory = selectedCategory === "সব" || t.category === selectedCategory;
              return matchedDate && matchedCategory;
            });
            
            const isToday = 
              today.getDate() === cell.dayNum && 
              today.getMonth() === cell.month && 
              today.getFullYear() === cell.year;

            // Sort tasks: Incomplete first, then High -> Medium -> Low priority
            const sortedCellTasks = [...cellTasks].sort((a, b) => {
              if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
              }
              const pWeight = { high: 3, medium: 2, low: 1 };
              return pWeight[b.priority] - pWeight[a.priority];
            });

            return (
              <div
                key={idx}
                className={`min-h-[72px] md:min-h-[110px] p-1.5 md:p-2.5 rounded-2xl border flex flex-col justify-between transition-all group relative ${
                  isCurrentMonth 
                    ? isToday 
                      ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/10"
                      : "bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-850/60 border-slate-150 dark:border-slate-800/80"
                    : "bg-slate-50/10 dark:bg-slate-900/10 border-slate-100/40 dark:border-slate-900/40 opacity-40 hover:opacity-60"
                }`}
              >
                {/* Cell Header: Day Number and Add Button */}
                <div className="flex items-center justify-between select-none">
                  <span className={`text-[11px] md:text-sm font-black font-mono ${
                    isToday 
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-md animate-bounce-subtle" 
                      : isCurrentMonth
                        ? "text-slate-850 dark:text-slate-205"
                        : "text-slate-400"
                  }`}>
                    {formatDigits(cell.dayNum)}
                  </span>

                  {/* Add action shortcut on hover */}
                  {isCurrentMonth && (
                    <button
                      onClick={() => {
                        setSelectedDateStr(cell.dateString);
                        setIsQuickAddOpen(true);
                      }}
                      title={
                        lang === "bn"
                          ? `${formatDigits(cell.dayNum)} ${monthsList[cell.month]} এ কাজ যুক্ত করুন`
                          : `Add task on ${monthsList[cell.month]} ${formatDigits(cell.dayNum)}`
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-600 hover:text-white rounded-lg transition-all transform scale-90 hover:scale-105 cursor-pointer hidden md:block"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}
                </div>

                {/* Tasks List inside the block */}
                <div className="mt-1 md:mt-2 space-y-1 overflow-y-auto max-h-[48px] md:max-h-[80px] pr-0.5 scrollbar-thin">
                  {sortedCellTasks.slice(0, 3).map((task) => {
                    const isHigh = task.priority === "high";
                    const isMed = task.priority === "medium";
                    const isLow = task.priority === "low";
                    
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setClickedTask(task);
                        }}
                        className={`text-[9px] md:text-[10px] px-1.5 py-0.5 md:py-1 rounded-md font-bold truncate cursor-pointer transition-all border flex items-center gap-1 hover:scale-102 ${
                          task.completed
                            ? "bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 line-through border-slate-200/50 dark:border-slate-900/40"
                            : isHigh
                              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455 border-rose-100/80 dark:border-rose-900/30"
                              : isMed
                                ? "bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-450 border-amber-100/85 dark:border-amber-900/30"
                                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border-emerald-100/85 dark:border-emerald-900/30"
                        }`}
                        title={task.title}
                      >
                        <span className={`w-1 h-1 shrink-0 rounded-full ${
                          task.completed 
                            ? "bg-slate-400" 
                            : isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                        <span className="truncate flex-1">{task.title}</span>
                      </div>
                    );
                  })}
                  
                  {/* More indicator badge */}
                  {sortedCellTasks.length > 3 && (
                    <div className="text-[8px] md:text-[9px] text-zinc-500 font-extrabold text-center select-none">
                      {t(lang, "moreTasksSuffix", { count: formatDigits(sortedCellTasks.length - 3) })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Stacked Vertical List View */}
        <div className="block md:hidden space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
          {calendarGridCells.map((cell, idx) => {
            const isCurrentMonth = cell.monthOffset === 0;
            const cellTasks = tasks.filter((t) => {
              const matchedDate = t.dueDate === cell.dateString;
              const matchedCategory = selectedCategory === "সব" || t.category === selectedCategory;
              return matchedDate && matchedCategory;
            });

            const isToday = 
              today.getDate() === cell.dayNum && 
              today.getMonth() === cell.month && 
              today.getFullYear() === cell.year;

            // Sort tasks: Incomplete first, then High -> Medium -> Low priority
            const sortedCellTasks = [...cellTasks].sort((a, b) => {
              if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
              }
              const pWeight = { high: 3, medium: 2, low: 1 };
              return pWeight[b.priority] - pWeight[a.priority];
            });

            const weekdayIndex = new Date(cell.year, cell.month, cell.dayNum).getDay();
            const weekdayName = lang === "bn" ? `${weekdaysShortList[weekdayIndex]}বার` : weekdaysShortList[weekdayIndex];

            // Render highly readable row for each calendar cell
            return (
              <div
                key={`mobile-cell-${idx}`}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${
                  isCurrentMonth
                    ? isToday
                      ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500 shadow-sm ring-2 ring-emerald-500/10"
                      : "bg-slate-50/50 dark:bg-slate-900/60 hover:bg-slate-100/50 dark:hover:bg-slate-850/50 border-slate-150/80 dark:border-slate-800/80"
                    : "bg-slate-50/10 dark:bg-slate-900/10 border-slate-100/30 dark:border-slate-900/40 opacity-40 hover:opacity-60"
                }`}
              >
                <div className="flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black font-mono w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm ${
                      isToday
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white animate-bounce-subtle"
                        : isCurrentMonth
                          ? "bg-slate-200/60 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          : "bg-slate-100/40 dark:bg-slate-900/40 text-slate-400/80"
                    }`}>
                      {formatDigits(cell.dayNum)}
                    </span>
                    <div className="flex flex-col leading-none">
                      <span className={`text-[10px] font-black uppercase ${
                        isToday 
                          ? "text-emerald-600 dark:text-emerald-450" 
                          : weekdayIndex === 5 ? "text-emerald-500" : weekdayIndex === 0 ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
                      }`}>
                        {weekdayName}
                      </span>
                      {!isCurrentMonth && (
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {monthsList[cell.month]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add action Shortcut */}
                  {isCurrentMonth && (
                    <button
                      onClick={() => {
                        setSelectedDateStr(cell.dateString);
                        setIsQuickAddOpen(true);
                      }}
                      title={
                        lang === "bn"
                          ? `${formatDigits(cell.dayNum)} ${monthsList[cell.month]} এ কাজ যুক্ত করুন`
                          : `Add task on ${monthsList[cell.month]} ${formatDigits(cell.dayNum)}`
                      }
                      className="p-1 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-white rounded-lg transition-all text-[10px] font-bold flex items-center gap-0.5 cursor-pointer active:scale-95 text-slate-650 dark:text-slate-350"
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>{lang === "bn" ? "যুক্ত করুন" : "Add"}</span>
                    </button>
                  )}
                </div>

                {/* Tasks Column */}
                {sortedCellTasks.length > 0 ? (
                  <div className="space-y-1 pt-0.5">
                    {sortedCellTasks.map((task) => {
                      const isHigh = task.priority === "high";
                      const isMed = task.priority === "medium";
                      
                      return (
                        <div
                          key={`mobile-task-${task.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setClickedTask(task);
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-all border flex items-center justify-between gap-1.5 hover:scale-[1.01] ${
                            task.completed
                              ? "bg-slate-100/60 dark:bg-slate-950/20 text-slate-400 dark:text-slate-600 line-through border-slate-200/30 dark:border-slate-900/20"
                              : isHigh
                                ? "bg-rose-50/80 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-100/30 dark:border-rose-900/20"
                                : isMed
                                  ? "bg-amber-50/80 dark:bg-amber-955/20 text-amber-600 dark:text-amber-455 border-amber-100/30 dark:border-amber-900/20"
                                  : "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-100/30 dark:border-emerald-900/20"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                              task.completed 
                                ? "bg-slate-400" 
                                : isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                            <span className="truncate">{task.title}</span>
                          </div>
                          
                          {/* Task Time / Priority Badge */}
                          <div className="flex items-center gap-1 text-[8px] text-slate-400 font-mono shrink-0">
                            {task.dueTime && (
                              <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                {formatDigits(task.dueTime)}
                              </span>
                            )}
                            <span className={`px-1 py-0.5 rounded font-extrabold uppercase ${
                              isHigh 
                                ? "bg-rose-100/40 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                                : isMed
                                  ? "bg-amber-100/40 text-amber-600 dark:bg-amber-95/30 dark:text-amber-400"
                                  : "bg-emerald-100/40 text-emerald-600 dark:bg-emerald-95/30 dark:text-emerald-400"
                            }`}>
                              {translatePriority(task.priority)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400/80 italic font-medium pl-1 select-none">
                    {t(lang, "noMobileTasks")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal Popover overlay */}
      {clickedTask && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-sm md:max-w-md w-full border border-slate-150 dark:border-slate-800 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header / Type */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-xl border ${
                clickedTask.priority === "high" 
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border-rose-100 dark:border-rose-900/40" 
                  : clickedTask.priority === "medium"
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border-amber-100 dark:border-amber-900/40"
                    : "bg-emerald-55/10 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
              }`}>
                ⚠️ {clickedTask.priority === "high" ? "জরুরি কাজ" : clickedTask.priority === "medium" ? "মধ্যম অগ্রাধিকার" : "সাধারণ অগ্রাধিকার"}
              </span>

              <button
                onClick={() => setClickedTask(null)}
                className="p-1 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task summary context */}
            <div className="space-y-2">
              <h3 className={`text-base md:text-xl font-extrabold leading-tight text-slate-800 dark:text-slate-100 ${clickedTask.completed ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                {clickedTask.title}
              </h3>
              
              {/* Category tag */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${
                categoryBadgeColors[clickedTask.category] || "bg-slate-55 text-slate-650"
              }`}>
                📁 {clickedTask.category}
              </span>
            </div>

            {/* Details Description */}
            {clickedTask.description && (
              <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold mb-1">কাজের বিবরণ:</span>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                  {clickedTask.description}
                </p>
              </div>
            )}

            {/* Time boxes */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 bg-slate-50/50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black">শেষ তারিখ</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {formatDigits(clickedTask.dueDate)}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-slate-50/50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black">রিমাইন্ডার সময়</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatTimeLocalized(clickedTask.dueTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons inside detail popover */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex gap-2">
              <button
                onClick={() => {
                  onToggleComplete(clickedTask.id);
                  setClickedTask(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 bg-gradient-to-r ${
                  clickedTask.completed
                    ? "from-amber-600 to-orange-600 text-white"
                    : "from-emerald-600 to-teal-600 text-white"
                }`}
              >
                <Check className="w-4 h-4stroke-[2.5]" />
                <span>{clickedTask.completed ? "চলতি ফিরাই (Mark Active)" : "কাজটি শেষ (Complete)"}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে এই টাস্কটি মুছে ফেলতে চান?")) {
                    onDelete(clickedTask.id);
                    setClickedTask(null);
                  }
                }}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl transition cursor-pointer border border-rose-100 dark:border-rose-900/40"
                title="টাস্ক মুছুন"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Creator Dialog Overlay */}
      {isQuickAddOpen && selectedDateStr && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleQuickAddSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-md w-full border border-slate-150 dark:border-slate-800 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
              <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
                <span>{t(lang, "quickTaskAddTitle", { date: formatDigits(selectedDateStr) })}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase">টাস্কের নাম বা শিরোনাম</label>
              <input
                type="text"
                required
                placeholder="যেমন: ইংরেজি ২য় পত্র রিভিশন..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-555 font-semibold"
              />
            </div>

            {/* Desc field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase">বিস্তারিত তথ্য (ঐচ্ছিক)</label>
              <textarea
                placeholder="পরিকল্পনার ছোট একটি বিবরণ লিখুন..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-555 font-semibold min-h-[60px]"
              />
            </div>

            {/* Priority and category double columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase">অগ্রাধিকার</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none font-bold"
                >
                  <option value="high">🚨 জরুরি (High)</option>
                  <option value="medium">⚡ মধ্যম (Medium)</option>
                  <option value="low">🌱 সাধারণ (Low)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase">ক্যাটাগরি</label>
                <select
                  value={isQuickCustomCategory ? "CUSTOM" : newCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CUSTOM") {
                      setIsQuickCustomCategory(true);
                      setNewCategory(quickCustomCategoryText.trim() || "");
                    } else {
                      setIsQuickCustomCategory(false);
                      setNewCategory(val);
                    }
                  }}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none font-bold cursor-pointer"
                >
                  <option value="ব্যক্তিগত">🏠 ব্যক্তিগত</option>
                  <option value="কাজ">💼 কাজ</option>
                  <option value="পড়াশোনা">📚 পড়াশোনা</option>
                  <option value="স্বাস্থ্য">❤️ স্বাস্থ্য</option>
                  <option value="অন্যান্য">✨ অন্যান্য</option>
                  {customCats.map((catName) => (
                    <option key={catName} value={catName}>
                      🏷️ {catName}
                    </option>
                  ))}
                  <option value="CUSTOM">➕ কাস্টম ক্যাটাগরি...</option>
                </select>
              </div>
            </div>

            {isQuickCustomCategory && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase">কাস্টম ক্যাটাগরি লিখুন</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: খেলাধুলা, বাজার..."
                  value={quickCustomCategoryText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuickCustomCategoryText(val);
                    setNewCategory(val.trim() || "");
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-555 font-semibold"
                />
              </div>
            )}

            {/* Time selection */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase">রিমাইন্ডার সময় (Time)</label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Actions submit */}
            <div className="pt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-350 font-bold text-xs rounded-xl transition cursor-pointer select-none"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow shadow-emerald-500/20 active:scale-97 transition cursor-pointer-none flex items-center gap-1"
              >
                <Check className="w-4 h-4 text-white" />
                <span>তালিকায় যুক্ত করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
