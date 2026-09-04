export interface WeightRecord {
  id: number;
  weight: number;
  unit: string;
  logged_at: string;
  reminder_date: string;
  notes: string | null;
  google_calendar_url: string;
  created_at: string;
}

export interface WeightStats {
  total_entries: number;
  min_weight: number;
  max_weight: number;
  avg_weight: number;
}

export interface NextReminderInfo {
  id: number;
  reminder_date: string;
  weight: number;
  unit: string;
}

export interface SqlLogEntry {
  id: string;
  timestamp: string;
  query: string;
  params?: any[];
  executionTimeMs: number;
  type: "CREATE" | "INSERT" | "SELECT" | "DELETE" | "SCHEMA";
}

export interface CalendarInvitePayload {
  record: WeightRecord;
  calendar: {
    googleCalendarUrl: string;
    reminderDate: string;
    reminderText: string;
    icsDownloadUrl: string;
  };
}
