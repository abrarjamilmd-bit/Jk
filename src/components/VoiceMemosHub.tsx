import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, Trash2, CheckCircle, Clock, Plus, 
  Mic, MicOff, Square, Briefcase, ShoppingBag, 
  Volume2, Trash, Check, AlertCircle
} from "lucide-react";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface VoiceMemosHubProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTask: (id: string, updatedFields: Partial<Task>) => void;
  onAddTask?: (taskData: Omit<Task, "id" | "completed" | "reminderTriggered" | "createdAt">) => void;
  lang: "bn" | "en";
}

export default function VoiceMemosHub({
  tasks,
  onToggleComplete,
  onDelete,
  onUpdateTask,
  onAddTask,
  lang = "bn"
}: VoiceMemosHubProps) {
  // Filter for Work tasks with Voice Note
  const workVoiceTasks = tasks.filter(t => 
    t.voiceNote && 
    (t.category === "কাজ" || t.category?.toLowerCase() === "work") &&
    !t.archived
  );

  // Filter for Market/Shopping tasks with Voice Note
  const marketVoiceTasks = tasks.filter(t => 
    t.voiceNote && 
    (t.category === "বাজার" || t.category === "বাজারের তালিকা" || t.category?.toLowerCase() === "market" || t.category?.toLowerCase() === "shopping") &&
    !t.archived
  );

  // Audio Playback states
  const [playingTaskId, setPlayingTaskId] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Recording State
  const [recordingCategory, setRecordingCategory] = useState<"work" | "market" | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [taskTitle, setTaskTitle] = useState("");
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear audio ref on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Audio helper: format seconds (e.g. 0:05)
  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Convert English numbers to Bengali numbers
  const toBengaliDigits = (num: number | string) => {
    if (lang !== "bn") return String(num);
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[Number(w)]);
  };

  // Play audio memo
  const handlePlayVoice = (taskId: string, voiceBase64: string) => {
    if (playingTaskId === taskId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingTaskId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      
      const audio = new Audio(voiceBase64);
      audioPlayerRef.current = audio;
      setPlayingTaskId(taskId);

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

      audio.play().catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };

  // Seek current playback time
  const handleSeek = (time: number) => {
    if (audioPlayerRef.current && playingTaskId) {
      audioPlayerRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  // Start voice recording for target category
  const startRecording = async (category: "work" | "market") => {
    setPermissionError(null);
    try {
      // Pause any playing audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingTaskId(null);
      }

      setRecordingCategory(category);
      setRecordingSeconds(0);

      // Access mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          
          // Generate customized Task values
          const finalCategoryName = category === "work" 
            ? (lang === "bn" ? "কাজ" : "Work")
            : (lang === "bn" ? "বাজার" : "Market");

          const finalTitleName = taskTitle.trim() 
            ? taskTitle.trim()
            : (category === "work" 
              ? (lang === "bn" ? "নতুন কাজের টাস্ক (ভয়েস)" : "New Work Task (Voice)") 
              : (lang === "bn" ? "বাজারের তালিকা টাস্ক (ভয়েস)" : "Market List Task (Voice)")
            );

          const defaultDueDate = new Date().toISOString().split("T")[0];

          if (onAddTask) {
            onAddTask({
              title: finalTitleName,
              category: finalCategoryName,
              priority: "medium",
              dueDate: defaultDueDate,
              dueTime: "12:00",
              description: lang === "bn" ? "ভয়েস রেকর্ডিং এর মাধ্যমে তৈরি করা কাজ।" : "Task created via voice recording.",
              reminderEnabled: false,
              voiceNote: base64data,
              voiceNoteDuration: recordingSeconds || 1
            });
          }

          setRecordingCategory(null);
          setTaskTitle("");
        };
      };

      mediaRecorder.start();

      // Start ticker timer (max 60 seconds)
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Mic error:", err);
      setPermissionError(
        lang === "bn" 
          ? "মাইক্রোফোন অ্যাক্সেস করতে পাওয়া যায়নি! অনুগ্রহ করে পারমিশন দিন।" 
          : "Microphone permission denied or not found!"
      );
      setRecordingCategory(null);
    }
  };

  // Stop active recording
  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Cancel recording without saving
  const cancelRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setRecordingCategory(null);
    setTaskTitle("");
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent rounded-3xl p-5 md:p-6 border border-emerald-100/70 dark:border-emerald-900/30 shadow-lg space-y-6">
      {/* Wave header decor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100/50 dark:border-emerald-950/20">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-xl">
              <Mic className="w-4 h-4 md:w-5 md:h-5" />
            </span>
            {lang === "bn" ? "ভয়েস মেমো ড্যাশবোর্ড" : "Voice Memos Hub"}
          </h2>
          <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === "bn" 
              ? "আপনার কাজের তালিকা এবং নিত্যদিনের প্রয়োজনীয় বাজারের তালিকা ভয়েস রেকর্ডিং এর মাধ্যমে সহজে পরিচালনা করুন।" 
              : "Manage and filter your daily job / works and grocery checklist with real-time base64 voice notes."}
          </p>
        </div>
        
        {/* Total counts badge combo */}
        <div className="flex gap-2 shrink-0">
          <div className="bg-amber-50/60 dark:bg-amber-955/10 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-100/40 text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === "bn" ? `কাজ: ${toBengaliDigits(workVoiceTasks.length)}` : `Works: ${workVoiceTasks.length}`}</span>
          </div>
          <div className="bg-sky-50/60 dark:bg-sky-955/10 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-sky-100/40 text-sky-700 dark:text-sky-400 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
            <span>{lang === "bn" ? `বাজার: ${toBengaliDigits(marketVoiceTasks.length)}` : `Market: ${marketVoiceTasks.length}`}</span>
          </div>
        </div>
      </div>

      {permissionError && (
        <div className="bg-rose-50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{permissionError}</span>
          <button 
            onClick={() => setPermissionError(null)} 
            className="ml-auto text-rose-550 dark:text-rose-400 hover:opacity-80 transition-opacity font-bold cursor-pointer"
          >
            {lang === "bn" ? "ঠিক আছে" : "Dismiss"}
          </button>
        </div>
      )}

      {/* Grid Container for Works and Market list side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= COLUMN 1: WORK LIST MEMOS ================= */}
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-100/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-slate-100 dark:border-slate-800 select-none">
              <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                {lang === "bn" ? "কাজের তালিকা সংক্রান্ত মেমো" : "Work / Job Voice Memos"}
              </span>
              <span className="bg-amber-100 dark:bg-amber-955/40 text-amber-800 dark:text-amber-250 font-mono text-[10px] font-black px-2 py-0.5 rounded-full">
                {toBengaliDigits(workVoiceTasks.length)}
              </span>
            </div>

            {/* List entries */}
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {workVoiceTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
                    <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-700/80 mb-2" />
                    <p className="text-xs font-bold">{lang === "bn" ? "কোনো কাজের মেমো রেকর্ড নেই" : "No Work Voice Memos linked"}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{lang === "bn" ? "নিচের রেকর্ডার দিয়ে ঝটপট কাজ তৈরি করুন" : "Quickly record custom jobs below"}</p>
                  </div>
                ) : (
                  workVoiceTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-3 rounded-xl border border-slate-150/40 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all ${
                        task.completed ? "opacity-60" : ""
                      }`}
                    >
                      {/* Task info line */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-xs font-bold text-slate-750 dark:text-slate-200 truncate ${task.completed ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                            {task.title}
                          </p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.dueDate} {task.dueTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onToggleComplete(task.id)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              task.completed 
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600"
                            }`}
                            title={task.completed ? "চিহ্নিত কাজ বাতিল করুন" : "চিহ্নিত করুন"}
                          >
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </button>
                          <button
                            onClick={() => onUpdateTask(task.id, { voiceNote: undefined, voiceNoteDuration: undefined })}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title={lang === "bn" ? "ভয়েস ফাইল ডিলেট করুন" : "Remove recording file"}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Playing audio UI panel */}
                      <div className="mt-2.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-lg p-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              onClick={() => handlePlayVoice(task.id, task.voiceNote!)}
                              className="w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                            >
                              {playingTaskId === task.id ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 translate-x-0.5 fill-white" />}
                            </button>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-bold select-none leading-none">
                              {playingTaskId === task.id ? `${formatSecs(audioCurrentTime)} / ${formatSecs(audioDuration || task.voiceNoteDuration || 0)}` : `${lang === "bn" ? "সময়কাল" : "Duration"}: ${formatSecs(task.voiceNoteDuration || 0)}`}
                            </span>
                          </div>

                          {/* Mini visual wave */}
                          {playingTaskId === task.id && (
                            <div className="flex items-end gap-[1.5px] h-3 select-none pr-1">
                              {[...Array(6)].map((_, idx) => (
                                <span 
                                  key={idx} 
                                  className="w-[2px] bg-amber-500 rounded-full animate-audio-wave" 
                                  style={{ 
                                    height: `${25 + Math.random() * 75}%`,
                                    animationDuration: `${0.5 + (idx % 3) * 0.15}s`,
                                    animationDelay: `${idx * 0.08}s`
                                  }} 
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timeline Scrubber */}
                        <input
                          type="range"
                          min="0"
                          max={playingTaskId === task.id ? (audioDuration || task.voiceNoteDuration || 1) : 1}
                          value={playingTaskId === task.id ? audioCurrentTime : 0}
                          onChange={(e) => handleSeek(parseFloat(e.target.value))}
                          disabled={playingTaskId !== task.id}
                          className={`w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-600 focus:outline-none transition-all ${
                            playingTaskId !== task.id ? "opacity-30 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Record Form */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-850">
            {recordingCategory === "work" ? (
              <div className="bg-amber-50/40 dark:bg-amber-955/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-black text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1.5 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    {lang === "bn" ? "ভয়েস রেকর্ড হচ্ছে..." : "Voice recording is live..."}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    {formatSecs(recordingSeconds)}
                  </span>
                </div>
                
                <input
                  type="text"
                  placeholder={lang === "bn" ? "কাজের নাম (অপশনাল)" : "Work Task Title (Optional)"}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800 bg-white/90 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-all"
                />

                <div className="flex gap-2">
                  <button
                    onClick={stopRecording}
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    {lang === "bn" ? "রেকর্ডিং ও কাজ যোগ করুন" : "Save voice note"}
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-650 dark:text-slate-300 rounded-lg text-xs font-extrabold cursor-pointer transition-all"
                  >
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startRecording("work")}
                disabled={recordingCategory !== null}
                className="w-full py-2.5 border border-dashed border-amber-300 hover:border-amber-500 dark:border-amber-800/80 dark:hover:border-amber-650 bg-amber-50/20 hover:bg-amber-50/50 dark:bg-amber-955/5 dark:hover:bg-amber-955/10 rounded-xl text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 group disabled:opacity-40"
              >
                <Mic className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                {lang === "bn" ? "🎙️ নতুন কাজের মেমো রেকর্ড করুন" : "Record new Work voice task"}
              </button>
            )}
          </div>
        </div>

        {/* ================= COLUMN 2: MARKET LIST MEMOS ================= */}
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-100/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-slate-100 dark:border-slate-800 select-none">
              <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-500" />
                {lang === "bn" ? "বাজারের তালিকা সংক্রান্ত মেমো" : "Market / Shopping Memos"}
              </span>
              <span className="bg-sky-100 dark:bg-sky-955/40 text-sky-800 dark:text-sky-250 font-mono text-[10px] font-black px-2 py-0.5 rounded-full">
                {toBengaliDigits(marketVoiceTasks.length)}
              </span>
            </div>

            {/* List entries */}
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {marketVoiceTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-700/80 mb-2" />
                    <p className="text-xs font-bold">{lang === "bn" ? "কোনো বাজারের মেমো রেকর্ড নেই" : "No Market Voice Memos linked"}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{lang === "bn" ? "নিচের রেকর্ডার দিয়ে কুইক বাজার মেমো বানান" : "Quickly record custom grocery memos below"}</p>
                  </div>
                ) : (
                  marketVoiceTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-3 rounded-xl border border-slate-150/40 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all ${
                        task.completed ? "opacity-60" : ""
                      }`}
                    >
                      {/* Task info line */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-xs font-bold text-slate-750 dark:text-slate-200 truncate ${task.completed ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                            {task.title}
                          </p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.dueDate} {task.dueTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onToggleComplete(task.id)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              task.completed 
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600"
                            }`}
                            title={task.completed ? "চিহ্নিত বাজার তালিকা বাতিল করুন" : "চিহ্নিত করুন"}
                          >
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </button>
                          <button
                            onClick={() => onUpdateTask(task.id, { voiceNote: undefined, voiceNoteDuration: undefined })}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/35 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title={lang === "bn" ? "ভয়েস ফাইল ডিলেট করুন" : "Remove recording file"}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Playing audio UI panel */}
                      <div className="mt-2.5 bg-sky-505/5 dark:bg-sky-500/10 border border-sky-500/10 rounded-lg p-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              onClick={() => handlePlayVoice(task.id, task.voiceNote!)}
                              className="w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                            >
                              {playingTaskId === task.id ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 translate-x-0.5 fill-white" />}
                            </button>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-bold select-none leading-none">
                              {playingTaskId === task.id ? `${formatSecs(audioCurrentTime)} / ${formatSecs(audioDuration || task.voiceNoteDuration || 0)}` : `${lang === "bn" ? "সময়কাল" : "Duration"}: ${formatSecs(task.voiceNoteDuration || 0)}`}
                            </span>
                          </div>

                          {/* Mini visual wave */}
                          {playingTaskId === task.id && (
                            <div className="flex items-end gap-[1.5px] h-3 select-none pr-1">
                              {[...Array(6)].map((_, idx) => (
                                <span 
                                  key={idx} 
                                  className="w-[2px] bg-sky-500 rounded-full animate-audio-wave" 
                                  style={{ 
                                    height: `${25 + Math.random() * 75}%`,
                                    animationDuration: `${0.5 + (idx % 3) * 0.15}s`,
                                    animationDelay: `${idx * 0.08}s`
                                  }} 
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timeline Scrubber */}
                        <input
                          type="range"
                          min="0"
                          max={playingTaskId === task.id ? (audioDuration || task.voiceNoteDuration || 1) : 1}
                          value={playingTaskId === task.id ? audioCurrentTime : 0}
                          onChange={(e) => handleSeek(parseFloat(e.target.value))}
                          disabled={playingTaskId !== task.id}
                          className={`w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-600 focus:outline-none transition-all ${
                            playingTaskId !== task.id ? "opacity-30 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Record Form */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-850">
            {recordingCategory === "market" ? (
              <div className="bg-sky-50/40 dark:bg-sky-955/10 border border-sky-200/50 dark:border-sky-900/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-black text-sky-600 dark:text-sky-450 animate-pulse flex items-center gap-1.5 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    {lang === "bn" ? "ভয়েস রেকর্ড হচ্ছে..." : "Voice recording is live..."}
                  </span>
                  <span className="text-xs font-mono font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                    {formatSecs(recordingSeconds)}
                  </span>
                </div>
                
                <input
                  type="text"
                  placeholder={lang === "bn" ? "বাজারের আইটেম / টাস্কের নাম" : "Grocery Item / Market Title"}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-lg border border-sky-200/60 dark:border-sky-800 bg-white/90 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-505 transition-all"
                />

                <div className="flex gap-2">
                  <button
                    onClick={stopRecording}
                    className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    {lang === "bn" ? "রেকর্ডিং ও বাজার তালিকা যোগ করুন" : "Save voice note"}
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-650 dark:text-slate-300 rounded-lg text-xs font-extrabold cursor-pointer transition-all"
                  >
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startRecording("market")}
                disabled={recordingCategory !== null}
                className="w-full py-2.5 border border-dashed border-sky-300 hover:border-sky-500 dark:border-sky-800/80 dark:hover:border-sky-650 bg-sky-50/20 hover:bg-sky-50/50 dark:bg-sky-955/5 dark:hover:bg-sky-955/10 rounded-xl text-xs font-extrabold text-sky-700 dark:text-sky-400 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 group disabled:opacity-40"
              >
                <Mic className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                {lang === "bn" ? "🎙️ নতুন বাজারের মেমো রেকর্ড করুন" : "Record new Market voice task"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
