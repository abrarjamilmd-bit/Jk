import React, { useState, useRef } from "react";
import { 
  CheckCircle, Trash2, Edit3, Calendar, Clock, Tag, 
  AlertTriangle, Search, Bell, BellOff, Layers, Check, X,
  GripVertical, ArrowUpDown, FileText, ChevronDown, ChevronUp,
  Bold, Italic, Heading, List, Code, Edit2, Eye,
  Play, Pause, RotateCcw, Timer,
  Home, Briefcase, BookOpen, Heart, Sparkles,
  Mic, MicOff, Square
} from "lucide-react";
import { Task, TaskCategory } from "../types";
import { renderMarkdown } from "../utils";
import { motion, AnimatePresence } from "motion/react";
import VoiceMemosHub from "./VoiceMemosHub";

export const colorThemes: Record<string, {
  border: string;
  borderDark: string;
  bgLight: string;
  bgDark: string;
  iconBgLight: string;
  iconBgDark: string;
  iconTextLight: string;
  iconTextDark: string;
  label: string;
  hex: string;
}> = {
  sky: {
    border: "border-l-sky-500",
    borderDark: "dark:border-l-sky-400",
    bgLight: "bg-sky-50/40 border-sky-100",
    bgDark: "dark:bg-sky-950/10 dark:border-sky-900/30",
    iconBgLight: "bg-sky-100/70",
    iconBgDark: "dark:bg-sky-950/30",
    iconTextLight: "text-sky-600",
    iconTextDark: "dark:text-sky-400",
    label: "আকাশি (Sky Blue)",
    hex: "#0ea5e9"
  },
  amber: {
    border: "border-l-amber-500",
    borderDark: "dark:border-l-amber-450",
    bgLight: "bg-amber-50/40 border-amber-100",
    bgDark: "dark:bg-amber-955/10 dark:border-amber-900/30",
    iconBgLight: "bg-amber-100/70",
    iconBgDark: "dark:bg-amber-955/30",
    iconTextLight: "text-amber-600",
    iconTextDark: "dark:text-amber-400",
    label: "কমলা (Amber)",
    hex: "#f59e0b"
  },
  indigo: {
    border: "border-l-indigo-500",
    borderDark: "dark:border-l-indigo-400",
    bgLight: "bg-indigo-50/40 border-indigo-100",
    bgDark: "dark:bg-indigo-955/10 dark:border-indigo-900/30",
    iconBgLight: "bg-indigo-100/70",
    iconBgDark: "dark:bg-indigo-955/30",
    iconTextLight: "text-indigo-600",
    iconTextDark: "dark:text-indigo-400",
    label: "নীল (Indigo)",
    hex: "#6366f1"
  },
  rose: {
    border: "border-l-rose-500",
    borderDark: "dark:border-l-rose-450",
    bgLight: "bg-rose-50/40 border-rose-100",
    bgDark: "dark:bg-rose-955/10 dark:border-rose-900/30",
    iconBgLight: "bg-rose-100/70",
    iconBgDark: "dark:bg-rose-955/30",
    iconTextLight: "text-rose-600",
    iconTextDark: "dark:text-rose-400",
    label: "লাল (Rose)",
    hex: "#f43f5e"
  },
  purple: {
    border: "border-l-purple-500",
    borderDark: "dark:border-l-purple-400",
    bgLight: "bg-purple-50/40 border-purple-100",
    bgDark: "dark:bg-purple-955/10 dark:border-purple-900/30",
    iconBgLight: "bg-purple-100/70",
    iconBgDark: "dark:bg-purple-955/30",
    iconTextLight: "text-purple-600",
    iconTextDark: "dark:text-purple-400",
    label: "বেগুনী (Purple)",
    hex: "#a855f7"
  },
  emerald: {
    border: "border-l-emerald-500",
    borderDark: "dark:border-l-emerald-400",
    bgLight: "bg-emerald-50/40 border-emerald-100",
    bgDark: "dark:bg-emerald-950/10 dark:border-emerald-900/30",
    iconBgLight: "bg-emerald-100/70",
    iconBgDark: "dark:bg-emerald-950/30",
    iconTextLight: "text-emerald-600",
    iconTextDark: "dark:text-emerald-400",
    label: "সবুজ (Emerald)",
    hex: "#10b981"
  },
  pink: {
    border: "border-l-pink-500",
    borderDark: "dark:border-l-pink-400",
    bgLight: "bg-pink-50/40 border-pink-100",
    bgDark: "dark:bg-pink-955/10 dark:border-pink-900/30",
    iconBgLight: "bg-pink-100/70",
    iconBgDark: "dark:bg-pink-955/30",
    iconTextLight: "text-pink-600",
    iconTextDark: "dark:text-pink-450",
    label: "গোলাপী (Pink)",
    hex: "#ec4899"
  },
  teal: {
    border: "border-l-teal-500",
    borderDark: "dark:border-l-teal-400",
    bgLight: "bg-teal-50/40 border-teal-100",
    bgDark: "dark:bg-teal-950/10 dark:border-teal-900/30",
    iconBgLight: "bg-teal-100/70",
    iconBgDark: "dark:bg-teal-905/30",
    iconTextLight: "text-teal-600",
    iconTextDark: "dark:text-teal-400",
    label: "টিয়া (Teal)",
    hex: "#14b8a6"
  }
};

const defaultCategoryColors: Record<string, string> = {
  "ব্যক্তিগত": "sky",
  "কাজ": "amber",
  "পড়াশোনা": "indigo",
  "স্বাস্থ্য": "rose",
  "অন্যান্য": "purple"
};

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTask: (id: string, updatedFields: Partial<Task>) => void;
  onReorderTasks: (reorderedTasks: Task[]) => void;
  categoryColors?: Record<string, string>;
  cardColorStyle?: "border" | "bg";
  onAddTask?: (taskData: Omit<Task, "id" | "completed" | "reminderTriggered" | "createdAt">) => void;
}

export default function TaskList({ 
  tasks, 
  onToggleComplete, 
  onDelete, 
  onUpdateTask, 
  onReorderTasks,
  categoryColors = {},
  cardColorStyle = "border",
  onAddTask
}: TaskListProps) {
  const defaultCats = ["ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য"];
  const customCats = Object.keys(categoryColors).filter(cat => !defaultCats.includes(cat));

  const lang = typeof window !== "undefined" ? (localStorage.getItem("AIS_TODO_LANGUAGE") || "bn") : "bn";

  const formatSecs = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds === Infinity) return "0:00";
    const rounded = Math.round(totalSeconds);
    const m = Math.floor(rounded / 60);
    const s = rounded % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [activeCategory, setActiveCategory] = useState<TaskCategory>("সব");
  const [activePriority, setActivePriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [activeDateFilter, setActiveDateFilter] = useState<"all" | "today" | "upcoming" | "overdue" | "completed" | "archived" | "voicememos">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyVoiceMemos, setOnlyVoiceMemos] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Voice Note states inside TaskList item card
  const [playingTaskId, setPlayingTaskId] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const listAudioRef = useRef<HTMLAudioElement | null>(null);

  const [recordingTaskId, setRecordingTaskId] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const playVoiceNote = (taskId: string, audioBase64: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingTaskId === taskId) {
      if (listAudioRef.current) {
        listAudioRef.current.pause();
      }
      setPlayingTaskId(null);
    } else {
      if (listAudioRef.current) {
        listAudioRef.current.pause();
        listAudioRef.current.onended = null;
        listAudioRef.current.ontimeupdate = null;
        listAudioRef.current.onloadedmetadata = null;
      }
      const audio = new Audio(audioBase64);
      listAudioRef.current = audio;
      audio.onended = () => {
        setPlayingTaskId(null);
        setAudioCurrentTime(0);
      };
      audio.ontimeupdate = () => {
        setAudioCurrentTime(audio.currentTime);
      };
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration || 0);
      };
      audio.addEventListener("play", () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      });
      audio.play()
        .then(() => {
          setPlayingTaskId(taskId);
          if (audio.duration && !isNaN(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        })
        .catch((err) => {
          console.error("Audio play failed:", err);
        });
    }
  };

  const seekVoiceNote = (time: number, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (listAudioRef.current) {
      listAudioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const startCardRecording = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (listAudioRef.current) {
        listAudioRef.current.pause();
        setPlayingTaskId(null);
      }
      setRecordingTaskId(taskId);
      setRecordingSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onUpdateTask(taskId, {
            voiceNote: base64data,
            voiceNoteDuration: recordingSeconds || 1
          });
          setRecordingTaskId(null);
        };
      };

      mediaRecorder.start();

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopCardRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Mic access error inside TaskList", err);
      alert("মাইক্রোফোন অ্যাক্সেস করতে সমস্যা হচ্ছে বা অনুমতি দেওয়া হয়নি।");
    }
  };

  const stopCardRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelCardRecording = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setRecordingTaskId(null);
  };

  // Clean up player on unmount
  React.useEffect(() => {
    return () => {
      if (listAudioRef.current) {
        listAudioRef.current.pause();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Tick every second to keep stopwatch display updated in real-time
  const [tickTime, setTickTime] = useState<number>(Date.now());
  React.useEffect(() => {
    const activeTimersCount = tasks.some((t) => t.timerRunning);
    if (!activeTimersCount) return;

    const interval = setInterval(() => {
      setTickTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const startTimer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateTask(id, {
      timerRunning: true,
      timerStartedAt: Date.now(),
    });
  };

  const stopTimer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const currentSessionSecs = task.timerStartedAt
      ? Math.round((Date.now() - task.timerStartedAt) / 1000)
      : 0;
    const newTimeSpent = (task.timeSpent || 0) + currentSessionSecs;

    onUpdateTask(id, {
      timerRunning: false,
      timerStartedAt: undefined,
      timeSpent: newTimeSpent,
    });
  };

  const resetTimer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("আপনি কি কাজের সময় ট্র্যাকিং রিসেট করতে চান? পূর্বে হিসাব করা সকল তথ্য মুছে যাবে।")) {
      onUpdateTask(id, {
        timerRunning: false,
        timerStartedAt: undefined,
        timeSpent: 0,
      });
    }
  };

  const getElapsedSeconds = (task: Task): number => {
    let elapsed = task.timeSpent || 0;
    if (task.timerRunning && task.timerStartedAt) {
      const diff = Math.max(0, Math.round((tickTime - task.timerStartedAt) / 1000));
      elapsed += diff;
    }
    return elapsed;
  };

  const formatStopwatchTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hStr = String(hours).padStart(2, "0");
    const mStr = String(minutes).padStart(2, "0");
    const sStr = String(seconds).padStart(2, "0");

    return `${toBengaliDigits(hStr)}:${toBengaliDigits(mStr)}:${toBengaliDigits(sStr)}`;
  };

  // Sorting and Dragging States
  const [sortBy, setSortBy] = useState<"smart" | "manual">("smart");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
    // Auto-switch to manual mode when dragging, to allow visual rearrange
    setSortBy("manual");
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedTaskId) {
      setDragOverTaskId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const draggedIdx = tasks.findIndex((t) => t.id === draggedTaskId);
    const targetIdx = tasks.findIndex((t) => t.id === targetId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const updated = [...tasks];
      const [removed] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, removed);
      onReorderTasks(updated);
    }

    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // States for Editing
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<string>("ব্যক্তিগত");
  const [isEditCustomCategory, setIsEditCustomCategory] = useState(false);
  const [editCustomCategoryText, setEditCustomCategoryText] = useState("");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("medium");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editReminder, setEditReminder] = useState(true);

  // Notes editing states
  const [editNotes, setEditNotes] = useState("");
  const [editNotesTab, setEditNotesTab] = useState<"write" | "preview">("write");
  const editNotesRef = useRef<HTMLTextAreaElement>(null);

  // Notes expand tracking state
  const [expandedNotesIds, setExpandedNotesIds] = useState<Record<string, boolean>>({});

  const toggleNotesExpand = (id: string) => {
    setExpandedNotesIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper inside edit text-area to insert formatting at caret
  const insertEditFormat = (prefix: string, suffix: string = "") => {
    const el = editNotesRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || "") + suffix;

    setEditNotes(text.substring(0, start) + replacement + text.substring(end));
    
    // Put focus back and select inserted text
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "").length);
    }, 50);
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    
    const isDefault = ["ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য"].includes(task.category);
    if (!isDefault) {
      setIsEditCustomCategory(true);
      setEditCustomCategoryText(task.category);
    } else {
      setIsEditCustomCategory(false);
      setEditCustomCategoryText("");
    }

    setEditCategory(task.category);
    setEditPriority(task.priority);
    setEditDate(task.dueDate);
    setEditTime(task.dueTime);
    setEditDesc(task.description);
    setEditNotes(task.notes || "");
    setEditNotesTab("write");
    setEditReminder(task.reminderEnabled);
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    onUpdateTask(id, {
      title: editTitle.trim(),
      category: editCategory,
      priority: editPriority,
      dueDate: editDate,
      dueTime: editTime || "12:00",
      description: editDesc.trim(),
      notes: editNotes.trim(),
      reminderEnabled: editReminder,
      reminderTriggered: false, // Reset trigger status so updated reminder can sound
    });
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  // Date handlers
  const todayStr = new Date().toISOString().split("T")[0];

  const defaultCategories = ["ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য"];
  
  // Find all unique custom categories actually existing in the task list
  const customCategories = Array.from(new Set(
    tasks
      .map(t => t.category)
      .filter((cat): cat is string => typeof cat === "string" && cat.trim() !== "" && !defaultCategories.includes(cat))
  ));

  const categories: TaskCategory[] = ["সব", ...defaultCategories, ...customCategories];

  // Category Icon Map
  const categoryIcons: Record<string, string> = {
    ব্যক্তিগত: "🏠",
    কাজ: "💼",
    পড়াশোনা: "📚",
    স্বাস্থ্য: "❤️",
    অন্যান্য: "✨",
  };

  // Category Lucide Icon Map Component
  const GetCategoryLucideIcon = ({ category, className }: { category: string; className?: string }) => {
    switch (category) {
      case "ব্যক্তিগত":
        return <Home className={className} />;
      case "কাজ":
        return <Briefcase className={className} />;
      case "পড়াশোনা":
        return <BookOpen className={className} />;
      case "স্বাস্থ্য":
        return <Heart className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    // Hide archived tasks from normal views, or only show them in archived view
    if (activeDateFilter === "archived") {
      if (!task.archived) return false;
    } else {
      if (task.archived) return false;
    }

    // Filter voice memos if toggled
    if (onlyVoiceMemos && !task.voiceNote) {
      return false;
    }

    // 1. Category Filter
    if (activeCategory !== "সব" && task.category !== activeCategory) {
      return false;
    }

    // 2. Priority Filter
    if (activePriority !== "all" && task.priority !== activePriority) {
      return false;
    }

    // 3. Date / Status Filter
    if (activeDateFilter === "completed") {
      if (!task.completed) return false;
    } else if (activeDateFilter === "voicememos") {
      if (!task.voiceNote) return false;
    } else if (activeDateFilter !== "archived") {
      // For other filters, we separate by complete status (by default all except date filter can show completed, or let's refine:
      // if completed filter is active, only finished items. If not, we want to filter pending items by date or all)
      if (activeDateFilter === "today") {
        if (task.dueDate !== todayStr || task.completed) return false;
      } else if (activeDateFilter === "upcoming") {
        if (task.dueDate <= todayStr || task.completed) return false;
      } else if (activeDateFilter === "overdue") {
        if (task.dueDate >= todayStr || task.completed) return false;
      }
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const matchTitle = (task.title || "").toLowerCase().includes(normalizedQuery);
      const matchDesc = (task.description || "").toLowerCase().includes(normalizedQuery);
      const matchNotes = (task.notes || "").toLowerCase().includes(normalizedQuery);
      return matchTitle || matchDesc || matchNotes;
    }

    return true;
  });

  // Sort tasks: High priority first, then medium, then low. For same priority, sort by Time.
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedTasks = sortBy === "smart"
    ? [...filteredTasks].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Uncompleted first
        }
        const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (weightDiff !== 0) return weightDiff;
        
        // Sort by Date
        if (a.dueDate !== b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        // Sort by Time
        return a.dueTime.localeCompare(b.dueTime);
      })
    : filteredTasks;

  // Count summary
  const unarchivedTasks = tasks.filter(t => !t.archived);
  const archivedTasks = tasks.filter(t => t.archived);

  const todayCount = unarchivedTasks.filter(t => t.dueDate === todayStr && !t.completed).length;
  const overdueCount = unarchivedTasks.filter(t => t.dueDate < todayStr && !t.completed).length;
  const upcomingCount = unarchivedTasks.filter(t => t.dueDate > todayStr && !t.completed).length;
  const completedCount = unarchivedTasks.filter(t => t.completed).length;
  const archivedCount = archivedTasks.length;
  const voicememosCount = unarchivedTasks.filter(t => t.voiceNote).length;

  const toBengaliDigits = (num: number | string) => {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[Number(w)]);
  };

  return (
    <div className="space-y-6">
      {/* Prominent Search Card at the top of the Task List */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-150/80 dark:border-slate-800 shadow-md group transition-all duration-305 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative">
          <input
            type="text"
            placeholder="আপনার কাজের বিশাল তালিকা থেকে খুঁজুন (টাস্কের নাম বা বিস্তারিত তথ্য দিয়ে)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-11 pr-16 py-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500/80 transition-all font-semibold shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5 transition-colors group-focus-within:text-emerald-500" />
          
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3.5 top-3 text-xs bg-slate-200/60 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-705 px-2.5 py-1 text-slate-550 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200 font-bold rounded-lg cursor-pointer transition-all"
            >
              মুছুন
            </button>
          )}
        </div>

        {/* Dynamic Search status count badge when search is active */}
        {searchQuery.trim() && (
          <div className="mt-3 flex items-center justify-between text-xs bg-slate-50/60 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="font-bold flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-emerald-600 dark:text-emerald-450">🔍 অনুসন্ধান ফলাফল:</span>
              <span className="text-slate-850 dark:text-slate-205 italic truncate max-w-[150px] sm:max-w-xs">"{searchQuery}"</span>
            </span>
            <span className="font-mono font-extrabold shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-[10px]">
              {toBengaliDigits(filteredTasks.length)} টি কাজ পাওয়া গেছে
            </span>
          </div>
        )}

        {/* Quick voice notes search toggle */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100/80 dark:border-slate-800/40">
          <button
            type="button"
            onClick={() => setOnlyVoiceMemos(!onlyVoiceMemos)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 select-none ${
              onlyVoiceMemos
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-[1.02]"
                : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-800/50"
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${onlyVoiceMemos ? "animate-pulse text-white" : "text-emerald-500"}`} />
            <span>
              {lang === "bn" ? "শুধু ভয়েস মেমো যুক্ত কাজ" : "Show Only Tasks with Voice Memos"}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-black ${
              onlyVoiceMemos 
                ? "bg-emerald-500 text-white" 
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}>
              {toBengaliDigits(voicememosCount)}
            </span>
          </button>

          {onlyVoiceMemos && (
            <button
              onClick={() => setOnlyVoiceMemos(false)}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-450 dark:hover:text-rose-350 transition-colors cursor-pointer"
            >
              {lang === "bn" ? "ফিল্টার বন্ধ করুন" : "Clear filter"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs and filters row */}
      <div className="flex flex-col gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick status filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveDateFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeDateFilter === "all"
                  ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-705"
              }`}
            >
              সব কাজ ({unarchivedTasks.length})
            </button>
            <button
              onClick={() => setActiveDateFilter("today")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                activeDateFilter === "today"
                  ? "bg-emerald-600 dark:bg-emerald-700 text-white shadow-sm"
                  : "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              আজকের কাজ 🔔
              {todayCount > 0 && (
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {todayCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveDateFilter("upcoming")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                activeDateFilter === "upcoming"
                  ? "bg-indigo-600 dark:bg-indigo-700 text-white shadow-sm"
                  : "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              }`}
            >
              আগামী কাজ
              {upcomingCount > 0 && (
                <span className="bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {upcomingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveDateFilter("overdue")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                activeDateFilter === "overdue"
                  ? "bg-rose-600 dark:bg-rose-700 text-white shadow-sm"
                  : "bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-405 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              }`}
            >
              অতিবাহিত কাজ ⚠️
              {overdueCount > 0 && (
                <span className="bg-rose-200 dark:bg-rose-905 text-rose-800 dark:text-rose-100 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {overdueCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveDateFilter("completed")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                activeDateFilter === "completed"
                  ? "bg-teal-600 dark:bg-teal-700 text-white shadow-sm"
                  : "bg-teal-50/60 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 hover:bg-teal-55 dark:hover:bg-teal-950/30"
              }`}
            >
              সম্পন্ন কাজ 🎉
              {completedCount > 0 && (
                <span className="bg-teal-100 dark:bg-teal-905 text-teal-800 dark:text-teal-200 text-[10px] px-1.5 rounded-full flex items-center justify-center font-bold">
                  {completedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveDateFilter("voicememos")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                activeDateFilter === "voicememos"
                  ? "bg-emerald-600 dark:bg-emerald-700 text-white shadow-sm"
                  : "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              🎙️ {lang === "bn" ? "ভয়েস মেমো" : "Voice Memos"}
              {voicememosCount > 0 && (
                <span className="bg-emerald-100 dark:bg-emerald-905 text-emerald-800 dark:text-emerald-200 text-[10px] px-1.5 rounded-full flex items-center justify-center font-bold">
                  {voicememosCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveDateFilter("archived")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                activeDateFilter === "archived"
                  ? "bg-slate-700 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100/70 dark:bg-slate-800 text-slate-605 dark:text-slate-350 hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
              }`}
            >
              আর্কাইভকৃত 📦
              {archivedCount > 0 && (
                <span className="bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-300 text-[10px] px-1.5 rounded-full flex items-center justify-center font-bold">
                  {archivedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category & Priority Filters */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 animate-pulse" /> ফিল্টার ক্যাটাগরি:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((cat) => {
                const targetCountList = activeDateFilter === "archived" 
                  ? archivedTasks 
                  : activeDateFilter === "voicememos"
                  ? unarchivedTasks.filter(t => t.voiceNote)
                  : unarchivedTasks;
                const count = cat === "সব" 
                  ? targetCountList.length 
                  : targetCountList.filter(t => t.category === cat).length;
                
                // Color badges based on active category
                const catColors: Record<string, string> = {
                  "সব": "border-slate-200 dark:border-slate-700/80 text-slate-705 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-200/50 dark:hover:bg-slate-700",
                  "ব্যক্তিগত": "border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-slate-800/60 hover:bg-sky-100/50 dark:hover:bg-slate-700/60",
                  "কাজ": "border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-slate-800/60 hover:bg-amber-100/50 dark:hover:bg-slate-700/60",
                  "পড়াশোনা": "border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-slate-800/60 hover:bg-indigo-100/50 dark:hover:bg-slate-700/60",
                  "স্বাস্থ্য": "border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-slate-800/60 hover:bg-rose-100/50 dark:hover:bg-slate-700/60",
                  "অন্যান্য": "border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-slate-800/60 hover:bg-purple-100/50 dark:hover:bg-slate-700/60"
                };
                
                const activeClasses: Record<string, string> = {
                  "সব": "bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white border-slate-800 dark:border-slate-300 shadow-sm",
                  "ব্যক্তিগত": "bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/10",
                  "কাজ": "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/10",
                  "পড়াশোনা": "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/10",
                  "স্বাস্থ্য": "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/10",
                  "অন্যান্য": "bg-purple-500 text-white border-purple-500 shadow-sm shadow-purple-500/10"
                };

                const isActive = activeCategory === cat;

                return (
                  <button
                    key={cat}
                    id={`cat-filter-btn-${cat}`}
                    onClick={() => {
                      setActiveCategory(cat);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 shrink-0 cursor-pointer border flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? activeClasses[cat] || "bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-500/10"
                        : catColors[cat] || "border-teal-100 dark:border-teal-900/40 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-slate-800/65 hover:bg-teal-50 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <span className="text-sm">{cat === "সব" ? "🌈" : (categoryIcons[cat] || "🏷️")}</span>
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick interactive dropdown for priority filters next to category selections */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-850/30 p-1.5 rounded-xl border border-slate-150/60 dark:border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-2 flex items-center gap-1">
              ⚠️ ফিল্টার প্রিয়োরিটি:
            </span>
            <select
              value={activePriority}
              onChange={(e) => setActivePriority(e.target.value as any)}
              className="text-xs font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
            >
              <option value="all">🌈 সব প্রিয়োরিটি (All)</option>
              <option value="high">🚨 উচ্চ / জরুরি (High)</option>
              <option value="medium">⚡ মধ্যম / গুরুত্বপূর্ণ (Medium)</option>
              <option value="low">🌱 সাধারণ / ধীরেসুস্থে (Low)</option>
            </select>
          </div>
        </div>

        {/* Sort System Row */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> সাজানোর ধরন (Sorting System):
            </span>
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex gap-0.5 border border-slate-200/40 dark:border-slate-700/40">
              <button
                type="button"
                onClick={() => setSortBy("smart")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  sortBy === "smart"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold"
                }`}
              >
                🧠 স্মার্ট সাজানো (Default)
              </button>
              <button
                type="button"
                onClick={() => setSortBy("manual")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                  sortBy === "manual"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold"
                }`}
              >
                🤝 টেনে সাজানো (Drag & Drop)
              </button>
            </div>
          </div>
          {sortBy === "manual" ? (
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-bold border border-emerald-100/40 dark:border-emerald-900/30">
              ✨ কাজগুলো টেনে নিজের পছন্দ মতো সাজাতে পারবেন।
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
              *যেকোনো কাজ মাউস দিয়ে টেনেই সরাসরি ড্র্যাগ অ্যান্ড ড্রপ ফিচার সক্রিয় করতে পারেন।
            </span>
          )}
        </div>
      </div>

      {/* Task List container */}
      <div className="space-y-3">
        {/* Voice Memos list organizer for Work & Market items */}
        {activeDateFilter === "voicememos" && (
          <VoiceMemosHub
            tasks={tasks}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onUpdateTask={onUpdateTask}
            onAddTask={onAddTask}
            lang={lang === "bn" ? "bn" : "en"}
          />
        )}

        {sortedTasks.length > 0 && (
          <div className="text-right pr-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
              💡 যেকোনো কাজের ওপর ডাবল-ক্লিক করে সরাসরি পরিবর্তন করতে পারেন
            </span>
          </div>
        )}
        {sortedTasks.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">কোনো কাজ খুঁজে পাওয়া যায়নি!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">নতুন কাজের তালিকা যোগ করুন অথবা অন্য ফিল্টারে চেষ্টা করুন।</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedTasks.map((task) => {
              const isEditing = editingId === task.id;
              const mergedColors = { ...defaultCategoryColors, ...categoryColors };
              const selectedStyleName = mergedColors[task.category] || "purple";
              const catStyle = colorThemes[selectedStyleName] || colorThemes.purple;

            // Highlight tag styling based on due dates
            const isToday = task.dueDate === todayStr;
            const isOverdue = task.dueDate < todayStr;
            
            // Comprehensive overdue & incomplete check (including due time)
            const isOverdueAndIncomplete = (() => {
              if (task.completed) return false;
              if (task.dueDate < todayStr) return true;
              if (task.dueDate === todayStr && task.dueTime) {
                const now = new Date();
                const [dueHours, dueMinutes] = task.dueTime.split(":").map(Number);
                const nowHours = now.getHours();
                const nowMinutes = now.getMinutes();
                if (nowHours > dueHours || (nowHours === dueHours && nowMinutes > dueMinutes)) {
                  return true;
                }
              }
              return false;
            })();
            
            // Priority Tag Styled Mapping
            const priorityBadge: Record<string, { bg: string, text: string, border: string, label: string }> = {
              high: { bg: "bg-rose-50 dark:bg-rose-950/20", text: "text-rose-700 dark:text-rose-400", border: "border-rose-100 dark:border-rose-900/40", label: "জরুরি" },
              medium: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/40", label: "মধ্যম" },
              low: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/40", label: "সাধারণ" },
            };
            const activeBadge = priorityBadge[task.priority] || priorityBadge.medium;

            return (
              <motion.div
                key={task.id}
                id={`task-item-${task.id}`}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={
                  isOverdueAndIncomplete && !isEditing
                    ? {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        x: [0, -1.8, 1.8, -1.8, 1.8, -1.2, 1.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        boxShadow: [
                          "0 0 10px rgba(239, 68, 68, 0.15)",
                          "0 0 22px rgba(239, 68, 68, 0.42)",
                          "0 0 10px rgba(239, 68, 68, 0.15)"
                        ],
                        borderColor: [
                          "rgba(244, 63, 94, 0.35)",
                          "rgba(244, 63, 94, 0.8)",
                          "rgba(244, 63, 94, 0.35)"
                        ]
                      }
                    : { opacity: 1, y: 0, scale: 1, x: 0 }
                }
                exit={{ opacity: 0, x: -30, scale: 0.95, transition: { duration: 0.22 } }}
                transition={{
                  ...(isOverdueAndIncomplete && !isEditing
                    ? {
                        x: {
                          repeat: Infinity,
                          repeatType: "loop",
                          duration: 4.5 + (task.id.charCodeAt(0) % 3) * 0.5,
                          delay: (task.id.charCodeAt(1) % 5) * 0.4,
                          ease: "easeInOut"
                        },
                        boxShadow: {
                          repeat: Infinity,
                          repeatType: "mirror",
                          duration: 1.8 + (task.id.charCodeAt(2) % 4) * 0.15,
                          ease: "easeInOut"
                        },
                        borderColor: {
                          repeat: Infinity,
                          repeatType: "mirror",
                          duration: 1.8 + (task.id.charCodeAt(2) % 4) * 0.15,
                          ease: "easeInOut"
                        },
                        opacity: { type: "spring", stiffness: 450, damping: 32 },
                        y: { type: "spring", stiffness: 450, damping: 32 },
                        scale: { type: "spring", stiffness: 450, damping: 32 }
                      }
                    : { type: "spring", stiffness: 450, damping: 32 })
                }}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDragEnter={(e) => handleDragEnter(e, task.id)}
                onDragLeave={() => setDragOverTaskId(null)}
                onDrop={(e) => handleDrop(e, task.id)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => {
                  if (!isEditing) {
                    startEditing(task);
                  }
                }}
                title={!isEditing ? "কাজটি সম্পাদনা করতে এখানে ডাবল-ক্লিক করুন" : undefined}
                className={`group rounded-2xl p-4 md:p-5 border border-l-4 dark:border-slate-800/80 shadow-sm transition-all duration-300 hover:shadow-md select-none ${
                  cardColorStyle === "bg"
                    ? `${catStyle.bgLight} ${catStyle.bgDark} ${catStyle.border} ${catStyle.borderDark}`
                    : `bg-white dark:bg-slate-900 ${catStyle.border} ${catStyle.borderDark}`
                } ${
                  task.id === draggedTaskId
                    ? "opacity-40 border-dashed border-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-950/5"
                    : task.id === dragOverTaskId
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.015] bg-emerald-50/10 dark:bg-emerald-950/10 shadow-lg"
                      : task.completed 
                        ? "border-emerald-100/80 dark:border-emerald-900/45 bg-emerald-50/5/30 dark:bg-emerald-950/5 opacity-70" 
                        : isOverdueAndIncomplete
                          ? "border-rose-400 dark:border-rose-800/90 bg-rose-50/5 dark:bg-rose-955/5 shadow-[0_0_15px_rgba(239,68,68,0.22)] dark:shadow-[0_0_18px_rgba(239,68,68,0.18)] hover:shadow-[0_0_20px_rgba(239,68,68,0.32)]"
                          : isOverdue 
                            ? "border-rose-100 dark:border-rose-950/45 bg-rose-50/5 dark:bg-rose-955/5"
                            : "border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                {isEditing ? (
                  /* Edit State Layout */
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">কাজ সম্পাদনা করুন</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-705 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> সংরক্ষণ
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> বাতিল
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">কাজটির নাম</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">ক্যাটাগরি</label>
                        <select
                          value={isEditCustomCategory ? "CUSTOM" : editCategory}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "CUSTOM") {
                              setIsEditCustomCategory(true);
                              setEditCategory(editCustomCategoryText.trim() || "");
                            } else {
                              setIsEditCustomCategory(false);
                              setEditCategory(val);
                            }
                          }}
                          className="w-full text-xs px-3 py-1.5 mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="ব্যক্তিগত" className="dark:bg-slate-800">🏠 ব্যক্তিগত</option>
                          <option value="কাজ" className="dark:bg-slate-800">💼 কাজ</option>
                          <option value="পড়াশোনা" className="dark:bg-slate-800">📚 পড়াশোনা</option>
                          <option value="স্বাস্থ্য" className="dark:bg-slate-800">❤️ স্বাস্থ্য</option>
                          <option value="অন্যান্য" className="dark:bg-slate-800">✨ অন্যান্য</option>
                          {customCats.map((catName) => (
                            <option key={catName} value={catName} className="dark:bg-slate-800">
                              🏷️ {catName}
                            </option>
                          ))}
                          <option value="CUSTOM" className="dark:bg-slate-800">➕ কাস্টম ক্যাটাগরি...</option>
                        </select>
                        {isEditCustomCategory && (
                          <input
                            type="text"
                            value={editCustomCategoryText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditCustomCategoryText(val);
                              setEditCategory(val.trim() || "");
                            }}
                            placeholder="কাস্টম ক্যাটাগরি লিখুন..."
                            required
                            className="w-full text-xs px-3 py-1.5 mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">অগ্রাধিকার</label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as Task["priority"])}
                          className="w-full text-xs px-3 py-1.5 mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="low" className="dark:bg-slate-800">সাধারণ (Low)</option>
                          <option value="medium" className="dark:bg-slate-800">মধ্যম (Medium)</option>
                          <option value="high" className="dark:bg-slate-800">জরুরি (High)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">তারিখ</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">সময়</label>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <label className="flex items-center gap-2 count-pointer text-xs text-slate-600 dark:text-slate-300 w-full cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editReminder}
                          onChange={(e) => setEditReminder(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                        />
                        রিমাইন্ডার এলার্ট সক্রিয় করুন
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase">সংক্ষিপ্ত বিবরণ</label>
                        <textarea
                          rows={1}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase">বিস্তারিত নোটস (Markdown)</label>
                          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex gap-0.5 border border-slate-200/40 dark:border-slate-700/40 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditNotesTab("write")}
                              className={`px-1.5 py-0.2 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                                editNotesTab === "write"
                                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              লিখুন
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditNotesTab("preview")}
                              className={`px-1.5 py-0.2 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                                editNotesTab === "preview"
                                  ? "bg-white dark:bg-slate-705 text-slate-800 dark:text-white shadow-sm"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              প্রাকদর্শন
                            </button>
                          </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-850/45">
                          {editNotesTab === "write" ? (
                            <div>
                              {/* Simple Edit Toolbar */}
                              <div className="bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 border-b border-slate-200 dark:border-slate-705 flex flex-wrap gap-0.5 items-center">
                                <button
                                  type="button"
                                  onClick={() => insertEditFormat("**", "**")}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                                  title="বোল্ড"
                                >
                                  <Bold className="w-2.5 h-2.5 stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertEditFormat("*", "*")}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                                  title="ইটালিক"
                                >
                                  <Italic className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertEditFormat("### ", "\n")}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 text-[8px] font-black cursor-pointer"
                                  title="হেডার"
                                >
                                  H3
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertEditFormat("- ", "\n")}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                                  title="বুলেট লিস্ট"
                                >
                                  <List className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertEditFormat("`", "`")}
                                  className="p-1 hover:bg-slate-205 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                                  title="কোড"
                                >
                                  <Code className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              <textarea
                                ref={editNotesRef}
                                rows={3}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="দীর্ঘ কাজের বিস্তারিত চেকলিস্ট, স্টেপস বা নোট লিখুন..."
                                className="w-full text-xs p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y min-h-[70px]"
                              />
                            </div>
                          ) : (
                            <div 
                              className="p-3 bg-white dark:bg-slate-800 min-h-[96px] overflow-auto max-h-[160px] prose dark:prose-invert text-[11px] text-slate-755 dark:text-slate-200 select-text"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(editNotes) || `<p class="italic text-slate-400 dark:text-slate-505 text-[11px]">কোনো নোট নেই...</p>` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Display Layout */
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox and task title content */}
                    <div className="flex items-start gap-1 flex-1 min-w-0">
                      {/* Drag handle icon */}
                      <div className="flex items-center self-stretch pr-1.5 text-slate-300 dark:text-slate-650 group-hover:text-slate-450 dark:group-hover:text-slate-500 cursor-grab active:cursor-grabbing transition-all">
                        <GripVertical className="w-4.5 h-4.5 shrink-0" />
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleComplete(task.id)}
                        className={`flex-shrink-0 w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                          task.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : isOverdue
                              ? "border-rose-400 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:bg-slate-800 bg-white dark:bg-slate-800/80"
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           {/* Category Tag Badge */}
                          <span className="text-[11px] bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2.5 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 font-medium">
                            {categoryIcons[task.category] || "✨"} {task.category}
                          </span>

                           {/* Priority Badge */}
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${activeBadge.bg} ${activeBadge.text} ${activeBadge.border} font-semibold`}>
                            ⚠️ {activeBadge.label}
                          </span>

                           {/* Due Date Indicator */}
                          {isToday && !task.completed && (
                            <span className="text-[10px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 px-2 py-0.5 rounded-lg font-bold animate-pulse">
                              আজকের দিনেই
                            </span>
                          )}
                          {isOverdue && !task.completed && (
                            <span className="text-[10px] bg-rose-600/15 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-900/30 px-2 py-0.5 rounded-lg font-bold">
                              সময় অতিবাহিত
                            </span>
                          )}
                        </div>

                        {/* Title text */}
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${catStyle.iconBgLight} ${catStyle.iconTextLight} ${catStyle.iconBgDark} ${catStyle.iconTextDark} border border-slate-200/50 dark:border-slate-800`} title={`${task.category} ক্যাটাগরি`}>
                            <GetCategoryLucideIcon category={task.category} className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <h4 className={`text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm md:text-base flex-1 pt-0.5 ${
                            task.completed ? "line-through text-slate-400/70 dark:text-slate-500 font-normal" : ""
                          }`}>
                            {task.title}
                          </h4>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className={`text-xs mt-1 text-slate-500 dark:text-slate-400 pr-5 ${
                            task.completed ? "line-through text-slate-450/60 dark:text-slate-550" : ""
                          }`}>
                            {task.description}
                          </p>
                        )}

                        {/* Voice Note Section */}
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          {task.voiceNote ? (
                            /* Voice Playback interface with scrubber progress track */
                            <div className="flex flex-col gap-2 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 px-3 py-2.5 rounded-xl">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => playVoiceNote(task.id, task.voiceNote!, e)}
                                    className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer shrink-0"
                                    title="ভয়েস মেমো শুনুন"
                                  >
                                    {playingTaskId === task.id ? (
                                      <Pause className="w-4 h-4 animate-pulse fill-white" />
                                    ) : (
                                      <Play className="w-4 h-4 translate-x-0.5 fill-white" />
                                    )}
                                  </button>
                                  <div className="text-left leading-tight">
                                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 select-none flex items-center gap-1 leading-none">
                                      <Mic className="w-3 h-3 text-emerald-500" />
                                      {lang === "bn" ? "ভয়েস মেমো" : "Voice Memo"}
                                    </p>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono select-none">
                                      {playingTaskId === task.id ? (
                                        `${formatSecs(audioCurrentTime)} / ${formatSecs(audioDuration || task.voiceNoteDuration || 0)}`
                                      ) : (
                                        `${lang === "bn" ? "সময়কাল" : "Duration"}: ${formatSecs(task.voiceNoteDuration || 0)}`
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {/* Visual static animation or subtle playing waves */}
                                  {playingTaskId === task.id && (
                                    <div className="flex items-end gap-0.5 h-4 pr-1 select-none">
                                      {[...Array(10)].map((_, i) => (
                                        <span 
                                          key={i} 
                                          className="w-[3px] bg-emerald-500 rounded-full animate-audio-wave" 
                                          style={{ 
                                            height: `${30 + Math.random() * 70}%`,
                                            animationDuration: `${0.6 + (i % 4) * 0.15}s`,
                                            animationDelay: `${i * 0.08}s`
                                          }} 
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateTask(task.id, { voiceNote: undefined, voiceNoteDuration: undefined });
                                      if (playingTaskId === task.id) {
                                        if (listAudioRef.current) {
                                          listAudioRef.current.pause();
                                        }
                                        setPlayingTaskId(null);
                                      }
                                    }}
                                    title={lang === "bn" ? "অডিও ফাইল মুছে লোকাল স্টোরেজ খালি করুন" : "Delete audio to free up local storage space"}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-rose-100/50 dark:border-rose-900/30"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                    <span>{lang === "bn" ? "অডিও মুছুন" : "Clear Audio"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Interactive range input slider for seeking/scrubbing */}
                              <div className="flex items-center gap-2 mt-1 px-0.5">
                                <input
                                  type="range"
                                  min="0"
                                  max={playingTaskId === task.id ? (audioDuration || task.voiceNoteDuration || 1) : 1}
                                  value={playingTaskId === task.id ? audioCurrentTime : 0}
                                  onChange={(e) => {
                                    if (playingTaskId === task.id) {
                                      seekVoiceNote(parseFloat(e.target.value), e);
                                    }
                                  }}
                                  disabled={playingTaskId !== task.id}
                                  className={`w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 focus:outline-none transition-all ${
                                    playingTaskId !== task.id ? "opacity-40 cursor-not-allowed" : ""
                                  }`}
                                />
                              </div>
                            </div>
                          ) : recordingTaskId === task.id ? (
                            /* Voice recording in-card interface */
                            <div className="flex flex-col gap-2 p-3 bg-rose-50/30 dark:bg-rose-955/5 border border-rose-100/60 dark:border-rose-900/40 rounded-xl">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-450 animate-pulse flex items-center gap-1.5 leading-none">
                                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                  </span>
                                  ভয়েস রেকর্ড করা হচ্ছে... 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 1:00
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={stopCardRecording}
                                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <Square className="w-3 h-3 fill-current" />
                                  <span>রেকর্ডিং থামান ও সেভ করুন</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelCardRecording}
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  বাতিল
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Trigger button to attach/record a voice memo in-card */
                            <button
                              type="button"
                              onClick={(e) => startCardRecording(task.id, e)}
                              className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-bold cursor-pointer"
                            >
                              <Mic className="w-3 h-3" />
                              <span>ভয়েস মেমো সংযুক্ত করুন</span>
                            </button>
                          )}
                        </div>

                        {/* Collapsible Rich Notes Visualizer */}
                        {task.notes && (
                          <div className="mt-2 text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNotesExpand(task.id);
                              }}
                              className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-teal-650 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-all cursor-pointer bg-teal-50/80 dark:bg-teal-950/20 px-2.5 py-1 rounded-lg border border-teal-150 dark:border-teal-900/30 shadow-xs"
                            >
                              <FileText className="w-3 h-3 text-teal-500" />
                              <span>{expandedNotesIds[task.id] ? " বিস্তারিত নোট লুকান" : " বিস্তারিত নোট দেখুন"}</span>
                            </button>
                            
                            {expandedNotesIds[task.id] && (
                              <div 
                                onClick={(e) => e.stopPropagation()} /* Prevent triggering parent double clicks */
                                className="mt-2 p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800/80 max-h-[240px] overflow-auto select-text prose dark:prose-invert text-xs text-slate-700 dark:text-slate-200 animate-fadeIn font-normal leading-relaxed shadow-inner"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(task.notes) }}
                              />
                            )}
                          </div>
                        )}

                        {/* Stopwatch Tracker Section */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-805/45 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/40 dark:bg-slate-950/20 px-3 py-2.5 rounded-xl border border-slate-150/45 dark:border-slate-800/50">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${task.timerRunning ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}>
                              <Timer className={`w-3.5 h-3.5 ${task.timerRunning ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5 select-none">spent time tracking (স্টপওয়াচ)</p>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-mono text-xs font-black tracking-tight leading-none ${task.timerRunning ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                                  {formatStopwatchTime(getElapsedSeconds(task))}
                                </span>
                                {task.timerRunning && (
                                  <span className="relative flex h-1.5 w-1.5 rounded-full bg-emerald-500">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            {task.timerRunning ? (
                              <button
                                type="button"
                                onClick={(e) => stopTimer(task.id, e)}
                                title="হিসাব থামান (Pause)"
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 hover:shadow-xs hover:border-amber-650 transition-all cursor-pointer border border-transparent"
                              >
                                <Pause className="w-3 h-3" />
                                <span>থামুন</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => startTimer(task.id, e)}
                                title="সময় হিসাব শুরু করুন (Start/Resume)"
                                className={`px-2.5 py-1 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 hover:shadow-xs transition-all cursor-pointer border border-transparent ${
                                  getElapsedSeconds(task) > 0 
                                    ? "bg-violet-600 hover:bg-violet-700 active:bg-violet-800" 
                                    : "bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-850"
                                }`}
                              >
                                <Play className="w-3 h-3" />
                                <span>{getElapsedSeconds(task) > 0 ? "পুনরায় চালু" : "শুরু করুন"}</span>
                              </button>
                            )}

                            {getElapsedSeconds(task) > 0 && (
                              <button
                                type="button"
                                onClick={(e) => resetTimer(task.id, e)}
                                title="সময় রিসেট করুন (Reset)"
                                className="p-1 px-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-455 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 text-[11px] font-bold flex items-center gap-0.5"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>রিসেট</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Schedule detail bar */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-2.5 border-t border-slate-50 dark:border-slate-800/60 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            {task.dueDate.split("-").reverse().join("/")} {/* Format as DD/MM/YYYY */}
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            সময়: {task.dueTime ? task.dueTime : "নির্ধারিত নয়"}
                          </span>

                          {task.reminderEnabled ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 font-semibold">
                              <Bell className="w-3.5 h-3.5" /> রিমাইন্ডার অন
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-505">
                              <BellOff className="w-3.5 h-3.5" /> নোটিফিকেশন বন্ধ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick utilities */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.archived && (
                        <button
                          onClick={() => onUpdateTask(task.id, { archived: false })}
                          title="আর্কাইভ থেকে ফিরিয়ে আনুন (Restore)"
                          className="p-1.5 text-slate-400 dark:text-slate-555 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 rounded-lg cursor-pointer transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(task)}
                        title="সম্পাদনা করুন"
                        className="p-1.5 text-slate-400 dark:text-slate-555 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTaskToDelete(task)}
                        title="মুছে ফেলুন"
                        className="p-1.5 text-slate-400 dark:text-slate-555 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg cursor-pointer transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center z-10"
            >
              {/* Alert Icon & Decorative background */}
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4 border border-rose-100/50 dark:border-rose-900/20 relative">
                <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping" />
                <AlertTriangle className="w-6 h-6 relative z-10" />
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-black text-slate-850 dark:text-slate-100 mb-2">
                {taskToDelete.archived ? "আর্কাইভ থেকে স্থায়ীভাবে মুছে ফেলার সতর্কতা ⚠️" : "কাজ মুছে ফেলার সতর্কতা ⚠️"}
              </h3>
              
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl mb-4 text-xs font-bold text-rose-600 dark:text-rose-400 break-words line-clamp-2 select-none border border-rose-100/10 dark:border-rose-900/10">
                "{taskToDelete.title}"
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 px-2">
                {taskToDelete.archived 
                  ? "এই কাজটি আপনার আর্কাইভ থেকে স্থায়ীভাবে মুছে ফেলা হবে। পূর্বে সংরক্ষণ করা সকল ইতিহাস এবং রেকর্ড স্থায়ীভাবে হারিয়ে যাবে ও আর পুনরুদ্ধার করা যাবে না।" 
                  : "আপনি কি নিশ্চিত যে আপনি এই কাজটি স্থায়ীভাবে ড্যাশবোর্ড থেকে মুছে ফেলতে চান?"}
              </p>

              {/* Actions Button Group */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-350 cursor-pointer transition-all border border-transparent"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(taskToDelete.id);
                    setTaskToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-rose-650 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md shadow-rose-500/20 active:shadow-none hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all"
                >
                  হ্যাঁ, মুছে ফেলুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
