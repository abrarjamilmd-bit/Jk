import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Bell, Calendar, Clock, CheckCircle, Trash2, 
  Sparkles, RotateCcw, AlertCircle, ArrowRight, Check, CheckSquare, ListTodo, Award, Volume2, VolumeX, HelpCircle,
  Download, Upload, Settings, Target, Zap, Sun, Moon, Trophy, BarChart2, Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, AIResponseTask, LocalBackup } from "./types";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import PriorityChart from "./components/PriorityChart";
import FocusMode from "./components/FocusMode";
import WeeklyReport from "./components/WeeklyReport";
import TaskOntimeReport from "./components/TaskOntimeReport";
import CloudBackup from "./components/CloudBackup";
import CalendarView from "./components/CalendarView";
import { playNotificationChime, playAlarmAlertTone, playLevelUpSound, playCelebrationSound } from "./utils/audio";
import QuestCenter from "./components/QuestCenter";
import GoalHistoryModal from "./components/GoalHistoryModal";
import DailyMilestones from "./components/DailyMilestones";
import { Language, t, translations } from "./utils/translations";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";


export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Real-time local clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // AI Assistance states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Omit<Task, "id" | "completed" | "reminderTriggered" | "createdAt">[]>([]);
  const [aiError, setAiError] = useState("");

  // Active alarms & notifications modal
  const [activeAlarms, setActiveAlarms] = useState<Task[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Sound preference states
  const [reminderSound, setReminderSound] = useState<string>(() => {
    return localStorage.getItem("AIS_TODO_REMINDER_SOUND") || "classic";
  });

  // Custom Category & Card styling states
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem("AIS_TODO_CATEGORY_COLORS");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      "ব্যক্তিগত": "sky",
      "কাজ": "amber",
      "পড়াশোনা": "indigo",
      "স্বাস্থ্য": "rose",
      "অন্যান্য": "purple"
    };
  });

  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("purple");

  const [cardColorStyle, setCardColorStyle] = useState<"border" | "bg" >(() => {
    return (localStorage.getItem("AIS_TODO_CARD_COLOR_STYLE") as "border" | "bg") || "border";
  });

  useEffect(() => {
    localStorage.setItem("AIS_TODO_CATEGORY_COLORS", JSON.stringify(categoryColors));
  }, [categoryColors]);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_CARD_COLOR_STYLE", cardColorStyle);
  }, [cardColorStyle]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "calendar" | "gamification">("list");
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("AIS_TODO_LANGUAGE") as Language) || "bn";
  });

  // Dynamic QR Code & Mobile Sync states
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(window.location.href);
    }
  }, []);

  // Request Native Android notification permission on startup
  useEffect(() => {
    const requestNativePermission = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await LocalNotifications.checkPermissions();
          if (status.display !== "granted") {
            await LocalNotifications.requestPermissions();
          }
        } catch (err) {
          console.error("Native notification setup error:", err);
        }
      }
    };
    requestNativePermission();
  }, []);

  const handleCopyUrl = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("AIS_TODO_LANGUAGE", newLang);
  };

  const toDigits = (val: number | string, language: Language = "bn") => {
    if (language === "bn") {
      const bDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      return String(val).replace(/[0-9]/g, (w) => bDigits[Number(w)]);
    }
    return String(val);
  };

  // State: Gamification Engine
  const [gamificationXP, setGamificationXP] = useState<number>(() => {
    const saved = localStorage.getItem("AIS_TODO_GAMIFICATION_XP");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [gamificationStreak, setGamificationStreak] = useState<number>(() => {
    const saved = localStorage.getItem("AIS_TODO_GAMIFICATION_STREAK");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [lastCompletedDate, setLastCompletedDate] = useState<string>(() => {
    return localStorage.getItem("AIS_TODO_LAST_COMPLETED_DATE") || "";
  });

  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("AIS_TODO_CLAIMED_REWARDS");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showLevelUpModal, setShowLevelUpModal] = useState<{ level: number; title: string } | null>(null);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_GAMIFICATION_XP", String(gamificationXP));
  }, [gamificationXP]);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_GAMIFICATION_STREAK", String(gamificationStreak));
  }, [gamificationStreak]);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_LAST_COMPLETED_DATE", lastCompletedDate);
  }, [lastCompletedDate]);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_CLAIMED_REWARDS", JSON.stringify(claimedRewards));
  }, [claimedRewards]);


  // Global dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("AIS_TODO_DARK_MODE");
    if (saved !== null) {
      return saved === "true";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.setProperty("--theme-bg", "#020617");
      document.documentElement.style.setProperty("--theme-text", "#f8fafc");
      document.documentElement.style.setProperty("--shadow-color", "rgba(0, 0, 0, 0.4)");
      document.documentElement.style.setProperty("--accent-color", "#14b8a6");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.setProperty("--theme-bg", "#f8fafc");
      document.documentElement.style.setProperty("--theme-text", "#0f172a");
      document.documentElement.style.setProperty("--shadow-color", "rgba(148, 163, 184, 0.1)");
      document.documentElement.style.setProperty("--accent-color", "#0d9488");
    }
    localStorage.setItem("AIS_TODO_DARK_MODE", String(isDarkMode));
  }, [isDarkMode]);

  // Quick Add states
  const [quickTitle, setQuickTitle] = useState("");
  const [quickTime, setQuickTime] = useState("");

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    handleAddTask({
      title: quickTitle.trim(),
      category: "ব্যক্তিগত",
      priority: "medium",
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: quickTime,
      reminderEnabled: true,
      description: "",
    });

    setQuickTitle("");
    setQuickTime("");
  };

  // Email Notification Preference States
  const [notificationEmail, setNotificationEmail] = useState<string>(() => {
    return localStorage.getItem("AIS_TODO_NOTIFICATION_EMAIL") || "";
  });
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem("AIS_TODO_EMAIL_REMINDERS_ENABLED") === "true";
  });
  const [testEmailStatus, setTestEmailStatus] = useState<{ type: "success" | "error"; message: string; previewUrl?: string } | null>(null);

  // Local Auto-Backup states
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem("AIS_TODO_AUTOBACKUP_ENABLED") === "true";
  });

  const [localBackups, setLocalBackups] = useState<LocalBackup[]>(() => {
    const saved = localStorage.getItem("AIS_TODO_LOCAL_BACKUPS");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("AIS_TODO_AUTOBACKUP_ENABLED", String(autoBackupEnabled));
  }, [autoBackupEnabled]);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_LOCAL_BACKUPS", JSON.stringify(localBackups));
  }, [localBackups]);

  // Periodic Automated Backup engine
  useEffect(() => {
    if (!autoBackupEnabled || !isInitialized || tasks.length === 0) return;

    // Check if tasks are different from the most recent backup
    const latestBackup = localBackups[0];
    const currentTasksJson = JSON.stringify(tasks);

    if (latestBackup && latestBackup.tasksJson === currentTasksJson) {
      return; // No changes to backup
    }

    // To prevent rapid storage writes while user is typing or creating,
    // we back up after 15 seconds of task state stability (idle)
    const backupTimer = setTimeout(() => {
      const newBackup: LocalBackup = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        tasksCount: tasks.length,
        tasksJson: currentTasksJson
      };

      setLocalBackups((prev) => {
        // Keep up to 10 automated rolling snapshots
        const updated = [newBackup, ...prev];
        return updated.slice(0, 10);
      });
    }, 15000); // 15s debounce limit for write sanity

    return () => clearTimeout(backupTimer);
  }, [tasks, autoBackupEnabled, isInitialized]);

  // Daily Goal setting
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("AIS_TODO_DAILY_GOAL");
    return saved ? parseInt(saved, 10) : 5;
  });

  const changeDailyGoal = (newGoal: number) => {
    const goal = Math.max(1, newGoal);
    setDailyGoal(goal);
    localStorage.setItem("AIS_TODO_DAILY_GOAL", String(goal));
  };

  useEffect(() => {
    localStorage.setItem("AIS_TODO_NOTIFICATION_EMAIL", notificationEmail);
  }, [notificationEmail]);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_EMAIL_REMINDERS_ENABLED", String(emailRemindersEnabled));
  }, [emailRemindersEnabled]);

  useEffect(() => {
    localStorage.setItem("AIS_TODO_REMINDER_SOUND", reminderSound);
  }, [reminderSound]);

  // Audio interval for playing ring sound repeatedly while alarm is active
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Backup / Restore JSON system
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    try {
      const dataStr = JSON.stringify(tasks, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date();
      const dateString = date.toISOString().split("T")[0];
      link.download = `tasks_backup_${dateString}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export backup:", err);
      alert("ব্যাকআপ ফাইল ডাউনলোড করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          const validTasks = json.filter((item: any) => {
            return item && typeof item.title === "string" && typeof item.dueDate === "string";
          });
          if (validTasks.length === 0) {
            alert("সঠিক কাজের তথ্য পাওয়া যায়নি বা ফাইলটির ফরম্যাট সঠিক নয়।");
            return;
          }
          if (window.confirm(`আপনি কি এই ফাইল থেকে ${validTasks.length}টি কাজ রিস্টোর করতে চান?`)) {
            setTasks((prev) => {
              const merged = [...prev];
              validTasks.forEach((importedTask: Task) => {
                if (!merged.some(t => t.id === importedTask.id)) {
                  merged.push(importedTask);
                }
              });
              return merged;
            });
            playNotificationChime(reminderSound);
          }
        } else {
          alert("ভুল ফরম্যাট! ব্যাকআপ ফাইলটি একটি JSON এরে হওয়া প্রয়োজন।");
        }
      } catch (err) {
        console.error("Failed to import backup:", err);
        alert("ফাইলটি লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Load tasks on mount
  useEffect(() => {
    const stored = localStorage.getItem("AIS_TODO_TASKS");
    if (stored) {
      try {
        const parsed: Task[] = JSON.parse(stored);
        
        // Auto-archive logic: Completed tasks older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoMs = sevenDaysAgo.getTime();
        
        const archivedList = parsed.map((task) => {
          if (task.completed && !task.archived) {
            let compDateMs = 0;
            if (task.completedAt) {
              compDateMs = new Date(task.completedAt).getTime();
            } else if (task.dueDate) {
              compDateMs = new Date(task.dueDate).getTime();
            }
            
            if (compDateMs && compDateMs < sevenDaysAgoMs) {
              return { ...task, archived: true };
            }
          }
          return task;
        });
        
        setTasks(archivedList);
      } catch (err) {
        console.error("Error loading tasks:", err);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save tasks on state update
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("AIS_TODO_TASKS", JSON.stringify(tasks));
    }
  }, [tasks, isInitialized]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Send email reminder api helper
  const sendEmailReminder = async (task: Task) => {
    if (!emailRemindersEnabled || !notificationEmail.trim()) return;

    try {
      const response = await fetch("/api/email/send-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: notificationEmail,
          task: {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            dueTime: task.dueTime,
            priority: task.priority,
            category: task.category,
          }
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`Email notification successfully sent for task: "${task.title}". Status:`, data);
      } else {
        console.error("Failed to send email notification:", data.error);
      }
    } catch (err) {
      console.error("Error calling send-reminder API:", err);
    }
  };

  // Test email sender hook inside settings
  const handleSendTestEmail = async () => {
    if (!notificationEmail.trim()) return;
    setTestEmailStatus({ type: "success", message: "ইমেইল তৈরি হচ্ছে..." });

    try {
      const response = await fetch("/api/email/send-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: notificationEmail,
          task: {
            title: "পরীক্ষামূলক নোটিফিকেশন মেইল (Test Reminder)",
            description: "অভিনন্দন! আপনার টু-ডু রিমাইন্ডার ইমেইল সার্ভিস সফলভাবে সংযুক্ত হয়েছে। আপনার কাজের সময়সূচী অনুযায়ী স্বয়ংক্রিয় নোটিফিকেশন মেইল এখন থেকে পাঠানো হবে।",
            dueDate: new Date().toISOString().split("T")[0],
            dueTime: new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit", hour12: false }),
            priority: "high",
            category: "স্বাস্থ্য",
          }
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTestEmailStatus({
          type: "success",
          message: `আপনার ইমেইলে (${notificationEmail}) সফলভাবে একটি টেস্ট মেইল পাঠানো হয়েছে!`,
          previewUrl: data.previewUrl || undefined,
        });
      } else {
        setTestEmailStatus({
          type: "error",
          message: `টেস্ট মেইল পাঠাতে ব্যর্থ: ${data.error || "অজানা অভ্যন্তরীণ ত্রুটি।"}`
        });
      }
    } catch (err: any) {
      setTestEmailStatus({
        type: "error",
        message: `সার্ভার কানেকশন ত্রুটি: ${err.message || "সার্ভারে ইমেইল রিকোয়েস্ট পাঠানো যায়নি।"}`
      });
    }
  };

  // Real-time Reminder engine
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      // Current date: YYYY-MM-DD
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const dateVal = String(now.getDate()).padStart(2, "0");
      const localDateStr = `${year}-${month}-${dateVal}`;

      // Current time: HH:MM
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      const localTimeStr = `${hour}:${minute}`;

      // Find pending tasks that have due time reached or past
      let hasNewAlarm = false;
      const triggeredList: Task[] = [];

      const updatedTasks = tasks.map((task) => {
        if (
          !task.completed &&
          task.reminderEnabled &&
          !task.reminderTriggered
        ) {
          // Compare dates (YYYY-MM-DD)
          const isDatePastOrToday = task.dueDate <= localDateStr;
          // If past date, trigger it. If today's date, trigger if time is past or equal.
          const isTimeReached = task.dueDate < localDateStr || (task.dueDate === localDateStr && task.dueTime <= localTimeStr);

          if (isDatePastOrToday && isTimeReached) {
            hasNewAlarm = true;
            triggeredList.push(task);
            return { ...task, reminderTriggered: true };
          }
        }
        return task;
      });

      if (hasNewAlarm) {
        setTasks(updatedTasks);
        setActiveAlarms((prev) => {
          // Prevent duplicates
          const filterNew = triggeredList.filter(
            (t) => !prev.some((existing) => existing.id === t.id)
          );
          return [...prev, ...filterNew];
        });

        // Send email notifications to the user for triggered tasks
        triggeredList.forEach((task) => {
          sendEmailReminder(task);
        });

        // Trigger native local notifications inside Capacitor (Android/iOS)
        if (Capacitor.isNativePlatform()) {
          triggeredList.forEach((task) => {
            LocalNotifications.schedule({
              notifications: [
                {
                  title: task.title,
                  body: task.description || (lang === "bn" ? "টাস্ক রিমাইন্ডারের সময় হয়েছে!" : "Time for your task reminder!"),
                  id: Math.floor(Math.random() * 1000000) + 1,
                  schedule: { at: new Date(Date.now() + 50) }
                }
              ]
            }).catch((err) => console.error("Native notification schedule failed:", err));
          });
        }
      }
    };

    const reminderTimer = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(reminderTimer);
  }, [tasks, emailRemindersEnabled, notificationEmail, lang]);

  // Repeat alarm chime sound if active alarms exist and not muted
  useEffect(() => {
    if (activeAlarms.length > 0 && !isAudioMuted) {
      // Play immediately
      playAlarmAlertTone(reminderSound);
      // Set interval
      ringIntervalRef.current = setInterval(() => {
        playAlarmAlertTone(reminderSound);
      }, 3000);
    } else {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    }

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
      }
    };
  }, [activeAlarms, isAudioMuted]);

  // Handler: Add custom task
  const handleAddTask = (taskData: Omit<Task, "id" | "completed" | "reminderTriggered" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
      reminderTriggered: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    // Synthesize sweet notification audio chime
    playNotificationChime(reminderSound);
  };

  // Handler: Delete task
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setActiveAlarms((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler: Toggle complete status
  const handleToggleComplete = (id: string) => {
    // Locate the target task to calculate points
    const targetTask = tasks.find((t) => t.id === id);
    if (targetTask) {
      const isChecking = !targetTask.completed;
      if (isChecking) {
        let baseXP = 20;
        if (targetTask.priority === "high") baseXP = 35;
        if (targetTask.priority === "low") baseXP = 10;

        // Calculate consecutive active streak of task completions
        const todayStr = new Date().toISOString().split("T")[0];
        let newStreak = gamificationStreak;

        if (!lastCompletedDate) {
          newStreak = 1;
        } else {
          // Parse as local-safe dates to calculate difference
          const lastDate = new Date(lastCompletedDate + "T00:00:00");
          const todayDate = new Date(todayStr + "T00:00:00");
          const diffMs = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak = gamificationStreak + 1;
          } else if (diffDays > 1) {
            newStreak = 1; // broken streak reset
          }
          // if diffDays === 0, keep same streak (already completed a task today)
        }

        const streakBonus = newStreak * 2;
        const totalXPAwarded = baseXP + streakBonus;

        setGamificationStreak(newStreak);
        setLastCompletedDate(todayStr);

        setGamificationXP((prevXP) => {
          const newXP = prevXP + totalXPAwarded;
          const prevL = Math.floor(prevXP / 100) + 1;
          const nextL = Math.floor(newXP / 100) + 1;

          if (nextL > prevL) {
            const titles = [
              "কাজের শুরুয়াতি",
              "টাস্ক নবিশ (Task Novice) 🥚",
              "সক্রিয় পরিকল্পনাকারী (Active Planner) 🌱",
              "স্ট্রিক যোদ্ধা (Streak Warrior) ⚔️",
              "সময় সেনাপতি (Time Commander) 🛡️",
              "টাস্ক গুরু (Task Guru) 🌟",
              "কাজের মহাজাদুকর (Grandmaster Focus) 🔮"
            ];
            const earnedTitle = titles[Math.min(nextL, 6)];
            setShowLevelUpModal({ level: nextL, title: earnedTitle });
            if (!isAudioMuted) {
              playLevelUpSound();
            }
          }
          return newXP;
        });

        // Trigger dynamic banner
        const pointsBanner = document.createElement("div");
        pointsBanner.className = "fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-full shadow-lg border border-amber-300 flex items-center gap-1.5 animate-bounce select-none pointer-events-none";
        pointsBanner.innerHTML = `✨ +${baseXP} XP আর্নড ${streakBonus > 0 ? `(+${streakBonus} XP স্ট্রিক বোনাস 🔥)` : ""}`;
        document.body.appendChild(pointsBanner);
        setTimeout(() => {
          pointsBanner.classList.add("opacity-0", "transition-all", "duration-500");
          setTimeout(() => document.body.removeChild(pointsBanner), 500);
        }, 1800);

      } else {
        // Penalty for unchecking to avoid spam points
        let baseXP = 20;
        if (targetTask.priority === "high") baseXP = 35;
        if (targetTask.priority === "low") baseXP = 10;
        setGamificationXP((prev) => Math.max(0, prev - baseXP));
      }
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { 
        ...t, 
        completed: !t.completed, 
        completedAt: !t.completed ? new Date().toISOString() : undefined,
        reminderTriggered: t.completed ? false : t.reminderTriggered 
      } : t))
    );
    // Remove if has active alarm
    setActiveAlarms((prev) => prev.filter((t) => t.id !== id));
    if (!isAudioMuted) {
      if (targetTask && !targetTask.completed) {
        playCelebrationSound();
      } else {
        playNotificationChime(reminderSound);
      }
    }
  };

  // Handler: Update specific fields of task
  const handleUpdateTask = (id: string, updatedFields: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t))
    );
  };

  // Handler: Reorder tasks (Drag and Drop support)
  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  // Handler: Snooze Alarm by 10 minutes
  const handleSnoozeAlarm = (id: string) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const snoozedHour = String(now.getHours()).padStart(2, "0");
    const snoozedMin = String(now.getMinutes()).padStart(2, "0");
    const snoozedTime = `${snoozedHour}:${snoozedMin}`;
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const dateVal = String(now.getDate()).padStart(2, "0");
    const snoozedDate = `${year}-${month}-${dateVal}`;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              dueDate: snoozedDate,
              dueTime: snoozedTime,
              reminderTriggered: false,
              reminderEnabled: true,
            }
          : t
      )
    );

    // Remove from active alert Modal state
    setActiveAlarms((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler: Complete task directly from Alarm modal
  const handleCompleteFromAlarm = (id: string) => {
    handleToggleComplete(id);
  };

  // Handler: Dismiss Alarm only (keep task active but silence reminder for now)
  const handleDismissAlarm = (id: string) => {
    setActiveAlarms((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler: Request AI suggestions from Express API (Gemini backend)
  const fetchAISuggestions = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const finalPrompt = customPrompt || aiPrompt;
    if (!finalPrompt.trim()) return;

    setAiLoading(true);
    setAiError("");
    setSuggestedTasks([]);

    try {
      const response = await fetch("/api/gemini/suggest-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt.trim() }),
      });

      if (!response.ok) {
        throw new Error("এআই সার্ভারের সাথে সংযোগ করতে ব্যর্থ হয়েছে।");
      }

      const data = await response.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        // Build candidate list with today date
        const todayStr = new Date().toISOString().split("T")[0];
        const formatted = data.tasks.map((t: AIResponseTask) => ({
          title: t.title,
          category: t.category,
          priority: t.priority,
          dueDate: todayStr,
          dueTime: t.suggestedTime || "10:00",
          reminderEnabled: !!t.suggestedTime,
          description: t.description || "",
        }));
        setSuggestedTasks(formatted);
      } else {
        throw new Error("এআই থেকে কাজের তালিকা সঠিক ফরম্যাটে পাওয়া যায়নি।");
      }
    } catch (err: any) {
      setAiError(err.message || "একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setAiLoading(false);
    }
  };

  // Handler: Import AI task selections to real todo list
  const handleAddSuggestedTask = (index: number) => {
    const item = suggestedTasks[index];
    handleAddTask(item);
    // Remove from candidate list
    setSuggestedTasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddAllSuggestions = () => {
    suggestedTasks.forEach((item) => {
      const newTask: Task = {
        ...item,
        id: crypto.randomUUID(),
        completed: false,
        reminderTriggered: false,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    });
    setSuggestedTasks([]);
    playNotificationChime(reminderSound);
  };

  // Progress Calculations
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const progressPercent = dailyGoal > 0 ? Math.min(100, Math.round((completedTasksCount / dailyGoal) * 100)) : 0;

  // Clock formatter
  const formattedTime = currentTime.toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = currentTime.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const quickPromptPresets = lang === "bn" ? [
    { text: "পরীক্ষার প্রস্তুতি ও পড়াশোনার রুটিন", prompt: "আজ আমার আসন্ন ফাইনাল পরীক্ষার পড়া রিভিশন দেওয়া ও গুরুত্বপূর্ণ ২ টি অধ্যায় শেষ করার তালিকা সাজাও" },
    { text: "সকালের স্বাস্থ্যকর কায়িক অভ্যাস", prompt: "সকালের হালকা ব্যায়াম, পর্যাপ্ত পানি পান, পুষ্টিকর নাস্তা ও মেডিটেশন এর রুটিন সাজাও" },
    { text: "অফিসের কাজের পরিকল্পনা", prompt: "আজকে অফিসের মিটিং, ইমেইল রিপ্লাই, কোড রিভিউ এবং প্রজেক্ট সাবমিশন কাজের সঠিক সময়সূচী" },
    { text: "বাসার টুকিটাকি ও সাপ্তাহিক বাজার", prompt: "সাপ্তাহিক ঘরদোর পরিষ্কার করা, লন্ড্রির কাজ পাঠানো ও প্রয়োজনীয় কাঁচাবাজারের পরিকল্পনা" }
  ] : [
    { text: "Exam Preparation & Study Routine", prompt: "Generate a curated routine for my final exams, including 2 revision modules and active recall tasks." },
    { text: "Morning Healthy Habits", prompt: "Create a list of high-value morning habits like yoga, proper hydration, dietary wellness, and meditation." },
    { text: "Work Office Schedule", prompt: "Formulate a calendar routine of high-importance emails, team brief meetings, critical code review segments, and build targets." },
    { text: "Weekly Shopping & House Chores", prompt: "Organize housework, dusting chores, laundry sorting, and weekend grocery listing." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans flex flex-col transition-colors duration-200">
      {/* Upper ambient glow */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-emerald-100/45 to-transparent pointer-events-none -z-10" />

      {/* Main Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100/70 dark:border-slate-800/80 py-4 px-6 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 text-white p-2.5 rounded-2xl shadow-md shadow-emerald-500/10">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                {lang === "bn" ? "সহজ কাজের তালিকা ও রিমাইন্ডার" : "Simple To-Do & Reminders"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {lang === "bn" ? "আজকের দিনটি গুছিয়ে রাখুন সুপরিকল্পিতভাবে" : "Organize your routine perfectly and with intent"}
              </p>
            </div>
          </div>

          {/* Action Row containing clock + backup downloads */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Focus Mode & Settings Toggle Area */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/65">
              <button
                onClick={() => setIsFocusModeActive((prev) => !prev)}
                title={lang === "bn" ? "ফোকাস মোড চালু করুন (Toggle Focus Mode)" : "Toggle Focus Mode"}
                className={`p-2 rounded-xl border shadow-sm transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold relative overflow-hidden ${
                  isFocusModeActive
                    ? "bg-rose-600 dark:bg-rose-700 text-white border-rose-600 shadow-md scale-102 ring-2 ring-rose-550/20"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-350 border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                <Target className={`w-4 h-4 ${isFocusModeActive ? "text-white animate-spin" : "text-rose-500 animate-pulse"}`} style={{ animationDuration: isFocusModeActive ? "6s" : "4s" }} />
                <span>{t(lang, "focusMode")}</span>
                {isFocusModeActive && (
                  <span className="absolute top-0.5 right-0.5 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                title={lang === "bn" ? "সেটিংস প্যানেল (Configure Settings)" : "Configure Settings"}
                className={`p-2 rounded-xl border shadow-sm transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  isSettingsOpen
                    ? "bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-600 shadow-md scale-102"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-350 border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                <Settings className={`w-4 h-4 ${isSettingsOpen ? "text-white animate-spin" : "text-amber-500"}`} style={{ animationDuration: isSettingsOpen ? "4s" : "0s" }} />
                <span>{lang === "bn" ? "সেটিংস প্যানেল" : "Settings Panel"}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </div>

            {/* DateTime Display */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 px-4 py-2 min-h-[46px] rounded-2xl border border-slate-100 dark:border-slate-800/60">
              <div className="text-right">
                <span id="live-time-ticker" className="block text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide font-mono">
                  🕒 {formattedTime}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-450 font-semibold">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Collapsible Settings Panel */}
      {isSettingsOpen && (
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-150 dark:border-slate-800/85 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-350">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-2xl">
                  <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: "8s" }} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {lang === "bn" ? "⚙️ অ্যাপ্লিকেশন কনফিগারেশন এবং সিস্টেম সেটিংস" : "⚙️ Application Configurations & System Settings"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === "bn" ? "থিম, ভাষা, তথ্য ব্যাকআপ/রিস্টোর এবং রিমাইন্ডার সাউন্ড সেটিংস পরিবর্তন করুন" : "Manage themes, system language translations, JSON backup files, and notification alert ringtones"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-3 py-2 rounded-xl cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t(lang, "close")}
              </button>
            </div>

            {/* General Preferences section: Theme, Language, Backups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
              
              {/* Theme & Visual Mode section */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800/70 rounded-2xl flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {lang === "bn" ? "🎨 ভিজ্যুয়াল ইন্টারফেস থিম" : "🎨 Visual Theme Preference"}
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1">
                    {lang === "bn" ? "আপনার স্বাচ্ছন্দ্য অনুযায়ী ডার্ক বা লাইট মুড নির্বাচন করুন।" : "Toggle between bright solar views and eye-safe cosmic dark themes."}
                  </p>
                </div>
                <button
                   type="button"
                   onClick={() => setIsDarkMode((prev) => !prev)}
                   className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-205 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500 animate-[spin_10s_linear_infinite]" />
                      <span>{lang === "bn" ? "লাইট মোডে পরিবর্তন" : "Switch to Light Mode"}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>{lang === "bn" ? "ডার্ক মোডে পরিবর্তন" : "Switch to Dark Mode"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Language Section */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800/70 rounded-2xl flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {lang === "bn" ? "🌐 ভাষা নির্বাচন (Language)" : "🌐 System Language Option"}
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1">
                    {lang === "bn" ? "অ্যাপ্লিকেশনের জন্য আপনার অবয়ব ভাষা নির্বাচন করুন।" : "Translate application layout items between English and Bengali easily."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => changeLanguage(lang === "bn" ? "en" : "bn")}
                  className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-205 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <span className="text-sm">🌐</span>
                  <span>{lang === "bn" ? "English (ইংরেজি)" : "বাংলা (Bengali)"}</span>
                </button>
              </div>

              {/* Data Management Section */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800/70 rounded-2xl flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {lang === "bn" ? "💾 তথ্য সংরক্ষণ ও পুনরুদ্ধার" : "💾 Data Export & Import"}
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1">
                    {lang === "bn" ? "আপনার ডিভাইসে টু-ডু ও রিমাইন্ডারের ডাটা ডাউনলোড বা আপলোড করুন।" : "Safeguard your task history locally by downloading or uploading external backups."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/35 text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t(lang, "backupData")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/35 text-slate-600 dark:text-slate-350 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                  >
                    <Upload className="w-3.5 h-3.5 text-violet-500" />
                    <span>{t(lang, "restoreData")}</span>
                  </button>
                </div>
              </div>

              {/* QR Code & Mobile Sync Section */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800/70 rounded-2xl flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {lang === "bn" ? "📱 মোবাইলে ব্যবহার করুন" : "📱 Scan for Mobile Sync"}
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 leading-normal">
                    {lang === "bn" ? "ফোনের ক্যামেরা দিয়ে কিউআর (QR) স্ক্যান করে সরাসরি মোবাইলে অ্যাপটি চালু করুন।" : "Scan the QR code below with your phone camera to open the application on your mobile."}
                  </p>
                </div>
                
                <div className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-2 rounded-xl shadow-xs">
                  {qrUrl ? (
                    <div className="relative group p-1 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrUrl)}&color=059669`}
                        alt="Mobile Scan QR"
                        className="w-[100px] h-[100px] rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-[100px] h-[100px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-450">
                      Loading...
                    </div>
                  )}
                  
                  {/* Copy link input container */}
                  <div className="w-full flex items-center gap-1 mt-0.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 pl-2 pr-1 py-1 rounded-lg">
                    <span className="truncate flex-1 text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                      {qrUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-2 py-1 text-[9px] font-black tracking-wide uppercase bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-slate-700/65 rounded shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
                    >
                      {copiedUrl ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600 animate-bounce" />
                      ) : (
                        <span>{lang === "bn" ? "কপি" : "Copy"}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Sound alert section header */}
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                {lang === "bn" ? "🔔 রিমাইন্ডার এবং বিজ্ঞপ্তির সুর পরিবর্তন" : "🔔 Reminder Sounds & Chimes Selector"}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-405">
                {lang === "bn" ? "রিমাইন্ডার এবং সাকসেব অ্যালার্জির জন্য আপনার পছন্দের টিউন নির্বাচন করুন।" : "Choose your favorite tunes or alert chime sounds for task reminders and push notifications"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  value: "classic", 
                  label: lang === "bn" ? "ক্লাসিক চিম (Classic Chime)" : "Classic Chime", 
                  desc: lang === "bn" ? "মিষ্টি স্পষ্ট দ্বৈত সুর যা যেকোনো সাধারণ কাজের সতর্কবার্তার জন্য সেরা।" : "A sweet double chime perfect for regular updates.", 
                  icon: Bell, 
                  bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20", 
                  border: "border-emerald-500" 
                },
                { 
                  value: "zen", 
                  label: lang === "bn" ? "ধ্যানমগ্ন বাটি (Zen Bowl)" : "Zen Bowl", 
                  desc: lang === "bn" ? "গভীর শান্ত তিব্বতি ধ্যানের বাটির আওয়াজ যা প্রফুল্ল চিত্তে স্মরণ করাতে সাহায্য করবে।" : "A mindful, deep Tibetan singing bowl sound.", 
                  icon: Sparkles, 
                  bg: "from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20", 
                  border: "border-indigo-500" 
                },
                { 
                  value: "digital", 
                  label: lang === "bn" ? "ডিজিটাল চিপ (Digital Watch)" : "Digital Watch", 
                  desc: lang === "bn" ? "স্ট্যান্ডার্ড ডিজিটাল ঘড়ির তীক্ষ্ণ কড়া বিপ সিগন্যাল যা মিস করার কোনো সুযোগ নেই।" : "Aggressive alerts ensuring you never miss a deadline.", 
                  icon: Clock, 
                  bg: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20", 
                  border: "border-amber-500" 
                },
                { 
                  value: "arcade", 
                  label: lang === "bn" ? "রেট্রো আরকেড (Arcade Ding)" : "Retro Arcade", 
                  desc: lang === "bn" ? "পুরোনো রেট্রো গেমের কয়েন সংগ্রহের মতো চনমনে আনন্দদায়ক আওয়াজ।" : "A cheerful 8-bit game token sound effect.", 
                  icon: Award, 
                  bg: "from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-rose-950/20", 
                  border: "border-rose-500" 
                }
              ].map((style) => {
                const isSelected = reminderSound === style.value;
                const IconComponent = style.icon;
                return (
                  <div
                    key={style.value}
                    onClick={() => {
                      setReminderSound(style.value);
                      playNotificationChime(style.value);
                    }}
                    className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-4 group select-none hover:shadow-md ${
                      isSelected
                        ? `bg-gradient-to-br ${style.bg} ${style.border} shadow-sm ring-2 ring-emerald-500/10`
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200"}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                            {t(lang, "active")}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {style.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                        {style.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playNotificationChime(style.value);
                        }}
                        className="w-full py-1.5 px-2.5 text-[11px] font-bold rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/50 dark:border-slate-700/50 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        {lang === "bn" ? "🔔 নোটিফিকেশন আওয়াজ চেক" : "🔔 Test Notification Chime"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAlarmAlertTone(style.value);
                        }}
                        className="w-full py-1.5 px-2.5 text-[11px] font-bold rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200/50 dark:border-slate-700/50 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        {lang === "bn" ? "⏰ রিংটোন আওয়াজ চেক" : "⏰ Test Alarm Ringtone"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Category Color Customizer Section */}
            {(() => {
              const defaultCats = ["ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য"];
              const dynamicCategories = Array.from(
                new Set([
                  ...defaultCats,
                  ...tasks.map(t => t.category).filter(Boolean),
                  ...Object.keys(categoryColors)
                ])
              );
              return (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {lang === "bn" ? "🎨 কাস্টম ক্যাটাগরি ও কালার মেকার (Custom Categories & Colors)" : "🎨 Custom Categories & Colors"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {lang === "bn" ? "প্রতিটি সাধারণ বা নতুন কাস্টম ক্যাটাগরির নিজস্ব প্রিয় রঙ ও কার্ড কাস্টমাইজেশন করুন" : "Define unique color themes and visual card backgrounds for custom task categories"}
                        </p>
                      </div>
                    </div>

                    {/* Display Mode Selection: Border Accent vs Full Background Tint */}
                    <div className="flex bg-slate-100/85 dark:bg-slate-800/85 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 self-start sm:self-auto select-none">
                      <button
                        type="button"
                        onClick={() => setCardColorStyle("border")}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          cardColorStyle === "border"
                            ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                      >
                        <span>{lang === "bn" ? "🖌️ বামদিকের বর্ডার" : "🖌️ Left Border Line"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardColorStyle("bg")}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          cardColorStyle === "bg"
                            ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                      >
                        <span>{lang === "bn" ? "🎨 সম্পূর্ণ ব্যাকগ্রাউন্ড" : "🎨 Full Card Tint"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Create New Custom Category sub-section */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-800/70 rounded-2xl space-y-3">
                    <h5 className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      {lang === "bn" ? "➕ নতুন কাস্টম ক্যাটাগরি তৈরি করুন (Create Custom Category)" : "➕ Create Custom Category"}
                    </h5>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {lang === "bn" ? "ক্যাটাগরির নাম" : "Category Name"}
                        </label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder={lang === "bn" ? "যেমন: বাজার, খেলাধুলা, ব্যায়াম..." : "e.g., Shopping, Sports, Gym..."}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
                        />
                      </div>
                      
                      <div className="w-full sm:w-auto space-y-1.5 shrink-0">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {lang === "bn" ? "রঙ নির্বাচন করুন" : "Select Color"}
                        </label>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-850 h-[42px] justify-center">
                          {[
                            { id: "sky", label: lang === "bn" ? "আকাশি" : "Sky Blue", hex: "#0ea5e9" },
                            { id: "amber", label: lang === "bn" ? "কমলা" : "Amber", hex: "#f59e0b" },
                            { id: "indigo", label: lang === "bn" ? "নীল" : "Indigo", hex: "#6366f1" },
                            { id: "rose", label: lang === "bn" ? "লাল" : "Rose Red", hex: "#f43f5e" },
                            { id: "purple", label: lang === "bn" ? "বেগুনী" : "Purple", hex: "#a855f7" },
                            { id: "emerald", label: lang === "bn" ? "সবুজ" : "Emerald Green", hex: "#10b981" },
                            { id: "pink", label: lang === "bn" ? "গোলাপী" : "Pink", hex: "#ec4899" },
                            { id: "teal", label: lang === "bn" ? "টিয়া" : "Teal", hex: "#14b8a6" }
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setNewCatColor(opt.id)}
                              className={`w-4.5 h-4.5 rounded-full border-2 transition-all hover:scale-115 cursor-pointer ${
                                newCatColor === opt.id ? "border-slate-800 dark:border-white scale-110 shadow-xs" : "border-transparent opacity-70 hover:opacity-100"
                              }`}
                              style={{ backgroundColor: opt.hex }}
                              title={opt.label}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const name = newCatName.trim();
                          if (!name) {
                            alert(lang === "bn" ? "অনুগ্রহ করে একটি সঠিক ক্যাটাগরি নাম লিখুন।" : "Please enter a valid category name.");
                            return;
                          }
                          if (dynamicCategories.includes(name)) {
                            alert(lang === "bn" ? "এই ক্যাটাগরিটি ইতিমধ্যে বিদ্যমান রয়েছে!" : "This category already exists!");
                            return;
                          }
                          setCategoryColors(prev => ({
                            ...prev,
                            [name]: newCatColor
                          }));
                          setNewCatName("");
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer h-[42px] flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ক্যাটাগরি যোগ করুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Color Picker List Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {dynamicCategories.map((cat) => {
                      const activeColorName = categoryColors[cat] || (cat === "ব্যক্তিগত" ? "sky" : cat === "কাজ" ? "amber" : cat === "পড়াশোনা" ? "indigo" : cat === "স্বাস্থ্য" ? "rose" : "purple");
                      const colorHexes: Record<string, string> = {
                        sky: "#0ea5e9",
                        amber: "#f59e0b",
                        indigo: "#6366f1",
                        rose: "#f43f5e",
                        purple: "#a855f7",
                        emerald: "#10b981",
                        pink: "#ec4899",
                        teal: "#14b8a6"
                      };
                      const isSystemDefault = defaultCats.includes(cat);
                      return (
                        <div 
                          key={cat} 
                          className="p-3.5 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl border border-slate-150 dark:border-slate-800/70 flex flex-col gap-2.5 transition-all hover:border-slate-200/80 dark:hover:border-slate-705"
                        >
                          <div className="flex items-center justify-between min-w-0">
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate pr-2">
                              {isSystemDefault ? (
                                <span className="shrink-0">{cat === "ব্যক্তিগত" ? "🏠" : cat === "কাজ" ? "💼" : cat === "পড়াশোনা" ? "📚" : cat === "স্বাস্থ্য" ? "❤️" : "🏷️"}</span>
                              ) : (
                                <span className="shrink-0">🏷️</span>
                              )}
                              <span className="truncate">
                                {isSystemDefault ? (lang === "bn" ? cat : (cat === "ব্যক্তিগত" ? "Personal" : cat === "কাজ" ? "Work" : cat === "পড়াশোনা" ? "Study" : cat === "স্বাস্থ্য" ? "Health" : "Others")) : cat}
                              </span>
                            </span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span 
                                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg uppercase tracking-wider text-white"
                                style={{ backgroundColor: colorHexes[activeColorName] || "#a855f7" }}
                              >
                                {activeColorName === "sky" ? (lang === "bn" ? "আকাশি" : "Sky") : activeColorName === "amber" ? (lang === "bn" ? "কমলা" : "Amber") : activeColorName === "indigo" ? (lang === "bn" ? "নীল" : "Indigo") : activeColorName === "rose" ? (lang === "bn" ? "লাল" : "Rose") : activeColorName === "purple" ? (lang === "bn" ? "বেগুনী" : "Purple") : activeColorName === "emerald" ? (lang === "bn" ? "সবুজ" : "Emerald") : activeColorName === "pink" ? (lang === "bn" ? "গোলাপী" : "Pink") : (lang === "bn" ? "টিয়া" : "Teal")}
                              </span>

                              {!isSystemDefault && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(lang === "bn" ? `আপনি কি "${cat}" ক্যাটাগরি এবং এর রঙের কাস্টমাইজেশন মুছতে চান?` : `Are you sure you want to delete the custom category "${cat}" and its coloring?`)) {
                                      setCategoryColors(prev => {
                                        const copy = { ...prev };
                                        delete copy[cat];
                                        return copy;
                                      });
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                                  title={lang === "bn" ? "ক্যাটাগরি মুছুন" : "Delete Category"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: "sky", label: "আকাশি", hex: "#0ea5e9" },
                              { id: "amber", label: "কমলা", hex: "#f59e0b" },
                              { id: "indigo", label: "নীল", hex: "#6366f1" },
                              { id: "rose", label: "লাল", hex: "#f43f5e" },
                              { id: "purple", label: "বেগুনী", hex: "#a855f7" },
                              { id: "emerald", label: "সবুজ", hex: "#10b981" },
                              { id: "pink", label: "গোলাপী", hex: "#ec4899" },
                              { id: "teal", label: "টিয়া", hex: "#14b8a6" }
                            ].map((colorOpt) => {
                              const isSelected = activeColorName === colorOpt.id;
                              return (
                                <button
                                  key={colorOpt.id}
                                  type="button"
                                  onClick={() => setCategoryColors(prev => ({ ...prev, [cat]: colorOpt.id }))}
                                  className={`w-5.5 h-5.5 rounded-full border-2 transition-all hover:scale-115 active:scale-90 cursor-pointer ${
                                    isSelected ? "border-slate-850 dark:border-white scale-110 shadow-sm" : "border-transparent opacity-80 hover:opacity-100"
                                  }`}
                                  style={{ backgroundColor: colorOpt.hex }}
                                  title={`${colorOpt.label}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Email Notification Section */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 p-2.5 rounded-2xl">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">📧 ইমেইল রিমাইন্ডার ও নোটিফিকেশন সেটিংস (Email Alerts)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">আপনার গুরুত্বপূর্ণ কাজের সময় হলে সরাসরি আপনার ইমেইলে নোটিফিকেশন পাঠান</p>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl p-4 border border-slate-150 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* Active Toggle */}
                <div className="md:col-span-3 flex items-center justify-between sm:justify-start gap-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ইমেইল নোটিফিকেশন চালু করুন:</span>
                  <button
                    type="button"
                    onClick={() => setEmailRemindersEnabled(!emailRemindersEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      emailRemindersEnabled ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        emailRemindersEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Recipient Email Input */}
                <div className="md:col-span-5 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">বিজ্ঞপ্তি পাঠানোর ইমেইল:</label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="যেমন: name@example.com"
                    disabled={!emailRemindersEnabled}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-200 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
                  />
                </div>

                {/* Send Test Email Action */}
                <div className="md:col-span-4 flex flex-col gap-1.5 pt-2 md:pt-0">
                  <span className="hidden md:block text-[11px] font-bold text-transparent select-none">কন্ট্রোল:</span>
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={!emailRemindersEnabled || !notificationEmail}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-violet-600 disabled:bg-slate-250 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ টেস্ট ইমেইল পাঠান (Test Email)</span>
                  </button>
                </div>

              </div>

              {/* Status and guidance text */}
              {emailRemindersEnabled && !notificationEmail.trim() && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs rounded-xl flex items-start gap-2 border border-amber-100/50 dark:border-amber-900/50 animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>ইমেইল রিমাইন্ডার সক্রিয় করার জন্য অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা দিন।</span>
                </div>
              )}

              {testEmailStatus && (
                <div className={`p-3 text-xs rounded-xl flex items-start gap-2 border ${
                  testEmailStatus.type === "success"
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/60"
                    : "bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-150 dark:border-rose-900/60"
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{testEmailStatus.message}</p>
                    {testEmailStatus.previewUrl && testEmailStatus.previewUrl !== "mock-preview" && (
                      <p className="text-[11px]">
                        স্যান্ডবক্স ইমেইল ভিউ লিংক:{" "}
                        <a href={testEmailStatus.previewUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-violet-600 dark:text-violet-400">
                          এখানে ক্লিক করে ইমেইলটি দেখুন ↗
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Automatic Local Backup Settings section */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl animate-pulse" style={{ animationDuration: "4s" }}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      💾 স্বয়ংক্রিয় লোকাল ব্যাকআপ (Auto Local Backup)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ব্রাউজারের ইন্টারনাল লোকাল স্টোরেজে আপনার কাজের তালিকা নিরাপদ রাখতে অটো-ব্যাকআপ সচল করুন
                    </p>
                  </div>
                </div>

                {/* Switch button */}
                <button
                  type="button"
                  onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoBackupEnabled ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoBackupEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {autoBackupEnabled && (
                <div className="bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl p-4 border border-slate-150 dark:border-slate-800/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-dashed border-slate-250 dark:border-slate-800 pb-2">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      ⏱️ সম্প্রতি নেওয়া অটো-ব্যাকআপ তালিকা (সর্বোচ্চ ১০টি)
                    </span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-850 px-2 py-0.5 rounded-md font-bold text-slate-600 dark:text-slate-450">
                      {lang === "bn" ? `মোট: ${toDigits(localBackups.length, "bn")}টি` : `Total: ${localBackups.length}`}
                    </span>
                  </div>

                  {localBackups.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-slate-400 italic">
                        {lang === "bn" ? "কোনো অটো-ব্যাকআপ স্লট এখনো তৈরি হয়নি। আপনি কাজ শুরু করলে বা পরিবর্তন করলে স্বয়ংক্রিয়ভাবে ব্যাকআপ জমা হবে।" : "No auto-backups slots generated yet. Backups will occur automatically as you make changes."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                      {localBackups.map((lb, idx) => (
                        <div 
                          key={lb.id}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex items-center justify-between gap-4 self-center"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded-lg mr-1.5 inline-block">
                              #{lang === "bn" ? toDigits(idx + 1, "bn") : idx + 1}
                            </span>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                              {lang === "bn" ? `${toDigits(lb.tasksCount, "bn")}টি কাজ` : `${lb.tasksCount} tasks`}
                            </span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              📅 {new Date(lb.timestamp).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                            </p>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(lang === "bn" ? `আপনি কি এই পূর্বে সংরক্ষিত স্বয়ংক্রিয় ব্যাকআপটি দিয়ে আপনার কাজগুলো রিস্টোর করতে চান?` : `Are you sure you want to restore from this local backup?`)) {
                                  try {
                                    const parsed: Task[] = JSON.parse(lb.tasksJson);
                                    setTasks(parsed);
                                    alert(lang === "bn" ? "কাজের তালিকা সফলভাবে ফিরিয়ে আনা হয়েছে!" : "Tasks restored successfully!");
                                  } catch (err) {
                                    console.error("Back up parsing failed:", err);
                                    alert("রিস্টোর অসফল হয়েছে।");
                                  }
                                }
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                            >
                              রিস্টোর
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(lang === "bn" ? "আপনি কি এই ব্যাকআপ স্লটটি ডিলিট করতে চান?" : "Are you sure you want to delete this backup slot?")) {
                                  setLocalBackups(prev => prev.filter(b => b.id !== lb.id));
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/25 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visual Tab Switcher Row */}
      {!isFocusModeActive && (
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 border border-slate-150/70 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setActiveView("list")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all select-none ${
                  activeView === "list"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                    : "text-slate-600 hover:text-slate-800 dark:text-slate-350 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <ListTodo className="w-4 h-4" />
                <span>{t(lang, "listView")}</span>
              </button>

              <button
                onClick={() => setActiveView("calendar")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all select-none ${
                  activeView === "calendar"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                    : "text-slate-600 hover:text-slate-800 dark:text-slate-350 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{t(lang, "calendarView")}</span>
              </button>

              <button
                onClick={() => setActiveView("gamification")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all select-none ${
                  activeView === "gamification"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                    : "text-slate-600 hover:text-slate-800 dark:text-slate-350 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{t(lang, "gamificationView")} ({lang === "bn" ? toDigits(gamificationXP, "bn") + " এক্সপি" : gamificationXP + " XP"})</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 pr-2">
              <span className="text-[10px] uppercase font-black text-slate-400">{lang === "bn" ? "মোট কাজ:" : "Total Tasks:"}</span>
              <span className="text-xs font-mono font-black py-0.5 px-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                {lang === "bn" ? toDigits(tasks.length, "bn") + " টি" : `${tasks.length} tasks`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content Stage */}
      {isFocusModeActive ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-400">
          <FocusMode
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onExit={() => setIsFocusModeActive(false)}
            reminderSound={reminderSound}
            lang={lang}
          />
        </div>
      ) : activeView === "calendar" ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-400">
          <CalendarView
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteTask}
            onAddTask={(taskData) => handleAddTask({ ...taskData, reminderEnabled: true })}
            categoryColors={categoryColors}
          />
        </div>
      ) : activeView === "gamification" ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-450">
          <QuestCenter
            tasks={tasks}
            gamificationXP={gamificationXP}
            gamificationStreak={gamificationStreak}
            claimedRewards={claimedRewards}
            setGamificationXP={setGamificationXP}
            setClaimedRewards={setClaimedRewards}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Hand: Dashboard Summary & App Forms & AI Suggester */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Progress Goal Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 flex items-center justify-center">
                <Target className="w-32 h-32 rotate-12" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    <Target className="w-3.5 h-3.5 text-emerald-300" />
                    <span>ডেইলি লক্ষ্য: {dailyGoal}টি কাজ</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm select-none">
                    <button 
                      onClick={() => changeDailyGoal(dailyGoal - 1)}
                      title="লক্ষ্য কমান (-১)"
                      className="w-6 h-6 rounded-md hover:bg-white/20 active:scale-90 flex items-center justify-center font-bold text-xs cursor-pointer transition-all focus:outline-none"
                    >
                      -
                    </button>
                    <span className="text-[10px] uppercase font-extrabold px-1 text-emerald-100 select-none">নির্ধারণ</span>
                    <button 
                      onClick={() => changeDailyGoal(dailyGoal + 1)}
                      title="লক্ষ্য বাড়ান (+১)"
                      className="w-6 h-6 rounded-md hover:bg-white/20 active:scale-90 flex items-center justify-center font-bold text-xs cursor-pointer transition-all focus:outline-none"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight leading-snug">
                    {completedTasksCount >= dailyGoal 
                      ? "অসাধারণ! আজকের ডেইলি লক্ষ্য সম্পন্ন হয়েছে! 🎉" 
                      : progressPercent >= 70 
                        ? "দারুণ গতি! আপনি ডেইলি লক্ষ্যের খুব কাছাকাছি!" 
                        : progressPercent >= 30 
                          ? "কাজ এগিয়ে চলছে, সফলভাবে এগিয়ে যান!" 
                          : "আজকের কাজের লক্ষ্য নির্ধারণ করে এগিয়ে চলুন!"}
                  </h2>
                  <p className="text-xs text-emerald-100/90 font-medium mt-1">
                    আজ আপনি {completedTasksCount} / {dailyGoal}টি কাজ সম্পন্ন করেছেন।
                  </p>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-white h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-100 font-semibold">
                    <span>অগ্রগতি</span>
                    <span>{progressPercent}% লক্ষ্য পূরণ হয়েছে</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/20 hover:border-white/30 rounded-xl text-xs font-black text-white transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer select-none"
                >
                  <BarChart2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                  <span>{t(lang, "viewHistoryBtn")}</span>
                </button>
              </div>
            </div>

            {/* Daily Milestones Badges and Rewards Widget */}
            <DailyMilestones tasks={tasks} dailyGoal={dailyGoal} lang={lang} />

            {/* Priority Pie Chart dashboard widget */}
            <PriorityChart tasks={tasks} />

            {/* Ontime Completion Analytics Card */}
            <TaskOntimeReport tasks={tasks} />

            {/* Weekly Summary Report Card */}
            <WeeklyReport tasks={tasks} />

            {/* Form to submit manual Tasks */}
            <TaskForm onAddTask={handleAddTask} categoryColors={categoryColors} />

            {/* AI Task Suggestion Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-md space-y-4">
              <div id="ai-assistant" className="flex items-center gap-2">
                <div className="bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 p-1.5 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">🤖 এআই টাস্ক অ্যাসিস্ট্যান্ট (Gemini-3.5)</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">আপনার আজকের দিনের চিন্তাটি লিখুন, কাজের তালিকা অটোমেটিক তৈরি হবে</p>
                </div>
              </div>

              <form onSubmit={(e) => fetchAISuggestions(e)} className="space-y-2.5">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="যেমন: পরীক্ষার পড়া এবং হালকা বিকেলের রানিং..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      পরিকল্পনা তৈরি হচ্ছে...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      এআই টাস্ক ও রুটিন সাজান
                    </>
                  )}
                </button>
              </form>

              {/* Presets Grid */}
              <div className="space-y-1.5">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">সহজ থিম প্রিসেটসমূহ:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {quickPromptPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiPrompt(preset.prompt);
                        fetchAISuggestions(undefined, preset.prompt);
                      }}
                      disabled={aiLoading}
                      className="text-left text-[11px] p-2 bg-white dark:bg-slate-800/40 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 border border-slate-100 dark:border-slate-800/60 hover:border-violet-100 dark:hover:border-violet-900 rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 font-medium flex items-center justify-between cursor-pointer"
                    >
                      <span>🎯 {preset.text}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Response Display Status */}
              {aiError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2 border border-rose-100 dark:border-rose-900/60">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {suggestedTasks.length > 0 && (
                <div className="border border-violet-100 dark:border-violet-900/60 bg-violet-50/30 dark:bg-violet-950/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-violet-100/50 dark:border-violet-900/45 pb-2">
                    <span className="text-xs font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1">
                      ✨ সাজানো কাজের সুপারিশসমূহ:
                    </span>
                    <button
                      onClick={handleAddAllSuggestions}
                      className="text-[10px] bg-violet-600 hover:bg-violet-700 px-2 py-1 text-white font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      সব যোগ করুন ({suggestedTasks.length})
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {suggestedTasks.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-violet-50/50 dark:border-slate-700/60 shadow-sm flex items-start justify-between gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              item.priority === "high" 
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400" 
                                : item.priority === "medium" 
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450" 
                                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            }`}>
                              {item.priority === "high" ? "জরুরি" : item.priority === "medium" ? "মধ্যম" : "সাধারণ"}
                            </span>
                          </div>
                          {item.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{item.description}</p>}
                          <div className="flex gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                            <span>📁 {item.category}</span>
                            <span>⏰ {item.dueTime}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddSuggestedTask(idx)}
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 shrink-0 border border-emerald-200 dark:border-slate-700 rounded p-1 transition cursor-pointer"
                          title="তালিকায় যুক্ত করুন"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Backup & Restore Card */}
            <CloudBackup tasks={tasks} onRestore={setTasks} />
          </div>

          {/* Right Hand: Task List Filtration & Task Card Renders */}
          <div className="lg:col-span-7">
            <TaskList
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              onReorderTasks={handleReorderTasks}
              categoryColors={categoryColors}
              cardColorStyle={cardColorStyle}
              onAddTask={handleAddTask}
            />
          </div>
        </main>
      )}

      {/* Alarm Modals Overlay */}
      {activeAlarms.length > 0 && (
        <div id="active-alarm-dialog" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-rose-100 shadow-2xl relative overflow-hidden animate-pulse-subtle">
            {/* Red top warning decoration */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500 to-amber-500" />
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-widest">গুরুত্বপূর্ণ কাজের সময়সূচী!</span>
                </div>
                {/* Audio Mute controller */}
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce-subtle" />}
                  {isAudioMuted ? "শব্দ বন্ধ" : "শব্দ অন"}
                </button>
              </div>

              <div className="space-y-4">
                {activeAlarms.map((alarm) => (
                  <div key={alarm.id} className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-2">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                        🔔 রিমাইন্ডার এলার্ট
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-bold bg-slate-50 pr-2">⏰ {alarm.dueTime}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">{alarm.title}</h3>
                    {alarm.description && <p className="text-xs text-slate-500 leading-relaxed">{alarm.description}</p>}
                    
                    {/* Action controls inside alert */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => handleCompleteFromAlarm(alarm.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> শেষ করুন
                      </button>
                      <button
                        onClick={() => handleSnoozeAlarm(alarm.id)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                        title="১০ মিনিটের জন্য স্নুজ করুন"
                      >
                        💤 স্নুজ (১০মি)
                      </button>
                      <button
                        onClick={() => handleDismissAlarm(alarm.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        ❌ বন্ধ করুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {activeAlarms.length > 1 && (
                <div className="text-center">
                  <button
                    onClick={() => setActiveAlarms([])}
                    className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
                  >
                    সবগুলো এলার্ট বাতিল করুন
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer information section */}
      <footer className="mt-auto bg-slate-100/50 border-t border-slate-250 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© ২০২৬ কাজের তালিকা ও রিমাইন্ডার ড্যাশবোর্ড। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-4">
            <span>💻 অফলাইন-ফার্স্ট লোকাল স্টোরেজ ডাটাবেস</span>
            <span>⚡ গুগলের জেমিনি এআই চালিত সাজেশন্স</span>
          </div>
        </div>
      </footer>

      {/* Pinned Quick Add to viewport */}
      <AnimatePresence>
        {!isFocusModeActive && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] z-40"
          >
            <form onSubmit={handleQuickAdd} className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl p-1.5 pl-3.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0 text-amber-500">
                <Zap className="w-4 h-4 fill-amber-500 animate-pulse" />
              </div>
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="দ্রুত কাজ যোগ করুন (যেমন: ওষুধ খাওয়া)..."
                className="flex-1 min-w-0 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              <div className="flex items-center gap-1 text-slate-400 select-none text-[10px]">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/85 border border-slate-200/50 dark:border-slate-750/50 rounded-xl px-2.5 py-1.5 transition-colors focus-within:border-teal-500/50">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="time"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-350 focus:outline-none cursor-pointer w-14"
                    title="সময় নির্ধারণ করুন"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-md disabled:shadow-none hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>যুক্ত করুন</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <GoalHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tasks={tasks}
        setTasks={setTasks}
        dailyGoal={dailyGoal}
        lang={lang}
      />
    </div>
  );
}

