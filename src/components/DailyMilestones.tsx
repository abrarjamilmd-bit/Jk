import React, { useMemo } from "react";
import { Task } from "../types";
import { 
  Sun, Moon, Trophy, Award, Zap, Timer, Sparkles, AlertCircle, Info, Flame
} from "lucide-react";
import { Language, t } from "../utils/translations";

interface DailyMilestonesProps {
  tasks: Task[];
  dailyGoal: number;
  lang?: Language;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlockedColor: string;
  lockedColor: string;
  requirementText: string;
  isUnlocked: boolean;
}

// Bengali digit conversion
const toDigits = (num: number | string, lang: Language) => {
  if (lang !== "bn") return String(num);
  const bdigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (w) => bdigits[Number(w)]);
};

export default function DailyMilestones({ tasks, dailyGoal, lang = "bn" }: DailyMilestonesProps) {
  
  // Calculate today's completed tasks in local date
  const completedTodayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => {
      if (!t.completed || !t.completedAt) return false;
      const tDateStr = t.completedAt.split("T")[0];
      return tDateStr === todayStr;
    });
  }, [tasks]);

  // Define and calculate the milestones
  const milestones = useMemo((): Milestone[] => {
    const completedCount = completedTodayTasks.length;

    // 1. Early bird (before 9:00 AM)
    const hasEarlyBird = completedTodayTasks.some((t) => {
      if (!t.completedAt) return false;
      const hours = new Date(t.completedAt).getHours();
      return hours < 9;
    });

    // 2. Night Owl (after 10:00 PM / 22:00)
    const hasNightOwl = completedTodayTasks.some((t) => {
      if (!t.completedAt) return false;
      const hours = new Date(t.completedAt).getHours();
      return hours >= 22;
    });

    // 3. High Achiever (completedTasks >= dailyGoal)
    const hasHighAchiever = completedCount >= dailyGoal && dailyGoal > 0;

    // 4. Slayer of Giants (completed high priority task)
    const hasSlayerOfGiants = completedTodayTasks.some((t) => t.priority === "high");

    // 5. Deep Focus (Completed task has spent time >= 10 mins / 600s)
    const hasDeepFocus = completedTodayTasks.some((t) => (t.timeSpent || 0) >= 600);

    // 6. Task Marathon (completed >= 4 tasks in a day)
    const hasMarathon = completedCount >= 4;

    return [
      {
        id: "early_bird",
        name: t(lang, "earlyBirdName"),
        description: t(lang, "earlyBirdDesc"),
        requirementText: t(lang, "earlyBirdReq"),
        icon: <Sun className="w-4 h-4 text-amber-500" />,
        unlockedColor: "border-amber-300 dark:border-amber-850 bg-amber-500/10 text-amber-500 shadow-md shadow-amber-500/5",
        lockedColor: "bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-slate-150 dark:border-slate-800",
        isUnlocked: hasEarlyBird
      },
      {
        id: "high_achiever",
        name: t(lang, "highAchieverName"),
        description: t(lang, "highAchieverDesc", { goal: toDigits(dailyGoal, lang) }),
        requirementText: t(lang, "highAchieverReq", { goal: toDigits(dailyGoal, lang) }),
        icon: <Trophy className="w-4 h-4 text-emerald-500 animate-bounce" />,
        unlockedColor: "border-emerald-300 dark:border-emerald-850 bg-emerald-500/10 text-emerald-500 shadow-md shadow-emerald-500/5",
        lockedColor: "bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-slate-150 dark:border-slate-800",
        isUnlocked: hasHighAchiever
      },
      {
        id: "slayer_of_giants",
        name: t(lang, "slayerOfGiantsName"),
        description: t(lang, "slayerOfGiantsDesc"),
        requirementText: t(lang, "slayerOfGiantsReq"),
        icon: <Zap className="w-4 h-4 text-indigo-500 animate-pulse" />,
        unlockedColor: "border-indigo-300 dark:border-indigo-850 bg-indigo-500/10 text-indigo-500 shadow-md shadow-indigo-500/5",
        lockedColor: "bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-slate-150 dark:border-slate-800",
        isUnlocked: hasSlayerOfGiants
      },
      {
        id: "deep_focus",
        name: t(lang, "deepFocusName"),
        description: t(lang, "deepFocusDesc"),
        requirementText: t(lang, "deepFocusReq"),
        icon: <Timer className="w-4 h-4 text-violet-500" />,
        unlockedColor: "border-violet-300 dark:border-violet-850 bg-violet-500/10 text-violet-500 shadow-md shadow-violet-500/5",
        lockedColor: "bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-slate-150 dark:border-slate-800",
        isUnlocked: hasDeepFocus
      },
      {
        id: "night_owl",
        name: t(lang, "nightOwlName"),
        description: t(lang, "nightOwlDesc"),
        requirementText: t(lang, "nightOwlReq"),
        icon: <Moon className="w-4 h-4 text-sky-500" />,
        unlockedColor: "border-sky-300 dark:border-sky-850 bg-sky-500/10 text-sky-500 shadow-md shadow-sky-500/5",
        lockedColor: "bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-slate-150 dark:border-slate-800",
        isUnlocked: hasNightOwl
      },
      {
        id: "marathon",
        name: t(lang, "marathonName"),
        description: t(lang, "marathonDesc"),
        requirementText: t(lang, "marathonReq"),
        icon: <Flame className="w-4 h-4 text-rose-500" />,
        unlockedColor: "border-rose-300 dark:border-rose-850 bg-rose-500/10 text-rose-500 shadow-md shadow-rose-500/5",
        lockedColor: "bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-slate-150 dark:border-slate-805",
        isUnlocked: hasMarathon
      }
    ];
  }, [completedTodayTasks, dailyGoal, lang]);

  const unlockedCount = useMemo(() => {
    return milestones.filter(m => m.isUnlocked).length;
  }, [milestones]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-wider">
            {t(lang, "todayMilestones")}
          </div>
          <h3 className="text-xs font-black text-slate-850 dark:text-slate-100">
            {t(lang, "milestonesTitle")}
          </h3>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
          <span>{t(lang, "milestoneCount", { unlocked: toDigits(unlockedCount, lang), total: toDigits(milestones.length, lang) })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {milestones.map((m) => {
          return (
            <div
              key={m.id}
              className={`group relative p-3 rounded-xl border transition-all duration-300 ${
                m.isUnlocked 
                  ? `${m.unlockedColor} scale-[1] cursor-default hover:scale-[1.02]`
                  : `${m.lockedColor} opacity-60 hover:opacity-100`
              }`}
              title={m.description}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-lg ${m.isUnlocked ? "bg-white dark:bg-slate-950/20 shadow-xs" : "bg-slate-100 dark:bg-slate-800"}`}>
                  {m.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-black leading-tight text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="truncate">{m.name}</span>
                    {m.isUnlocked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                    )}
                  </h4>
                  <p className="text-[9px] text-slate-450 dark:text-slate-400 font-semibold mt-1 leading-normal truncate group-hover:whitespace-normal group-hover:overflow-visible">
                    {m.isUnlocked ? m.description : `🔐 ${m.requirementText}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
