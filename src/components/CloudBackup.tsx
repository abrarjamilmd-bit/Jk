import React, { useState, useEffect } from "react";
import { 
  Cloud, CloudLightning, RefreshCw, Trash2, 
  Database, Calendar, FileJson, Check, AlertCircle, Sparkles
} from "lucide-react";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CloudBackupProps {
  tasks: Task[];
  onRestore: (tasks: Task[]) => void;
}

interface BackupItem {
  id: string;
  filename: string;
  label: string;
  timestamp: string;
  tasksCount: number;
  size: number;
}

export default function CloudBackup({ tasks, onRestore }: CloudBackupProps) {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  // Convert English numbers to Bengali digits
  const toBengaliDigits = (num: number | string) => {
    const bdigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (w) => bdigits[Number(w)]);
  };

  const getReadableSize = (bytes: number) => {
    if (bytes < 1024) return `${toBengaliDigits(bytes)} B`;
    return `${toBengaliDigits((bytes / 1024).toFixed(1))} KB`;
  };

  const getBengaliDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return toBengaliDigits(isoString);
    }
  };

  const fetchBackups = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/backup/list");
      const data = await res.json();
      if (data.status === "success") {
        setBackups(data.backups);
      } else {
        setErrorMsg(data.error || "ব্যাকআপ তালিকা লোড করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleSaveBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const backupLabel = customLabel.trim() || `ব্যাকআপ (${new Date().toLocaleDateString("bn-BD")})`;

    try {
      const res = await fetch("/api/backup/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, label: backupLabel })
      });
      const data = await res.json();
      if (data.status === "success") {
        setSuccessMsg("ক্লাউড ব্যাকআপ সফলভাবে সংরক্ষণ করা হয়েছে! 🎉");
        setCustomLabel("");
        fetchBackups();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || "ব্যাকআপ সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না।");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.status === "success") {
        onRestore(data.tasks);
        setSuccessMsg(`"${data.label}" ব্যাকআপটি সফলভাবে রিস্টোর করা হয়েছে!`);
        setConfirmRestore(null);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(data.error || "ব্যাকআপ রিস্টোর করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না।");
    }
  };

  const handleDeleteBackup = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/backup/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.status === "success") {
        setBackups(prev => prev.filter(b => b.filename !== filename));
        setSuccessMsg("ব্যাকআপ ফাইলটি স্থায়ীভাবে মুছে ফেলা হয়েছে।");
        if (confirmRestore === filename) {
          setConfirmRestore(null);
        }
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error || "ব্যাকআপ মুছতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না।");
    }
  };

  return (
    <div id="cloud-backup-widget" className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md space-y-4">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 p-1.5 rounded-xl">
            <Cloud className="w-5 h-5 animate-bounce" style={{ animationDuration: "5s" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">☁️ ক্লাউড ব্যাকআপ ও রিস্টোর (Cloud Backup)</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">আপনার আজকের কাজগুলো সুরক্ষিত রাখতে সার্ভারে ব্যাকআপ নিয়ে রাখুন</p>
          </div>
        </div>
        <button
          onClick={fetchBackups}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
          title="রিফ্রেশ করুন"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Alert Banner System */}
      <AnimatePresence mode="popLayout">
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/40 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2"
          >
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backup Creation Form */}
      <form onSubmit={handleSaveBackup} className="space-y-2">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450">ব্যাকআপের নাম (ঐচ্ছিক):</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="যেমন: ছুটির দিনের কাজ বা মূল তালিকা..."
            disabled={saving}
            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={saving || tasks.length === 0}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <CloudLightning className="w-3.5 h-3.5" />
                <span>ব্যাকআপ নিন</span>
              </>
            )}
          </button>
        </div>
        {tasks.length === 0 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold italic">
            ⚠️ ব্যাকআপ তৈরি করতে টাস্ক লিস্টে অন্তত একটি কাজ থাকতে হবে।
          </p>
        )}
      </form>

      {/* List of cloud backups */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            পূর্ববর্তী ব্যাকআপসমূহ ({toBengaliDigits(backups.length)}টি)
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-sky-500 animate-spin" />
            <span className="text-xs text-slate-400">মেঘ থেকে ব্যাকআপ তালিকা আনা হচ্ছে...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
            <span className="text-2xl mb-1">☁️</span>
            <h4 className="text-xs font-bold text-slate-650 dark:text-slate-400">কোনো ব্যাকআপ পাওয়া যায়নি</h4>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[220px]">
              এখনো কোনো ব্যাকআপ নেয়া হয়নি। উপরের ফর্ম ব্যবহার করে একটি ব্যাকআপ নিন।
            </p>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {backups.map((bk) => {
              const isConfirming = confirmRestore === bk.filename;

              return (
                <div 
                  key={bk.id}
                  className={`p-3 rounded-xl border transition-all relative overflow-hidden group ${
                    isConfirming 
                      ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:border-sky-100 dark:hover:border-sky-950/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-755 dark:text-slate-200 truncate pr-2">
                          {bk.label}
                        </h4>
                      </div>

                      {/* Info details row */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold text-slate-450">
                        <span className="flex items-center gap-0.5">
                          💼 {toBengaliDigits(bk.tasksCount)}টি কাজ
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>
                          {getReadableSize(bk.size)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {getBengaliDateTime(bk.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons panel */}
                    <div className="flex items-center gap-1">
                      {isConfirming ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => handleRestoreBackup(bk.filename)}
                            className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold py-1 px-2 rounded-lg shadow-xs cursor-pointer"
                          >
                            নিশ্চিত
                          </button>
                          <button
                            onClick={() => setConfirmRestore(null)}
                            className="text-[10px] bg-slate-300 dark:bg-slate-700 text-slate-750 dark:text-slate-200 font-bold py-1 px-2 rounded-lg cursor-pointer"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setConfirmRestore(bk.filename)}
                            className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            title="ব্যাকআপ ফিরিয়ে আনুন (Restore)"
                          >
                            রিস্টোর
                          </button>
                          <button
                            onClick={(e) => handleDeleteBackup(bk.filename, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="ব্যাকআপ ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Visual indication overlay */}
                  {isConfirming && (
                    <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-amber-400" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security note / Tip */}
      <div className="bg-slate-50/70 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-100/60 dark:border-slate-800/60 flex items-start gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[10px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
          যেকোনো সময় টু-ডু রিস্টোর বোতামটি চাপলে নির্বাচন করা ব্যাকআপ ফাইলটি আপনার বর্তমান অ্যাপের কাজগুলোতে প্রতিস্থাপিত হয়ে যাবে। কোনো বিশেষ পরিবর্তন করার আগে ব্যাকআপ নিয়ে রাখা সুবিধাজনক।
        </p>
      </div>
    </div>
  );
}
