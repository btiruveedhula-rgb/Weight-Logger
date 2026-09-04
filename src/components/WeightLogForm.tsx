import React, { useState } from "react";
import { Plus, Calendar, Clock, FileText, CheckCircle2, Sparkles, Scale } from "lucide-react";
import { CalendarInvitePayload } from "../types";

interface WeightLogFormProps {
  currentUnit: "kg" | "lbs";
  onUnitChange: (unit: "kg" | "lbs") => void;
  onSuccess: (data: CalendarInvitePayload) => void;
  lastWeight?: number;
}

export const WeightLogForm: React.FC<WeightLogFormProps> = ({
  currentUnit,
  onUnitChange,
  onSuccess,
  lastWeight,
}) => {
  const [weight, setWeight] = useState<string>(lastWeight ? lastWeight.toString() : "75.0");
  const [logDate, setLogDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [reminderTime, setReminderTime] = useState<string>("09:00");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quickTags = [
    "Morning fasted",
    "Post-workout",
    "Weekly routine",
    "Well hydrated",
    "Rest day",
  ];

  const adjustWeight = (delta: number) => {
    const val = parseFloat(weight) || 75.0;
    const updated = Math.max(20, Math.min(400, Number((val + delta).toFixed(1))));
    setWeight(updated.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      setErrorMsg("Please enter a valid positive weight value.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        weight: numWeight,
        unit: currentUnit,
        logged_at: new Date(logDate + "T" + reminderTime + ":00").toISOString(),
        notes: notes.trim() || null,
        reminder_time: reminderTime,
      };

      const res = await fetch("/api/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record weight entry");
      }

      const responseData: CalendarInvitePayload = await res.json();
      onSuccess(responseData);
      setNotes("");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[36px] border border-slate-100 p-6 sm:p-10 shadow-sm">
      {/* Top Header & Unit Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Log Today's Weight
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Syncs to SQL and schedules your 1-week Google Calendar reminder
            </p>
          </div>
        </div>

        {/* Sleek Unit Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/70 self-center sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => onUnitChange("kg")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              currentUnit === "kg"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Kilograms (kg)
          </button>
          <button
            type="button"
            onClick={() => onUnitChange("lbs")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              currentUnit === "lbs"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pounds (lbs)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
            {errorMsg}
          </div>
        )}

        {/* Centerpiece Weight Input */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Current Measurement
          </label>
          <div className="flex items-center justify-center gap-3">
            <input
              type="number"
              step="0.1"
              min="20"
              max="400"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              className="w-48 sm:w-56 text-4xl sm:text-5xl font-bold text-center py-3.5 px-4 rounded-3xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50/50 focus:bg-white outline-none transition-colors text-slate-800 shadow-inner"
            />
            <span className="text-2xl font-bold text-slate-400 uppercase">
              {currentUnit}
            </span>
          </div>

          {/* Quick Nudge Adjusters */}
          <div className="flex items-center gap-1.5 mt-4">
            <span className="text-xs text-slate-400 font-medium mr-1.5">Quick nudge:</span>
            {[-0.5, -0.1, +0.1, +0.5].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => adjustWeight(delta)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Reminder Schedule Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Log Date
            </label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50/60 border border-slate-200/80 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition"
            />
            <p className="text-[11px] text-slate-400">Recorded entry timestamp</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              1-Week Reminder Time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50/60 border border-slate-200/80 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition"
            />
            <p className="text-[11px] text-slate-400">Triggered +7 days from log date</p>
          </div>
        </div>

        {/* Notes & Suggested Tags */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notes &amp; Context (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Morning fasted weigh-in, post-routine, feeling energized"
            className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50/60 border border-slate-200/80 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition"
          />

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-slate-400 font-medium mr-1">Suggested tags:</span>
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setNotes(notes ? `${notes}, ${tag}` : tag)}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button & Status from Sleek Interface Theme */}
        <div className="pt-3 flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Syncing with SQL Database &amp; Generating Invite...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Log &amp; Schedule 1-Week Google Calendar Reminder</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Google Calendar &amp; SQL Engine Connected</span>
          </div>
        </div>
      </form>
    </div>
  );
};
