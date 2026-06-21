import React, { useState } from "react";
import { 
  Trophy, Zap, Flame, Sparkles, Lock, ShieldAlert,
  Award, Shield, Coins, Target, Star, Crown, CheckCircle
} from "lucide-react";
import { Task } from "../types";
import { playLevelUpSound } from "../utils/audio";

interface QuestCenterProps {
  tasks: Task[];
  gamificationXP: number;
  gamificationStreak: number;
  claimedRewards: string[];
  setGamificationXP: React.Dispatch<React.SetStateAction<number>>;
  setClaimedRewards: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenHistory?: () => void;
}

export interface Quest {
  id: string;
  title: string;
  banglaTitle: string;
  description: string;
  requirementDesc: string;
  xpReward: number;
  badge: { name: string; icon: string; color: string };
  checkProgress: (tasks: Task[], streak: number, level: number) => { current: number; target: number; isUnblocked: boolean };
}

export default function QuestCenter({
  tasks,
  gamificationXP,
  gamificationStreak,
  claimedRewards,
  setGamificationXP,
  setClaimedRewards,
  onOpenHistory
}: QuestCenterProps) {
  
  const currentLevel = Math.floor(gamificationXP / 100) + 1;
  const levelXPStart = (currentLevel - 1) * 100;
  const levelXPEnd = currentLevel * 100;
  const currentLevelProgress = Math.min(100, Math.max(0, ((gamificationXP - levelXPStart) / 100) * 100));

  const totalCompletedCount = tasks.filter(t => t.completed).length;
  const highPriorityCompletedCount = tasks.filter(t => t.completed && t.priority === "high").length;
  const longStopwatchMinutesSpent = Math.round(
    tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0) / 60
  );

  // Define our magical game quests!
  const quests: Quest[] = [
    {
      id: "first_step",
      title: "First Step",
      banglaTitle: "প্রথম সাহসী পদক্ষেপ 🥚",
      description: "যেকোনো ১টি প্রয়োজনীয় কাজ সম্পন্ন করুন",
      requirementDesc: "১টি কাজ সম্পন্ন করুন",
      xpReward: 50,
      badge: { name: "নবিশ যোদ্ধা", icon: "✨", color: "from-sky-550 to-blue-600" },
      checkProgress: (tasks) => {
        const completed = tasks.filter(t => t.completed).length;
        return {
          current: Math.min(1, completed),
          target: 1,
          isUnblocked: completed >= 1
        };
      }
    },
    {
      id: "task_veteran",
      title: "Task Guru",
      banglaTitle: "টাস্ক কারিগর ৫ 🔨",
      description: "সবমিলিয়ে ৫টি অত্যন্ত গুরুত্বপূর্ণ কাজ সম্পন্ন করুন",
      requirementDesc: "৫টি কাজ সম্পন্ন করুন",
      xpReward: 100,
      badge: { name: "সক্রিয় নির্মাতা", icon: "🛠️", color: "from-amber-500 to-orange-605" },
      checkProgress: (tasks) => {
        const completed = tasks.filter(t => t.completed).length;
        return {
          current: Math.min(5, completed),
          target: 5,
          isUnblocked: completed >= 5
        };
      }
    },
    {
      id: "high_flyer",
      title: "High Priority Star",
      banglaTitle: "উচ্চ অগ্রাধিকার বিজেতা ⚡",
      description: "অন্তত ৩টি উচ্চ অগ্রাধিকারের বা অতিগুরুত্বপূর্ণ 'High' প্রায়োরিটি কাজ শেষ করুন",
      requirementDesc: "৩টি high-priority কাজ",
      xpReward: 150,
      badge: { name: "বাজপাখি", icon: "🦅", color: "from-rose-500 to-red-650" },
      checkProgress: (tasks) => {
        const completedHigh = tasks.filter(t => t.completed && t.priority === "high").length;
        return {
          current: Math.min(3, completedHigh),
          target: 3,
          isUnblocked: completedHigh >= 3
        };
      }
    },
    {
      id: "streak_spark",
      title: "Streak Spark",
      banglaTitle: "স্ট্রিক যোদ্ধা 🔥",
      description: "টানা ৩ দিন যেকোনো কাজ সম্পন্ন করে আপনার কাজের স্ট্রিক সচল রাখুন",
      requirementDesc: "স্ট্রিক ৩ দিন বজায় রাখুন",
      xpReward: 200,
      badge: { name: "অগ্নিবীর", icon: "🔥", color: "from-orange-500 to-red-500" },
      checkProgress: (_, streak) => ({
        current: Math.min(3, streak),
        target: 3,
        isUnblocked: streak >= 3
      })
    },
    {
      id: "level_chaser",
      title: "Level 3 Wizard",
      banglaTitle: "লেভেল ৩ এর ম্যাজিশিয়ান 🔮",
      description: "কাজের ধারাবাহিকতা ও গতি দিয়ে ইউজার লেভেল ৩ অতিক্রম করুন",
      requirementDesc: "লেভেল ৩ পৌঁছান",
      xpReward: 250,
      badge: { name: "রুপালি জাদুকর", icon: "🧙‍♂️", color: "from-violet-500 to-purple-650" },
      checkProgress: (_, __, level) => ({
        current: Math.min(3, level),
        target: 3,
        isUnblocked: level >= 3
      })
    },
    {
      id: "grandmaster_quest",
      title: "Grandmaster Focus",
      banglaTitle: "টাস্ক গ্র্যান্ডমাস্টার 👑",
      description: "টোটাল ২৫টি কাজ সম্পূর্ণ করুন এবং কাজের সেরা পারফর্মার হিসেবে স্থান নিন",
      requirementDesc: "২৫টি কাজ সম্পন্ন করুন",
      xpReward: 500,
      badge: { name: "মহাজাদুকর", icon: "👑", color: "from-yellow-500 to-amber-600" },
      checkProgress: (tasks) => {
        const completed = tasks.filter(t => t.completed).length;
        return {
          current: Math.min(25, completed),
          target: 25,
          isUnblocked: completed >= 25
        };
      }
    }
  ];

  // Helper translations for numbers
  const toBn = (num: number) => {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
  };

  const handleClaim = (questId: string, rewardXp: number, banglaTitle: string) => {
    if (claimedRewards.includes(questId)) return;

    setClaimedRewards(prev => [...prev, questId]);
    playLevelUpSound();

    setGamificationXP(prev => {
      const newXP = prev + rewardXp;
      const prevL = Math.floor(prev / 100) + 1;
      const nextL = Math.floor(newXP / 100) + 1;
      if (nextL > prevL) {
        // level-up is handled in main app context modal too
      }
      return newXP;
    });

    // Notify user with a simple modern message
    const alertBox = document.createElement("div");
    alertBox.className = "fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500 text-white p-4.5 rounded-2xl shadow-xl transition-all animate-bounce max-w-sm font-semibold flex items-center gap-3";
    alertBox.innerHTML = `
      <div class="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">🎁</div>
      <div>
        <p class="text-xs text-gray-400 font-bold">অভিনন্দন! রিওয়ার্ড ক্লেইম সফল</p>
        <p class="text-sm font-black text-white mt-0.5">${banglaTitle} আনলক হয়ে +${toBn(rewardXp)} XP যোগ হয়েছে!</p>
      </div>
    `;
    document.body.appendChild(alertBox);
    setTimeout(() => {
      alertBox.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => document.body.removeChild(alertBox), 400);
    }, 4500);
  };

  // Titles list based on level
  const levelTitles = [
    "কাজের শুরুয়াতি",
    "টাস্ক নবিশ (Task Novice) 🥚",
    "সক্রিয় পরিকল্পনাকারী (Active Planner) 🌱",
    "স্ট্রিক যোদ্ধা (Streak Warrior) ⚔️",
    "সময় সেনাপতি (Time Commander) 🛡️",
    "টাস্ক গুরু (Task Guru) 🌟",
    "কাজের মহাজাদুকর (Grandmaster Focus) 🔮",
  ];
  const userRankTitle = levelTitles[Math.min(currentLevel, 6)];

  return (
    <div id="quest-center-tab" className="space-y-6">
      
      {/* 1. Header Hero Panel / Gamer HUD */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-910 to-indigo-950 text-white rounded-3xl p-6 md:p-8 border border-indigo-500/30 dark:border-indigo-500/20 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-1" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-1" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Level up circular badge */}
          <div className="flex flex-col md:flex-row items-center gap-5 shrink-0 text-center md:text-left">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-950/80 border-4 border-emerald-500/80 shadow-lg shadow-emerald-500/10 scale-100 hover:scale-105 transition-all">
              <div className="absolute inset-0.5 rounded-full border border-dashed border-emerald-300 pointer-events-none" />
              <div className="text-center">
                <span className="text-[10px] font-black tracking-wider text-emerald-400 block -mb-1">লেভেল</span>
                <span className="text-4xl font-extrabold font-mono text-white tracking-tighter drop-shadow-sm">
                  {toBn(currentLevel)}
                </span>
              </div>
              <Sparkles className="absolute -top-1.5 -right-1 z-10 w-5 h-5 text-amber-400 animate-bounce" />
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-black bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 py-0.5 px-2.5 rounded-full uppercase tracking-wider">
                  র‍্যাঙ্ক টাইটেল
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  XP: {toBn(gamificationXP)} / {toBn(levelXPEnd)}
                </span>
              </div>
              <h2 className="text-lg md:text-2xl font-black text-slate-100 mt-1 md:mt-2">
                {userRankTitle}
              </h2>
              <p className="text-xs text-slate-450 mt-1 max-w-md">
                প্রতিটি হাই, মিডিয়াম ও লো প্রায়োরিটির কাজ শেষ করে এক্সপি (XP) আর্ন করুন এবং নতুন রিচার্ড আনলক করুন!
              </p>
            </div>
          </div>

          {/* Points, Streak, and Badges stats row */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 shrink-0 w-full md:w-auto">
            
            {/* Flames streak card */}
            <div className="bg-slate-950/80 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4.5 min-w-[130px] flex-1 md:flex-initial text-center justify-center">
              <div className="relative">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 shrink-0">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                {gamificationStreak > 0 && (
                  <span className="absolute -top-1.5 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="text-left">
                <p className="text-[10px] md:text-xs text-slate-400 font-bold">স্ট্রিক (streak)</p>
                <p className="text-base md:text-xl font-black text-red-400 tracking-tight">
                  🔥 {toBn(gamificationStreak)} দিন
                </p>
              </div>
            </div>

            {/* Total XP Score card */}
            <div className="bg-slate-950/80 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4.5 min-w-[130px] flex-1 md:flex-initial text-center justify-center">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shrink-0">
                <Coins className="w-6 h-6 animate-[spin_5s_linear_infinite]" />
              </div>
              <div className="text-left">
                <p className="text-[10px] md:text-xs text-slate-400 font-bold">মোট কয়েন স্কোর</p>
                <p className="text-base md:text-xl font-black text-amber-400 tracking-tight">
                  ✨ {toBn(gamificationXP)} XP
                </p>
              </div>
            </div>

            {/* Completed quests stats card */}
            <div className="bg-slate-950/80 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4.5 min-w-[130px] flex-1 md:flex-initial text-center justify-center">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] md:text-xs text-slate-400 font-bold">টার্গেট সম্পন্ন</p>
                <p className="text-base md:text-xl font-black text-indigo-400 tracking-tight">
                  🏆 {toBn(claimedRewards.length)}টি
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Level ProgressBar */}
        <div className="mt-8 space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">লেভেল {toBn(currentLevel)} অগ্রগতি</span>
            <span className="text-emerald-400">{toBn(Math.round(currentLevelProgress))}%</span>
          </div>
          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-inner"
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400/80 italic text-right">
            পরবর্তী লেভেল {toBn(currentLevel + 1)} আনলক করতে আর {toBn(levelXPEnd - gamificationXP)} XP প্রয়োজন।
          </p>
        </div>

      </div>

      {/* 2. Quest missions grid heading */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <span>টার্গেট ও চ্যালেঞ্জ চ্যালেঞ্জ মিশন (Wizard Quests)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              নিচের দেওয়া চ্যালেঞ্জগুলো সম্পন্ন করুন এবং পুরস্কার ক্লেইম করুন যা আপনাকে আরও দক্ষ কাজ করতে সাহায্য করবে!
            </p>
          </div>
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/10 cursor-pointer transition-all flex items-center gap-1.5 border border-indigo-500/30 select-none animate-[pulse_3s_infinite]"
            >
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span>📊 ৩০ দিনের বিশদ হিস্ট্রি চার্ট বিশ্লেষণ দেখুন</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map((q) => {
            const { current, target, isUnblocked } = q.checkProgress(tasks, gamificationStreak, currentLevel);
            const isClaimed = claimedRewards.includes(q.id);
            const progressPercent = Math.min(100, Math.round((current / target) * 100));

            return (
              <div 
                key={q.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group ${
                  isClaimed 
                    ? "bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800/60 opacity-80"
                    : isUnblocked 
                    ? "bg-gradient-to-b from-indigo-50/20 to-white dark:from-indigo-950/2s dark:to-slate-900 border-indigo-400/60 dark:border-indigo-500/40 shadow-md shadow-indigo-500/5 animate-[pulse_3s_infinite]"
                    : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
                }`}
              >
                {/* Visual badge top background glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${q.badge.color} opacity-5 group-hover:opacity-10 rounded-full blur-xl pointer-events-none transition-all`} />

                <div className="space-y-3.5 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {q.banglaTitle}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-wide">
                        পুরস্কার: +{toBn(q.xpReward)} XP
                      </p>
                    </div>

                    {/* Badge Icon Showcase */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${q.badge.color} text-white flex items-center justify-center text-lg font-bold shadow-md shrink-0`}>
                      {q.badge.icon}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 h-10 overflow-hidden text-ellipsis line-clamp-2">
                    {q.description}
                  </p>

                  {/* Progress info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-slate-450">
                      <span>অগ্রগতি:</span>
                      <span className={isUnblocked ? "text-indigo-500 dark:text-indigo-400" : ""}>
                        {toBn(current)} / {toBn(target)} ({toBn(progressPercent)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-200/45 dark:border-slate-700/50 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClaimed 
                            ? "bg-slate-400" 
                            : isUnblocked 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Claim CTA actions */}
                <div className="mt-4 relative z-10 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isClaimed ? (
                    <div className="w-full py-2 bg-slate-105 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs font-black rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-center gap-1.5 select-none">
                      <CheckCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>পুরস্কার অর্জন করা হয়েছে (Enrolled)</span>
                    </div>
                  ) : isUnblocked ? (
                    <button
                      type="button"
                      onClick={() => handleClaim(q.id, q.xpReward, q.banglaTitle)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-400/20 active:shadow-none"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                      <span>রিওয়ার্ড ক্লেইম করুন!</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-slate-50 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-800/20 flex items-center justify-center gap-1.5 select-none">
                      <Lock className="w-3.5 h-3.5" />
                      <span>লকড রয়েছে ({q.requirementDesc})</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Badge collector display room */}
      <div className="bg-slate-50/50 dark:bg-slate-800/10 p-6 rounded-3xl border border-slate-150 dark:border-slate-800/60 max-w-7xl">
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-500" />
          <span>আপনার অর্জিত ব্যাজ শোরুম (Unlocked Badges Space)</span>
        </h4>
        <p className="text-xs text-slate-550 dark:text-slate-450 mt-1">
          আপনি অর্জিত ও ক্লেইমকৃত টার্গেটগুলোর ব্যাজ সংগ্রহশালা এখানে চমৎকারভাবে দেখতে পাবেন!
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-5">
          {quests.map((q) => {
            const isClaimed = claimedRewards.includes(q.id);
            return (
              <div 
                key={q.id}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                  isClaimed 
                    ? "bg-white dark:bg-slate-850 border-slate-150 dark:border-slate-800 shadow-sm scale-100 hover:scale-105" 
                    : "bg-slate-100/30 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800/30 opacity-40 select-none"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${isClaimed ? q.badge.color : "from-slate-205 to-slate-300 dark:from-slate-800 dark:to-slate-700"} text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-slate-500/5`}>
                  {isClaimed ? q.badge.icon : "🔒"}
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-3 truncate w-full max-w-full">
                  {isClaimed ? q.badge.name : "লকড ব্যাজ"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                  {isClaimed ? "অর্জন করা হয়েছে" : "মুভ অন করুন!"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
