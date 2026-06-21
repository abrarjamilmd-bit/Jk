import React, { useState } from "react";
import { Task } from "../types";
import { 
  Award, Calendar, CheckCircle2, TrendingUp, Sparkles, 
  ChevronDown, ChevronUp, Clock, BookOpen, User, Briefcase, 
  Heart, HelpCircle, RefreshCw, BarChart2, Star, Download
} from "lucide-react";
import { jsPDF } from "jspdf";

interface WeeklyReportProps {
  tasks: Task[];
}

export default function WeeklyReport({ tasks }: WeeklyReportProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showTasksList, setShowTasksList] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Bengali numeric helpers
  const toBengaliDigits = (num: number | string) => {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[Number(w)]);
  };

  // 1. Calculate this week's start and end dates (Sunday - Saturday)
  const getThisWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    
    return { sunday, saturday };
  };

  const { sunday, saturday } = getThisWeekRange();

  // Format date helper for Bengali
  const formatDateBengali = (d: Date) => {
    return d.toLocaleDateString("bn-BD", { month: "long", day: "numeric" });
  };

  // 2. Filter tasks completed/due this week
  const isDateInThisWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d >= sunday && d <= saturday;
    } catch {
      return false;
    }
  };

  // Find completed tasks that are either finished this week (completedAt) or scheduled that are completed
  const completedTasksThisWeek = tasks.filter((t) => {
    if (!t.completed) return false;
    
    // If we have completedAt, prioritize checking if it's this week
    if (t.completedAt) {
      return isDateInThisWeek(t.completedAt);
    }
    
    // Fallback to check if dueDate is in this week
    return isDateInThisWeek(t.dueDate);
  });

  // Total tasks scheduled/due/created this week
  const allTasksThisWeek = tasks.filter((t) => {
    const isDueThisWeek = isDateInThisWeek(t.dueDate);
    const isCreatedThisWeek = isDateInThisWeek(t.createdAt);
    const isCompletedThisWeek = t.completedAt ? isDateInThisWeek(t.completedAt) : false;
    
    return isDueThisWeek || isCreatedThisWeek || isCompletedThisWeek;
  });

  const completedCount = completedTasksThisWeek.length;
  const totalCountThisWeek = allTasksThisWeek.length;
  
  // Clean rating calculation
  const completionRate = totalCountThisWeek > 0 
    ? Math.round((completedCount / totalCountThisWeek) * 100) 
    : 0;

  // 3. Category count breakdown of completed tasks
  const categoriesConfig: Record<string, { label: string; icon: any; colorClass: string; bgClass: string }> = {
    "ব্যক্তিগত": { label: "ব্যক্তিগত", icon: User, colorClass: "text-indigo-600 dark:text-indigo-400", bgClass: "bg-indigo-50 dark:bg-indigo-950/30" },
    "কাজ": { label: "অফিস/কাজ", icon: Briefcase, colorClass: "text-amber-600 dark:text-amber-450", bgClass: "bg-amber-50 dark:bg-amber-950/30" },
    "পড়াশোনা": { label: "শিক্ষা/পড়াশোনা", icon: BookOpen, colorClass: "text-rose-600 dark:text-rose-400", bgClass: "bg-rose-50 dark:bg-rose-950/30" },
    "স্বাস্থ্য": { label: "শরীর ও স্বাস্থ্য", icon: Heart, colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-50 dark:bg-emerald-950/30" },
    "অন্যান্য": { label: "অন্যান্য কাজ", icon: HelpCircle, colorClass: "text-slate-600 dark:text-slate-400", bgClass: "bg-slate-50 dark:bg-slate-950/30" }
  };

  const categoryCompletedCounts = completedTasksThisWeek.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find most successful category
  let topCategory = "নেই";
  let maxCompletedInCategory = 0;
  Object.entries(categoryCompletedCounts).forEach(([cat, val]) => {
    if (val > maxCompletedInCategory) {
      maxCompletedInCategory = val;
      topCategory = cat;
    }
  });

  // 4. Completed per priority
  const highPriorityCompleted = completedTasksThisWeek.filter((t) => t.priority === "high").length;
  const mediumPriorityCompleted = completedTasksThisWeek.filter((t) => t.priority === "medium").length;
  const lowPriorityCompleted = completedTasksThisWeek.filter((t) => t.priority === "low").length;

  // 5. Daily Completion Chart setup for this week (Sunday to Saturday)
  const getWeekdayNameBangali = (dayIdx: number) => {
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    return days[dayIdx];
  };

  const dailyStats = [0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
    // Determine the date of that day in the current week range
    const targetDate = new Date(sunday);
    targetDate.setDate(sunday.getDate() + dayOffset);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Count completions on this date
    const count = completedTasksThisWeek.filter((t) => {
      const cmpDateStr = t.completedAt ? t.completedAt.split("T")[0] : t.dueDate;
      return cmpDateStr === dateStr;
    }).length;

    return {
      dayName: getWeekdayNameBangali(dayOffset),
      shortDayName: getWeekdayNameBangali(dayOffset).substring(0, 3),
      count,
      isToday: new Date().toDateString() === targetDate.toDateString()
    };
  });

  const maxCompletionsPerDay = Math.max(...dailyStats.map(s => s.count), 1);

  // Motivational messages based on weekly accomplishments
  const getMotivationalFeedback = () => {
    if (completedCount === 0) {
      return {
        title: "একটি নতুন শুরু অপেক্ষায়! 🕊️",
        desc: "সপ্তাহে কোনো কাজ এখনও সম্পন্ন করা হয়নি। চিন্তার কিছু নেই! ছোট ছোট কয়েকটি কাজের মধ্য দিয়ে আপনার সপ্তাহটি সফল করে তুলুন।"
      };
    } else if (completedCount <= 2) {
      return {
        title: "কাজের ধারা শুরু হয়েছে! 🌱",
        desc: "দারুণ! আপনি ইতিমধ্যে কিছু কাজ চমৎকারভাবে শেষ করেছেন। এভাবে দৈনিক কাজের ধারাবাহিকতা বজায় রাখুন এবং তালিকায় মনোযোগ দিন।"
      };
    } else if (completedCount <= 5) {
      return {
        title: "দারুণ গতি ও সংকল্প! 🚀",
        desc: "খুব চমৎকার কাজ করছেন! জীবনের প্রতিটি ক্ষেত্রে ভারসাম্য বজায় রেখে সপ্তাহে বেশ কয়েকটি গুরুত্বপূর্ণ লক্ষ্য অর্জন করেছেন।"
      };
    } else {
      return {
        title: "প্রোডাক্টিভিটির শীর্ষে আছেন! 👑",
        desc: "অসাধারণ পারফর্মেন্স! আপনি এ সপ্তাহের কাজের তালিকায় দারুণ ঝড় তুলেছেন। আগামী সপ্তাহের নতুন লক্ষ্যগুলোতে এগিয়ে যান নির্ভয়ে!"
      };
    }
  };

  const feedback = getMotivationalFeedback();

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    
    // Create high-DPI canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsGeneratingPDF(false);
      return;
    }
    
    // Scale for high quality A4 print layout
    canvas.width = 1200;
    canvas.height = 1650;
    
    // Fill safe white/light-gray background
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header styling
    ctx.fillStyle = "#059669"; // emerald-600
    ctx.fillRect(0, 0, canvas.width, 320);
    
    // Aesthetic geometric accents
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.beginPath();
    ctx.arc(canvas.width, 0, 450, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 320, 250, 0, Math.PI * 2);
    ctx.fill();

    // App header title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText("🏆 সপ্তাহ শেষের টু-ডু সামারি রিপোর্ট", 80, 110);
    
    // Date ranges
    ctx.fillStyle = "#d1fae5"; // emerald-100
    ctx.font = "bold 24px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText(`সময়সীমা: ${formatDateBengali(sunday)} - ${formatDateBengali(saturday)}`, 80, 175);
    
    // Timestamp
    const nowLocalDate = new Date();
    const bnDateStr = toBengaliDigits(nowLocalDate.getDate()) + " " + nowLocalDate.toLocaleDateString("bn-BD", { month: "long" }) + ", " + toBengaliDigits(nowLocalDate.getFullYear());
    const bnTimeStr = toBengaliDigits(nowLocalDate.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }));
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "medium 18px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText(`রিপোর্ট তৈরির সময়: ${bnDateStr} (${bnTimeStr})`, 80, 220);

    // Dynamic graphic badge for overall percentage completion
    const drawRoundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string, strokeW?: number) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
      c.fillStyle = fill;
      c.fill();
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = strokeW || 1;
        c.stroke();
      }
    };

    drawRoundedRect(ctx, 840, 75, 280, 170, 24, "rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.25)", 2);
    ctx.fillStyle = "#fde047"; // yellow-300
    ctx.font = "bold 56px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${toBengaliDigits(completionRate)}%`, 980, 150);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText("কাজের সম্পন্নতার হার", 980, 205);
    ctx.textAlign = "left"; // reset

    // 1. Motivation Quote Card (y: 360 to 480)
    drawRoundedRect(ctx, 80, 360, 1040, 130, 20, "#eff6ff", "#bfdbfe", 1.5);
    ctx.fillStyle = "#1e40af"; // blue-800
    ctx.font = "bold 24px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText(`✨ ${feedback.title}`, 120, 410);
    ctx.fillStyle = "#475569"; // slate-600
    ctx.font = "medium 18px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText(feedback.desc, 120, 455);

    // 2. Metrics Block Grid: 4 Cards (y: 520 to 700)
    const cardW = 240;
    const cardH = 170;
    const gap = 26;
    const startX = 80;
    const startY = 520;

    const statsList = [
      { label: "সফলভাবে সম্পন্ন", val: `${toBengaliDigits(completedCount)} টি`, desc: "এই সপ্তাহে সম্পন্ন লক্ষ্য", color: "#059669", fill: "#ecfdf5", stroke: "#a7f3d0" },
      { label: "সাফল্যের হার", val: `${toBengaliDigits(completionRate)}%`, desc: "সামগ্রিক অগ্রগতি মাত্রা", color: "#4f46e5", fill: "#f5f3ff", stroke: "#ddd6fe" },
      { label: "সেরা ক্যাটেগরি", val: topCategory !== "নেই" ? topCategory : "কোনোটিই নয়", desc: `${toBengaliDigits(maxCompletedInCategory)} টি সফল কাজ`, color: "#d97706", fill: "#fffbeb", stroke: "#fef3c7" },
      { label: "উচ্চ অগ্রাধিকার কাজ", val: `${toBengaliDigits(highPriorityCompleted)} টি`, desc: "উচ্চ অগ্রাধিকার সম্পন্ন", color: "#dc2626", fill: "#fef2f2", stroke: "#fca5a5" }
    ];

    statsList.forEach((stat, i) => {
      const x = startX + i * (cardW + gap);
      drawRoundedRect(ctx, x, startY, cardW, cardH, 20, stat.fill, stat.stroke, 1.5);
      
      // Label
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 15px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
      ctx.fillText(stat.label, x + 20, startY + 40);
      
      // Value
      ctx.fillStyle = stat.color;
      ctx.font = "bold 28px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
      ctx.fillText(stat.val, x + 20, startY + 95);
      
      // Description
      ctx.fillStyle = "#94a3b8";
      ctx.font = "medium 14px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
      ctx.fillText(stat.desc, x + 20, startY + 140);
    });

    // 3. Daily Completion Chart (y: 720 to 1020)
    const chartY = 720;
    const chartH = 310;
    drawRoundedRect(ctx, 80, chartY, 1040, chartH, 22, "#ffffff", "#e2e8f0", 1.5);
    
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText("📊 দৈনিক কাজের সফলতা চিত্র (Daily Completion Output)", 120, chartY + 50);

    // Draw chart columns
    const chartStartX = 140;
    const chartMaxW = 920;
    const colW = 64;
    const colGap = (chartMaxW - (7 * colW)) / 6;
    const chartBottomY = chartY + 235;

    dailyStats.forEach((day, idx) => {
      const x = chartStartX + idx * (colW + colGap);
      const hPercent = (day.count / maxCompletionsPerDay);
      const barHeight = Math.max(8, hPercent * 125);
      const barTop = chartBottomY - barHeight;

      // Draw background placeholder
      drawRoundedRect(ctx, x, chartBottomY - 125, colW, 125, 8, "#f1f5f9", undefined, 0);

      // Draw filled bar
      const barGradient = ctx.createLinearGradient(x, barTop, x, chartBottomY);
      if (day.isToday) {
        barGradient.addColorStop(0, "#10b981"); // emerald-500
        barGradient.addColorStop(1, "#14b8a6"); // teal-500
      } else if (day.count > 0) {
        barGradient.addColorStop(0, "#6366f1"); // indigo-500
        barGradient.addColorStop(1, "#4f46e5"); // indigo-600
      } else {
        barGradient.addColorStop(0, "#cbd5e1"); // slate-300
        barGradient.addColorStop(1, "#94a3b8"); // slate-400
      }
      drawRoundedRect(ctx, x, barTop, colW, barHeight, 8, barGradient);

      // Numeric count above bar
      if (day.count > 0) {
        ctx.fillStyle = day.isToday ? "#10b981" : "#4f46e5";
        ctx.font = "bold 18px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(toBengaliDigits(day.count), x + colW / 2, barTop - 12);
      }

      // Weekday name below
      ctx.fillStyle = day.isToday ? "#059669" : "#475569";
      ctx.font = day.isToday ? "bold 16px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif" : "medium 16px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(day.dayName, x + colW / 2, chartBottomY + 34);
      ctx.textAlign = "left"; // reset
    });

    // 4. Completed Tasks List (y: 1060 to 1545)
    const listY = 1060;
    const listH = 475;
    drawRoundedRect(ctx, 80, listY, 1040, listH, 22, "#ffffff", "#e2e8f0", 1.5);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.fillText(`✅ সম্পন্ন কাজের তালিকা (Completed Tasks List)`, 120, listY + 50);

    // List items
    const listStartX = 120;
    const listStartY = listY + 85;
    const itemRowH = 58;
    
    if (completedTasksThisWeek.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "medium 18px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
      ctx.fillText("এই সপ্তাহে সফলভাবে সম্পন্ন কোনো কাজ এখনো পাওয়া যায়নি।", listStartX, listStartY + 60);
    } else {
      const maxItems = 6;
      const itemsToShow = completedTasksThisWeek.slice(0, maxItems);
      
      itemsToShow.forEach((task, idx) => {
        const curY = listStartY + idx * itemRowH;
        const isEven = idx % 2 === 0;
        
        // Background row wrapper
        drawRoundedRect(ctx, listStartX - 10, curY, 960, itemRowH - 10, 10, isEven ? "#f8fafc" : "#ffffff", undefined, 0);
        
        // Completed check icon graphics
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(listStartX + 20, curY + 24, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✓", listStartX + 20, curY + 29);
        ctx.textAlign = "left"; // reset
        
        // Task title text
        ctx.fillStyle = "#334155";
        ctx.font = "bold 16px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
        let title = task.title;
        if (title.length > 55) title = title.substring(0, 52) + "...";
        ctx.fillText(title, listStartX + 48, curY + 30);
        
        // Category representation
        const catText = `📂 ${task.category}`;
        ctx.fillStyle = "#4f46e5";
        ctx.font = "semibold 15px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
        ctx.fillText(catText, listStartX + 540, curY + 30);
        
        // Date completed representation
        const doneDate = task.completedAt ? task.completedAt.split("T")[0] : task.dueDate;
        const doneDateStr = `📅 ${toBengaliDigits(doneDate)}`;
        ctx.fillStyle = "#475569";
        ctx.font = "medium 14px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
        ctx.fillText(doneDateStr, listStartX + 740, curY + 30);
      });

      if (completedTasksThisWeek.length > maxItems) {
        ctx.fillStyle = "#64748b";
        ctx.font = "italic 15px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
        ctx.fillText(`... এবং আরও ${toBengaliDigits(completedTasksThisWeek.length - maxItems)} টি সমাপ্ত কাজের বিশদ তালিকা রয়েছে।`, listStartX, listStartY + (maxItems * itemRowH) + 12);
      }
    }

    // Footnotes and branding
    ctx.fillStyle = "#64748b";
    ctx.font = "medium 14px 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', Vrinda, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("স্মার্ট বাংলা টু-ডু রিমাইন্ডার ও অ্যাক্টিভিটি ম্যানেজার — কাজের সুস্থ লক্ষ্যমাত্রা অর্জন করুন।", canvas.width / 2, 1580);
    ctx.fillText("© ২০২৬ টু-ডু পোর্টাল সহকারী — সর্বস্বত্ব সংরক্ষিত।", canvas.width / 2, 1605);
    ctx.textAlign = "left";

    // Allow browser context to render canvas, then complete the PDF trigger
    setTimeout(() => {
      try {
        const reportImg = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const imgWidth = 210;
        const imgHeight = 288.75; // 210 * 1650 / 1200
        
        pdf.addImage(reportImg, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
        pdf.save(`টু-ডু_সাপ্তাহিক_রিপোর্ট_${new Date().toISOString().split("T")[0]}.pdf`);
      } catch (err) {
        console.error("PDF generation exception: ", err);
        alert("পিডিএফ ফাইল ডাউনলোড করতে একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন বা ব্রাউজার আপডেট করুন।");
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 120);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-150 dark:border-slate-800/85 shadow-md space-y-4 transition-all overflow-hidden relative">
      {/* Visual background ambient pattern */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Title block & toggle header */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-50 dark:border-slate-800"
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-600 text-white p-2 rounded-2xl shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              🏆 সপ্তাহ শেষের সামারি রিপোর্ট (Weekly Summary Report)
            </h3>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
              {formatDateBengali(sunday)} - {formatDateBengali(saturday)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={isGeneratingPDF}
            onClick={handleDownloadPDF}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-xl transition-all shadow-xs cursor-pointer ${
              isGeneratingPDF
                ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 active:scale-95"
            }`}
            title="সাপ্তাহিক কাজের সামারি রিপোর্ট পিডিএফ ডাউনলোড করুন"
          >
            {isGeneratingPDF ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>পিডিএফ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড PDF</span>
              </>
            )}
          </button>

          {completedCount > 0 && (
            <span className="hidden md:inline-flex text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-full uppercase">
              কাজের হার: {toBengaliDigits(completionRate)}%
            </span>
          )}

          <div
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
          >
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-250">
          {/* Milestone Motivational Card */}
          <div className="bg-gradient-to-br from-emerald-600/90 to-teal-700/90 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden shadow-sm">
            <div className="absolute right-0 bottom-0 top-0 w-1/4 opacity-15 flex items-center justify-center">
              <Star className="w-24 h-24 fill-current stroke-none" />
            </div>
            
            <div className="bg-white/10 p-3 rounded-2xl shrink-0 self-center hidden sm:block">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>

            <div className="space-y-1 text-center sm:text-left z-10">
              <h4 className="text-sm font-extrabold flex items-center justify-center sm:justify-start gap-1 text-amber-200">
                <span>{feedback.title}</span>
              </h4>
              <p className="text-xs text-emerald-50 leading-relaxed font-semibold">
                {feedback.desc}
              </p>
            </div>
          </div>

          {/* Core Analytics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Stat Box 1 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">সফলভাবে সম্পন্ন</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {toBengaliDigits(completedCount)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">টি কাজ</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">এই সপ্তাহে সফল সমাপ্তি</p>
            </div>

            {/* Stat Box 2 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">কাজের সাফল্য হার</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {toBengaliDigits(completionRate)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Stat Box 3 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">সেরা ক্যাটেগরি</span>
              <div className="flex items-baseline gap-1 mt-1 shrink-0 text-slate-800 dark:text-slate-100 font-extrabold text-sm sm:text-base">
                <span>{topCategory !== "নেই" ? `📂 ${topCategory}` : "কোনোটিই নয়"}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {topCategory !== "নেই" 
                  ? `${toBengaliDigits(maxCompletedInCategory)}টি সমাপ্ত কাজ` 
                  : "কাজ শেষ করুন"}
              </p>
            </div>

            {/* Stat Box 4 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">উচ্চ অগ্রাধিকার কাজ</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-450 font-mono">
                  {toBengaliDigits(highPriorityCompleted)}
                </span>
                <span className="text-xs text-slate-550 dark:text-slate-450">টি সম্পন্ন</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">জরুরি কাজ সমাধা হয়েছে</p>
            </div>
          </div>

          {/* SVG/CSS based Weekly Bar Timeline Chart */}
          <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              <span>দৈনিক সফলতা চিত্র (Daily Completion Output)</span>
            </h4>

            {/* Pure Bar chart columns layout */}
            <div className="grid grid-cols-7 gap-2 pt-4 items-end h-32 text-center">
              {dailyStats.map((day, idx) => {
                const heightPercent = Math.min((day.count / maxCompletionsPerDay) * 100, 100);
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end gap-1.5 group">
                    {/* Tooltip on hover */}
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-1 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-8 font-mono border border-slate-100 dark:border-slate-700">
                      {toBengaliDigits(day.count)}টি
                    </span>

                    {/* Numeric Count on top */}
                    {day.count > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {toBengaliDigits(day.count)}
                      </span>
                    )}

                    {/* Filled bar column */}
                    <div className="w-full rounded-t-lg bg-slate-200/60 dark:bg-slate-800 flex items-end overflow-hidden h-20">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                          day.isToday 
                            ? "bg-gradient-to-t from-teal-500 to-emerald-500 shadow-md shadow-emerald-500/20" 
                            : day.count > 0 
                              ? "bg-indigo-500 dark:bg-indigo-600" 
                              : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        style={{ height: `${heightPercent || 5}%` }}
                      />
                    </div>

                    {/* Short weekday text */}
                    <span className={`text-[10px] font-semibold truncate max-w-full ${day.isToday ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-slate-500 dark:text-slate-400"}`}>
                      {day.isToday ? "আজ" : day.shortDayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toggle details tasks name done list */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <button
              onClick={() => setShowTasksList(!showTasksList)}
              className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer max-w-max"
            >
              <span>সমাপ্ত কাজের তালিকা ({toBengaliDigits(completedCount)}টি)</span>
              {showTasksList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTasksList && (
              <div className="mt-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/85 max-h-48 overflow-y-auto space-y-2 animate-in fade-in duration-200">
                {completedTasksThisWeek.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 font-semibold">এ সপ্তাহে এখনও কোনো কাজ সম্পন্ন করা হয়নি।</p>
                ) : (
                  completedTasksThisWeek.map((task) => {
                    const CatConfig = categoriesConfig[task.category] || { icon: HelpCircle, bgClass: "bg-slate-50", colorClass: "text-slate-600" };
                    const CatIcon = CatConfig.icon;
                    return (
                      <div 
                        key={task.id} 
                        className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg ${CatConfig.bgClass} ${CatConfig.colorClass}`}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-slate-850 dark:text-slate-200 line-through truncate block">
                              {task.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                              <CatIcon className="w-3 h-3" />
                              <span>{task.category}</span>
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono shrink-0 font-bold">
                          📆 {toBengaliDigits(task.completedAt ? task.completedAt.split("T")[0] : task.dueDate)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
