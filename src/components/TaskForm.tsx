import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Bell, Calendar, Clock, Tag, AlertTriangle, 
  Mic, MicOff, ChevronLeft, ChevronRight,
  Bold, Italic, Heading, List, Code, Eye, Edit2, FileText,
  Square, Trash2, Play, Pause, Volume2
} from "lucide-react";
import { Task } from "../types";
import { renderMarkdown } from "../utils";

interface TaskFormProps {
  onAddTask: (taskData: Omit<Task, "id" | "completed" | "reminderTriggered" | "createdAt">) => void;
  categoryColors?: Record<string, string>;
}

export default function TaskForm({ onAddTask, categoryColors = {} }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("ব্যক্তিগত");
  
  const defaultCats = ["ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য"];
  const customCats = Object.keys(categoryColors).filter(cat => !defaultCats.includes(cat));

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  
  // Base date/time defaults to today
  const todayStr = new Date().toISOString().split("T")[0];
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [description, setDescription] = useState("");
  
  // Notes rich text / long-form details state
  const [notes, setNotes] = useState("");
  const [notesTab, setNotesTab] = useState<"write" | "preview">("write");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // States for Voice Note recording & playback
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recorderError, setRecorderError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Audio elements for playing recorded audio
  const [isPlayingFormAudio, setIsPlayingFormAudio] = useState(false);
  const formAudioRef = useRef<HTMLAudioElement | null>(null);

  // Functions to start, stop, and clean up recording
  const startVoiceRecording = async () => {
    try {
      setRecorderError("");
      setVoiceNote(null);
      setVoiceNoteDuration(0);
      setRecordingSeconds(0);

      // Stop other listening streams (for title / description text synthesis) if any are active
      if (isListening) stopListening();
      if (isListeningDesc) stopListeningDesc();

      // Request microphone permissions
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
          setVoiceNote(base64data);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            // Cap at 60 seconds (1 minute) for quick voice memos
            stopVoiceRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Error accessing microphone: ", err);
      setRecorderError("মাইক্রোফোন অ্যাক্সেস করতে সমস্যা হচ্ছে বা অনুমতি দেওয়া হয়নি।");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
    setVoiceNoteDuration(recordingSeconds);
  };

  const playFormAudio = () => {
    if (!voiceNote) return;
    if (isPlayingFormAudio) {
      if (formAudioRef.current) {
        formAudioRef.current.pause();
      }
      setIsPlayingFormAudio(false);
    } else {
      if (formAudioRef.current) {
        formAudioRef.current.currentTime = 0;
        formAudioRef.current.play();
        setIsPlayingFormAudio(true);
      } else {
        const audio = new Audio(voiceNote);
        formAudioRef.current = audio;
        audio.onended = () => {
          setIsPlayingFormAudio(false);
        };
        audio.play();
        setIsPlayingFormAudio(true);
      }
    }
  };

  const deleteFormAudio = () => {
    if (formAudioRef.current) {
      formAudioRef.current.pause();
      formAudioRef.current = null;
    }
    setIsPlayingFormAudio(false);
    setVoiceNote(null);
    setVoiceNoteDuration(0);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (formAudioRef.current) formAudioRef.current.pause();
    };
  }, []);

  // Helper inside text-area to insert formatting at caret
  const insertFormat = (prefix: string, suffix: string = "") => {
    const el = notesRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || "") + suffix;

    setNotes(text.substring(0, start) + replacement + text.substring(end));
    
    // Put focus back and select inserted text
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "").length);
    }, 50);
  };

  // Calendar internal state & helpers
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [currentYear, setCurrentYear] = useState(() => {
    const d = new Date(dueDate || todayStr);
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(dueDate || todayStr);
    return isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
  });

  // Keep internal calendar navigation in sync with external value
  useEffect(() => {
    if (dueDate) {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [dueDate]);

  // Click outside to close calendar handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const toBengaliDigits = (num: string | number) => {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[Number(w)]);
  };

  const bnMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];

  const getFormattedBengaliDate = (dateString: string) => {
    if (!dateString) return "তারিখ নির্বাচন করুন";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${toBengaliDigits(day)} ${bnMonths[month]}, ${toBengaliDigits(year)}`;
  };

  const getAdjustedDateParts = (y: number, m: number, d: number) => {
    const dt = new Date(y, m, d);
    return {
      year: dt.getFullYear(),
      month: dt.getMonth(),
      day: dt.getDate(),
      dateStr: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
    };
  };

  const selectToday = () => {
    setDueDate(todayStr);
    setShowCalendar(false);
  };

  const selectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split("T")[0]);
    setShowCalendar(false);
  };

  const selectNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDueDate(nextWeek.toISOString().split("T")[0]);
    setShowCalendar(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const getDaysArray = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday is 0, Saturday is 6
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const daysList = [];
    
    // Padding from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const { dateStr } = getAdjustedDateParts(currentYear, currentMonth - 1, daysInPrevMonth - i);
      daysList.push({
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateStr
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const { dateStr } = getAdjustedDateParts(currentYear, currentMonth, i);
      daysList.push({
        dayNum: i,
        isCurrentMonth: true,
        dateStr
      });
    }
    
    // Padding for next month to complete weeks
    const totalCells = daysList.length <= 35 ? 35 : 42;
    const paddingNeeded = totalCells - daysList.length;
    for (let i = 1; i <= paddingNeeded; i++) {
      const { dateStr } = getAdjustedDateParts(currentYear, currentMonth + 1, i);
      daysList.push({
        dayNum: i,
        isCurrentMonth: false,
        dateStr
      });
    }
    
    return daysList;
  };

  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"bn-BD" | "en-US">("bn-BD");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechObj) {
      setSpeechSupported(true);
    }
  }, []);

  const startListening = () => {
    const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechObj) return;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechObj();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = voiceLang;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechFeedback("");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "not-allowed") {
        setSpeechFeedback("মাইক্রোফোন ব্যবহারের অনুমতি নেই!");
      } else {
        setSpeechFeedback("বুঝতে পারিনি, পুনরায় বলুন।");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeTranscript = finalTranscript || interimTranscript;
      setSpeechFeedback(activeTranscript);

      if (finalTranscript) {
        const cleanText = finalTranscript.trim();
        
        // Match standard Bengali trigger commands to submit/add task
        const bnTriggerMatch = cleanText.match(/(যোগ করো|যুক্ত করো|যুক্ত কর|যোগ কর|ভর্তি করো|অ্যাড করো)$/i);
        const enTriggerMatch = cleanText.toLowerCase().endsWith("add task") || cleanText.toLowerCase().endsWith("add");

        if (bnTriggerMatch) {
          const matchedText = cleanText.slice(0, bnTriggerMatch.index).trim();
          if (matchedText) {
            setTitle(matchedText);
            // Trigger auto add
            setTimeout(() => {
              const taskBtn = document.getElementById("task-add-submit-btn");
              if (taskBtn) {
                taskBtn.click();
              }
            }, 300);
          }
        } else if (enTriggerMatch) {
          const matchedText = cleanText.replace(/(add task|add)$/i, "").trim();
          if (matchedText) {
            setTitle(matchedText);
            setTimeout(() => {
              const taskBtn = document.getElementById("task-add-submit-btn");
              if (taskBtn) {
                taskBtn.click();
              }
            }, 300);
          }
        } else {
          setTitle(cleanText);
        }
      } else if (interimTranscript) {
        setTitle(interimTranscript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // State variables for Description Speech Recognition
  const [isListeningDesc, setIsListeningDesc] = useState(false);
  const [voiceLangDesc, setVoiceLangDesc] = useState<"bn-BD" | "en-US">("bn-BD");
  const [speechFeedbackDesc, setSpeechFeedbackDesc] = useState("");
  const recognitionDescRef = useRef<any>(null);

  const startListeningDesc = () => {
    // Stop any active Title listening to avoid resource conflict
    if (isListening) {
      stopListening();
    }

    const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechObj) return;

    if (recognitionDescRef.current) {
      recognitionDescRef.current.abort();
    }

    const recognition = new SpeechObj();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = voiceLangDesc;

    recognition.onstart = () => {
      setIsListeningDesc(true);
      setSpeechFeedbackDesc("");
    };

    recognition.onerror = (event: any) => {
      console.error("Description speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setSpeechFeedbackDesc("মাইক্রোফোন ব্যবহারের অনুমতি নেই!");
      } else {
        setSpeechFeedbackDesc("বুঝতে পারিনি, পুনরায় বলুন।");
      }
      setIsListeningDesc(false);
    };

    recognition.onend = () => {
      setIsListeningDesc(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeTranscript = finalTranscript || interimTranscript;
      setSpeechFeedbackDesc(activeTranscript);

      if (finalTranscript) {
        // Append text to existing description
        setDescription((prev) => {
          const base = prev.trim();
          return base ? `${base} ${finalTranscript.trim()}` : finalTranscript.trim();
        });
      }
    };

    recognitionDescRef.current = recognition;
    recognition.start();
  };

  const stopListeningDesc = () => {
    if (recognitionDescRef.current) {
      recognitionDescRef.current.stop();
    }
    setIsListeningDesc(false);
  };

  const toggleListeningDesc = () => {
    if (isListeningDesc) {
      stopListeningDesc();
    } else {
      startListeningDesc();
    }
  };

  // Auto clean speech objects on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (recognitionDescRef.current) {
        recognitionDescRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      category,
      priority,
      dueDate,
      dueTime: dueTime || "12:00", // Default to midday if empty
      reminderEnabled: reminderEnabled && !!dueTime, // Enable reminder only if time is configured
      description: description.trim(),
      notes: notes.trim(),
      voiceNote: voiceNote || undefined,
      voiceNoteDuration: voiceNoteDuration || undefined,
    });

    // Reset fields
    setTitle("");
    setCategory("ব্যক্তিগত");
    setIsCustomCategory(false);
    setCustomCategoryText("");
    setDueTime("");
    setDescription("");
    setNotes("");
    setReminderEnabled(true);
    setVoiceNote(null);
    setVoiceNoteDuration(0);
    if (formAudioRef.current) {
      formAudioRef.current.pause();
      formAudioRef.current = null;
    }
    setIsPlayingFormAudio(false);
  };

  return (
    <form
      id="task-submit-form"
      onSubmit={handleSubmit}
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-md transition-all duration-300 hover:shadow-lg focus-within:border-emerald-200 dark:focus-within:border-emerald-800"
    >
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        নতুন কাজ যুক্ত করুন
      </h3>

      <div className="space-y-4">
        {/* Title input */}
        <div className="relative">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="task-title" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              শিরোনাম <span className="text-rose-500">*</span>
            </label>
            {speechSupported && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/35 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shrink-0">
                🎤 ভয়েস কমান্ড সমর্থিত
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              id="task-title"
              type="text"
              placeholder={isListening ? "ভয়েস শুনছি... কথা বলুন..." : "যেমন: সকালে হাঁটতে যাওয়া, অ্যাসাইনমেন্ট শেষ করা..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full text-sm pl-4 pr-11 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "ভয়েস ইনপুট বন্ধ করুন" : "ভয়েস কমান্ডের মাধ্যমে লিখুন"}
                className={`absolute right-1.5 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Speech Feedback Area */}
          {isListening && (
            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    শুনছি... <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-mono">{voiceLang === "bn-BD" ? "বাংলা 🇧🇩" : "English 🇬🇧"}</span>
                  </p>
                  <p className="text-[11px] text-emerald-650/90 dark:text-emerald-450 truncate font-mono">
                    {speechFeedback || "কথা বলুন, আমরা লিখছি..."}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setVoiceLang(prev => prev === "bn-BD" ? "en-US" : "bn-BD")}
                  className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-705 active:scale-[0.95] transition-all cursor-pointer"
                >
                  {voiceLang === "bn-BD" ? "🇬🇧 EN" : "🇧🇩 BN"}
                </button>
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2 py-1 text-[10px] bg-rose-600 hover:bg-rose-750 text-white rounded-lg font-bold active:scale-[0.95] transition-all cursor-pointer"
                >
                  থামুন
                </button>
              </div>
            </div>
          )}

          {/* Voice instruction hint */}
          {isListening && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 italic pl-1">
              💡 প্রো-টিপ: শিরোনাম সাবলীলভাবে বলে শেষে <strong className="text-emerald-600 dark:text-emerald-400">"যোগ করো"</strong> বলুন; স্বয়ংক্রিয়ভাবে তালিকায় যুক্ত হবে।
            </p>
          )}
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-category" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> কাজের ক্যাটাগরি
            </label>
            <select
              id="task-category"
              value={isCustomCategory ? "CUSTOM" : category}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "CUSTOM") {
                  setIsCustomCategory(true);
                  setCategory(customCategoryText.trim() || "");
                } else {
                  setIsCustomCategory(false);
                  setCategory(val);
                }
              }}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer"
            >
              <option value="ব্যক্তিগত" className="dark:bg-slate-800 dark:text-slate-100">🏠 ব্যক্তিগত</option>
              <option value="কাজ" className="dark:bg-slate-800 dark:text-slate-100">💼 অফিস / পেশাগত</option>
              <option value="পড়াশোনা" className="dark:bg-slate-800 dark:text-slate-100">📚 পড়াশোনা / শিক্ষা</option>
              <option value="স্বাস্থ্য" className="dark:bg-slate-800 dark:text-slate-100">❤️ স্বাস্থ্য ও শরীরচর্চা</option>
              <option value="অন্যান্য" className="dark:bg-slate-800 dark:text-slate-100">✨ অন্যান্য</option>
              {customCats.map((catName) => (
                <option key={catName} value={catName} className="dark:bg-slate-800 dark:text-slate-100">
                  🏷️ {catName}
                </option>
              ))}
              <option value="CUSTOM" className="dark:bg-slate-800 dark:text-slate-100">➕ কাস্টম ক্যাটাগরি লিখুন...</option>
            </select>

            {isCustomCategory && (
              <div className="mt-2.5 animate-fadeIn">
                <input
                  type="text"
                  value={customCategoryText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomCategoryText(val);
                    setCategory(val.trim() || "");
                  }}
                  placeholder="নতুন ক্যাটাগরির নাম দিন (যেমন: শপিং, ব্যায়াম)..."
                  required
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-555 transition-all animate-slideDown"
                />
              </div>
            )}
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> অগ্রাধিকার (Priority)
            </span>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((lvl) => {
                const labelMap = { low: "সাধারণ", medium: "মধ্যম", high: "জরুরি" };
                const colorMap = {
                  low: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-200",
                  medium: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200",
                  high: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-200",
                };
                const activeColorMap = {
                  low: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20",
                  medium: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20",
                  high: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20",
                };

                const isActive = priority === lvl;

                return (
                  <button
                    type="button"
                    key={lvl}
                    id={`priority-${lvl}-btn`}
                    onClick={() => setPriority(lvl)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                      isActive ? activeColorMap[lvl] : colorMap[lvl]
                    }`}
                  >
                    {labelMap[lvl]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative" ref={calendarRef}>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 select-none flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> দিন (Due Date)
            </label>
            <button
              id="task-due-date-trigger"
              type="button"
              onClick={() => setShowCalendar(prev => !prev)}
              className="w-full text-left text-sm px-3.5 py-1.5 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                {getFormattedBengaliDate(dueDate)}
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-semibold font-mono">
                {dueDate.split("-").reverse().join("/")}
              </span>
            </button>

            {/* Calendar Popover */}
            {showCalendar && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3.5 animate-fadeIn">
                <div className="flex gap-1 mb-2.5 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                  <button
                    type="button"
                    onClick={selectToday}
                    className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
                  >
                    আজ
                  </button>
                  <button
                    type="button"
                    onClick={selectTomorrow}
                    className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/60 transition-all cursor-pointer"
                  >
                    আগামীকাল
                  </button>
                  <button
                    type="button"
                    onClick={selectNextWeek}
                    className="flex-1 py-1 text-[10px] font-bold rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100/80 dark:hover:bg-purple-950/60 transition-all cursor-pointer"
                  >
                    ১ সপ্তাহ পর
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1 mb-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-705 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
                    {bnMonths[currentMonth]} {toBengaliDigits(currentYear)}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-705 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
                  {["র", "সো", "ম", "বু", "বৃ", "শু", "শ"].map((day, idx) => (
                    <div key={idx} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getDaysArray().map((item, idx) => {
                    const isSelected = item.dateStr === dueDate;
                    const isTodayDate = item.dateStr === todayStr;
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDueDate(item.dateStr);
                          setShowCalendar(false);
                        }}
                        className={`h-7.5 text-xs rounded-xl flex items-center justify-center font-semibold transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-sm font-bold scale-[1.05]"
                            : item.isCurrentMonth
                              ? isTodayDate
                                ? "border-2 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                              : isTodayDate
                                ? "border border-emerald-500/20 text-emerald-600/50 dark:text-emerald-400/50 bg-emerald-500/2"
                                : "text-slate-350 dark:text-slate-650 hover:bg-slate-100/50 dark:hover:bg-slate-700/40 opacity-50"
                        }`}
                      >
                        {toBengaliDigits(item.dayNum)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="task-due-time" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> সময় (Due Time)
            </label>
            <div className="relative">
              <input
                id="task-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-sm px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer"
              />
              {!dueTime && (
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none italic hidden sm:inline">
                  ঐচ্ছিক
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reminder Settings toggle */}
        {dueTime && (
          <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Bell className={`w-4 h-4 ${reminderEnabled ? "text-emerald-500 animate-swing" : "text-slate-400 dark:text-slate-500"}`} />
              রিমাইন্ডার সক্রিয় করতে চান?
            </span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                id="reminder-enabled-toggle"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        )}

        {/* Description textarea */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="task-description" className="block text-xs font-medium text-slate-500 dark:text-slate-400 select-none">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
            {speechSupported && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/35 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shrink-0">
                🎤 ভয়েস টাইপিং সমর্থিত
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <textarea
              id="task-description"
              rows={2}
              placeholder={isListeningDesc ? "ভয়েস শুনছি... কথা বলুন..." : "কাজের অতিরিক্ত তথ্য বা জরুরি নোট লিখুন..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-y min-h-[46px]"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListeningDesc}
                title={isListeningDesc ? "ভয়েস বিবরণ টাইপিং বন্ধ করুন" : "ভয়েসের মাধ্যমে বিবরণটি লিখুন"}
                className={`absolute right-1.5 top-1.5 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  isListeningDesc
                    ? "bg-rose-500 text-white animate-pulse shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {isListeningDesc ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Description Speech Feedback Area */}
          {isListeningDesc && (
            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    বিবরণ শুনছি... <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-mono">{voiceLangDesc === "bn-BD" ? "বাংলা 🇧🇩" : "English 🇬🇧"}</span>
                  </p>
                  <p className="text-[11px] text-emerald-650/90 dark:text-emerald-450 truncate font-mono">
                    {speechFeedbackDesc || "কথা বলুন, আমরা ডেসক্রিপশনটি লিখছি..."}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setVoiceLangDesc(prev => prev === "bn-BD" ? "en-US" : "bn-BD")}
                  className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-700 dark:text-slate-350 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-705 active:scale-[0.95] transition-all cursor-pointer"
                >
                  {voiceLangDesc === "bn-BD" ? "🇬🇧 EN" : "🇧🇩 BN"}
                </button>
                <button
                  type="button"
                  onClick={stopListeningDesc}
                  className="px-2 py-1 text-[10px] bg-rose-600 hover:bg-rose-750 text-white rounded-lg font-bold active:scale-[0.95] transition-all cursor-pointer"
                >
                  থামুন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Voice Memo Recording Widget */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800/70 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-355 flex items-center gap-1.5 select-none">
              <Mic className="w-4 h-4 text-emerald-500" />
              ভয়েস মেমো যুক্ত করুন (Voice Memo)
            </span>
            {voiceNote && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30">
                সংযুক্ত করা হয়েছে ({voiceNoteDuration}s)
              </span>
            )}
          </div>

          {recorderError && (
            <p className="text-[11px] text-rose-500 font-semibold">{recorderError}</p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Action record stop buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>রেকর্ডিং থামান</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-705 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{voiceNote ? "নতুন করে রেকর্ড করুন" : "ভয়েস রেকর্ড করুন"}</span>
                </button>
              )}
            </div>

            {/* If recording, show live timer and wave simulation */}
            {isRecording && (
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl flex-1 max-w-full overflow-hidden w-full">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-xs font-mono font-black text-rose-650 dark:text-rose-400">
                  0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 1:00
                </span>
                
                {/* Simulated visualizer waves */}
                <div className="flex items-center gap-0.5 h-3">
                  {[...Array(12)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-0.5 bg-rose-550 rounded-full animate-bounce" 
                      style={{ 
                        height: `${20 + Math.random() * 80}%`,
                        animationDuration: `${0.4 + (i % 3) * 0.15}s`,
                        animationDelay: `${i * 0.05}s`
                      }} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* If voice note exists and NOT recording, show player and delete controls */}
            {voiceNote && !isRecording && (
              <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl flex-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={playFormAudio}
                  className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold transition-all cursor-pointer"
                >
                  {isPlayingFormAudio ? (
                    <>
                      <Pause className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span>মেমো থামান</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-slate-500" />
                      <span>মেমো শুনুন</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                    {voiceNoteDuration}s
                  </span>
                  <button
                    type="button"
                    onClick={deleteFormAudio}
                    title="মেমো ডিলিট করুন"
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rich Text / Markdown Long-Form Notes Editor */}
        <div className="space-y-1.5 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="task-notes" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 select-none flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              বিস্তারিত দীর্ঘ বিবরণ ও নোটস (ঐচ্ছিক - Rich Text)
            </label>
            
            {/* Tab selection for Editor vs Preview */}
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex gap-0.5 border border-slate-200/40 dark:border-slate-700/40 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setNotesTab("write")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  notesTab === "write"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-750 dark:text-slate-400"
                }`}
              >
                <Edit2 className="w-2.5 h-2.5" /> লিখুন
              </button>
              <button
                type="button"
                onClick={() => setNotesTab("preview")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  notesTab === "preview"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-750 dark:text-slate-400"
                }`}
              >
                <Eye className="w-2.5 h-2.5" /> প্রাকদর্শন
              </button>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/40">
            {notesTab === "write" ? (
              /* Writing Area with Markdown Toolbar */
              <div>
                {/* Visual Format Action Toolbar */}
                <div className="bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-1 items-center">
                  <button
                    type="button"
                    onClick={() => insertFormat("**", "**")}
                    title="Bold (**লেখা**)"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("*", "*")}
                    title="Italic (*লেখা*)"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
                  >
                    <Italic className="w-3.5 h-3.5 font-bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("## ", "\n")}
                    title="Header 2 (⚓ ## শিরোনাম)"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer flex items-center gap-0.5 text-[9px] font-bold"
                  >
                    <Heading className="w-3.5 h-3.5" /><span>H2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("### ", "\n")}
                    title="Header 3 (📍 ### শিরোনাম)"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer flex items-center gap-0.5 text-[9px] font-bold"
                  >
                    <Heading className="w-3.5 h-3.5" /><span>H3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("- ", "\n")}
                    title="Bullet List (- বিষয়)"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("`", "`")}
                    title="Code snippet (`কোড`)"
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("> ", "\n")}
                    title="Quote (> বিষদ মন্তব্য)"
                    className="p-0.5 px-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer text-[10px] font-bold font-mono"
                  >
                    “”
                  </button>
                  <span className="h-4 w-px bg-slate-350 dark:bg-slate-700 mx-1"></span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium select-none">
                    Markdown এবং টুলবার ব্যবহার করে সাজান
                  </span>
                </div>

                <textarea
                  id="task-notes"
                  ref={notesRef}
                  rows={4}
                  placeholder="এখানে আপনার কাজটির দীর্ঘকালীন রিচ বিবরণ, বুলেট পয়েন্ট বা প্রজেক্টের জরুরি চেকলিস্ট মেইল এলার্ট নোটিশে রাখার জন্য বিস্তারিত লিখুন..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none transition-all resize-y min-h-[90px]"
                />
              </div>
            ) : (
              /* High-fidelity Visual Preview Area */
              <div 
                className="p-4 bg-white dark:bg-slate-900 min-h-[125px] overflow-auto max-h-[220px] prose dark:prose-invert prose-xs text-xs text-slate-750 dark:text-slate-200 select-text"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) || `<p class="italic text-slate-400 dark:text-slate-500 text-xs">নোটে কোনো তথ্য নেই। লিখুন ট্যাবে গিয়ে টাইপ করুন...</p>` }}
              />
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="task-add-submit-btn"
          className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 hover:translate-y-[-1px] active:translate-y-[0px] text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-emerald-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <Plus className="w-5 h-5" />
          তালিকায় যোগ করুন
        </button>
      </div>
    </form>
  );
}
