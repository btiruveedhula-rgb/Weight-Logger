import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Calendar, Download, ExternalLink, Check, Copy, X, BellRing, Sparkles } from "lucide-react";
import { CalendarInvitePayload } from "../types";

interface CalendarModalProps {
  payload: CalendarInvitePayload | null;
  onClose: () => void;
  isNewEntry?: boolean;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ payload, onClose, isNewEntry = true }) => {
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (payload && isNewEntry) {
      // Fire celebratory confetti burst for consistency milestone
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#6366f1"],
      });
    }
  }, [payload, isNewEntry]);

  if (!payload) return null;

  const { record, calendar } = payload;
  const reminderDateObj = new Date(calendar.reminderDate || record.reminder_date);
  const formattedReminder = reminderDateObj.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = reminderDateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(calendar.googleCalendarUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  {isNewEntry ? "Weigh-in Recorded!" : "Google Calendar Reminder"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  +1 Week
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved to SQL database. Ready to sync with Google Calendar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scheduled Event Preview Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Scheduled Reminder Date
              </span>
              <div className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-indigo-600" />
                <span>{formattedReminder}</span>
                <span className="text-xs font-normal text-slate-400">at {formattedTime}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Logged Weight
              </span>
              <div className="text-base font-bold text-slate-800">
                {record.weight} {record.unit}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Event: <span>Weekly Body Weight Check-in</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pl-3.5">
              Configured with weekly recurrence (RRULE) and a 15-minute prior notification to keep your weekly routine effortless.
            </p>
          </div>
        </div>

        {/* Primary Call to Actions */}
        <div className="space-y-3">
          <a
            href={calendar.googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition shadow-lg shadow-indigo-200 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open &amp; Add to Google Calendar</span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`/api/weights/${record.id}/ics`}
              download={`weight-reminder-${record.id}.ics`}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-semibold text-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download .ICS</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-semibold text-xs transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Calendar Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            Done &amp; Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
