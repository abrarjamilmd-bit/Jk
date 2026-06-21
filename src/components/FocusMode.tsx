import React, { useState, useEffect, useRef } from "react";
import { 
  X, Check, Play, Pause, RotateCcw, Clock, Sparkles, 
  Calendar, AlertCircle, Award, Volume2, VolumeX 
} from "lucide-react";
import { Task } from "../types";
import { t, Language } from "../utils/translations";

interface FocusModeProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onExit: () => void;
  reminderSound: string;
  lang?: Language;
}

export default function FocusMode({ tasks, onToggleComplete, onExit, reminderSound, lang = "bn" }: FocusModeProps) {
  // Find the single most urgent, incomplete task
  const getMostUrgentTask = (): Task | null => {
    const incomplete = tasks.filter((t) => !t.completed);
    if (incomplete.length === 0) return null;

    const priorityWeight = { high: 3, medium: 2, low: 1 };
    
    const sorted = [...incomplete].sort((a, b) => {
      // Priority (high -> medium -> low)
      const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (weightDiff !== 0) return weightDiff;
      
      // Earliest due date
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      
      // Earliest due time
      return a.dueTime.localeCompare(b.dueTime);
    });
    
    return sorted[0];
  };

  const activeTask = getMostUrgentTask();

  // Pomodoro Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound effects inside focus mode using Web Audio API
  const playTickSound = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.005, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      // Ignored
    }
  };

  const playSuccessSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3); // C6

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playSuccessSound();
            return 25 * 60; // Reset
          }
          if (prev % 60 === 0 || prev < 10) {
            playTickSound();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isMuted]);

  // Format Time Helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Universal digit helper based on language selection
  const formatDigits = (val: number | string) => {
    if (lang === "bn") {
      const bDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      return String(val).replace(/[0-9]/g, (w) => bDigits[Number(w)]);
    }
    return String(val);
  };

  // Convert time format to local reading style
  const formatTimeWithPeriod = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const m = parseInt(minutes);
    if (lang === "bn") {
      const ampm = h >= 12 ? "অপরাহ্ন" : "পূর্বাহ্ন";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const bDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      const bDisplayH = String(displayH).replace(/[0-9]/g, (w) => bDigits[Number(w)]);
      const bDisplayM = String(m.toString().padStart(2, "0")).replace(/[0-9]/g, (w) => bDigits[Number(w)]);
      return `${bDisplayH}:${bDisplayM} ${ampm}`;
    } else {
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
    }
  };

  // Progress of 25-minute Pomodoro Timer
  const progressPercent = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 md:p-10 border border-slate-800 shadow-2xl space-y-8 relative overflow-hidden transition-all duration-300">
      {/* Decorative dynamic neon glow background circle */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" style={{ animationDelay: "2s" }} />

      {/* Header Area */}
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              {t(lang, "focusSessionMode")}
            </h2>
            <p className="text-xs text-slate-400">{t(lang, "focusSessionDesc")}</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>{t(lang, "exitFocusMode")}</span>
        </button>
      </div>

      {!activeTask ? (
        /* Empty Scenario (All Tasks Resolved) */
        <div className="relative py-12 flex flex-col items-center justify-center text-center space-y-5 z-10">
          <div className="w-18 h-18 bg-emerald-950/50 text-emerald-400 rounded-full flex items-center justify-center shadow-lg border border-emerald-900/50">
            <Award className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-extrabold text-white">{t(lang, "focusAllTasksDoneTitle")}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t(lang, "focusAllTasksDoneDesc")}
            </p>
          </div>
          <button
            onClick={onExit}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition-all hover:scale-[1.02] cursor-pointer"
          >
            {t(lang, "backToDashboard")}
          </button>
        </div>
      ) : (
        /* Active Task Focus Screen */
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
          {/* Left Column: Huge Task Information Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Priority Tag */}
                <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-lg border ${
                  activeTask.priority === "high" 
                    ? "bg-rose-950/50 text-rose-450 border-rose-900/50" 
                    : activeTask.priority === "medium" 
                      ? "bg-amber-950/50 text-amber-450 border-amber-900/50"
                      : "bg-emerald-950/50 text-emerald-450 border-emerald-900/50"
                }`}>
                  🔥 {activeTask.priority === "high" ? t(lang, "highestPriorityTask") : activeTask.priority === "medium" ? t(lang, "mediumPriorityTask") : t(lang, "lowPriorityTask")}
                </span>

                {/* Category Tag */}
                <span className="text-[10px] bg-slate-800 text-slate-350 px-2.5 py-1 rounded-lg font-bold border border-slate-750">
                  📁 {lang === "en" && activeTask.category === "ব্যক্তিগত" ? "Personal" : 
                      lang === "en" && activeTask.category === "কাজ" ? "Work" : 
                      lang === "en" && activeTask.category === "পড়াশোনা" ? "Study" : 
                      lang === "en" && activeTask.category === "স্বাস্থ্য" ? "Health" : 
                      activeTask.category}
                </span>
                
                {/* Live task counter progress helper */}
                <span className="text-[10px] text-slate-400 font-semibold ml-auto font-mono">
                  {lang === "bn" ? `অনন্য সূত্র আইডি: #${formatDigits(activeTask.id.substring(0, 4))}` : `Unique Reference ID: #${formatDigits(activeTask.id.substring(0, 4))}`}
                </span>
              </div>

              {/* Task Big Title */}
              <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight leading-snug">
                {activeTask.title}
              </h1>
            </div>

            {/* Task Description */}
            {activeTask.description && (
              <div className="bg-slate-950/50 p-4 border border-slate-800/85 rounded-2xl">
                <span className="block text-[9px] text-slate-455 uppercase font-bold tracking-widest mb-1.5">
                  {t(lang, "taskDescriptionLabel")}
                </span>
                <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-medium">
                  {activeTask.description}
                </p>
              </div>
            )}

            {/* Time / Reminders Meta Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="text-rose-500 bg-rose-950/30 p-2 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    {t(lang, "endDate")}
                  </span>
                  <span className="text-xs font-black text-slate-200">
                    {formatDigits(activeTask.dueDate)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="text-amber-500 bg-amber-950/30 p-2 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    {t(lang, "reminderTime")}
                  </span>
                  <span className="text-xs font-black text-slate-200">
                    {formatTimeWithPeriod(activeTask.dueTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Completion Trigger Section */}
            <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onToggleComplete(activeTask.id);
                  playSuccessSound();
                }}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-950/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>{t(lang, "taskCompletedCongrats")}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Pomodoro focus countdown */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/40 p-6 md:p-8 rounded-3xl border border-slate-800/80 space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/40 text-violet-400 text-[10px] font-extrabold border border-violet-900/60 mb-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {t(lang, "focusTimerTitle")}
              </span>
              <p className="text-[10px] text-slate-400">{t(lang, "focusTimerDesc")}</p>
            </div>

            {/* Radial Clock Circle */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Svg dynamic outline ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="6"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="78"
                  className="stroke-emerald-555 fill-none transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 78}`}
                  strokeDashoffset={`${2 * Math.PI * 78 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Time Numbers */}
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3.5xl font-black text-white font-mono tracking-tight select-none">
                  {formatDigits(formatTime(timeLeft))}
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                  {isRunning ? t(lang, "timerRunning") : t(lang, "timerPaused")}
                </span>
              </div>
            </div>

            {/* Play, pause, mute, reset controls */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                title={isMuted ? (lang === "bn" ? "শব্দ অন করুন" : "Unmute Audio") : (lang === "bn" ? "শব্দ মিউট করুন (Mute)" : "Mute Audio")}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isMuted
                    ? "bg-rose-955/20 text-rose-400 border-rose-900/50"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsRunning((prev) => !prev)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isRunning
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>{t(lang, "pauseBtn")}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t(lang, "startBtn")}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeft(25 * 60);
                }}
                title={lang === "bn" ? "রিসেট করুন (Reset / Restart)" : "Reset Timer"}
                className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
