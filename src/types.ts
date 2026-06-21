export interface Task {
  id: string;
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM (24h format)
  completed: boolean;
  reminderEnabled: boolean;
  reminderTriggered: boolean;
  description: string;
  notes?: string; // Long-form rich notes / descriptions
  timerRunning?: boolean; // If structural stopwatch timer is running
  timerStartedAt?: number; // Start epoch timestamp (ms) for calculating elapsed seconds without drift
  timeSpent?: number; // Accumulated spent duration in seconds
  createdAt: string;
  completedAt?: string;
  archived?: boolean;
  voiceNote?: string; // base64 data URI of the recorded audio
  voiceNoteDuration?: number; // duration of voice note in seconds
}

export type TaskCategory = string;

export interface AIResponseTask {
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  suggestedTime: string; // "HH:MM" or ""
  description: string;
}

export interface LocalBackup {
  id: string;
  timestamp: string;
  tasksCount: number;
  tasksJson: string;
}

