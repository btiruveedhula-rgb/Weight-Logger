import React from "react";
import { Calendar, Trash2, Download, ExternalLink, ArrowDownRight, ArrowUpRight, Minus, BellRing } from "lucide-react";
import { WeightRecord } from "../types";

interface WeightTableProps {
  records: WeightRecord[];
  displayUnit: "kg" | "lbs";
  onDelete: (id: number) => void;
  onOpenCalendarModal: (record: WeightRecord) => void;
  loading: boolean;
}

export const WeightTable: React.FC<WeightTableProps> = ({
  records,
  displayUnit,
  onDelete,
  onOpenCalendarModal,
  loading,
}) => {
  const formatDisplayWeight = (weight: number, originalUnit: string) => {
    if (originalUnit === displayUnit) return weight.toFixed(1);
    if (originalUnit === "kg" && displayUnit === "lbs") {
      return (weight * 2.20462).toFixed(1);
    }
    return (weight / 2.20462).toFixed(1);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-7 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Weigh-in History</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {records.length} {records.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological records stored in SQL table with weekly reminder triggers
          </p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Click any event button to re-open Google Calendar invite</span>
        </div>
      </div>

      {loading && records.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading weight records from SQL database...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-1">
          <p className="text-sm font-semibold text-slate-600">No body weight records logged yet</p>
          <p className="text-xs text-slate-400">Log your first weight entry above to start building consistency.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5 sm:px-6">Date</th>
                <th className="py-3 px-4">Weight ({displayUnit})</th>
                <th className="py-3 px-4">Change</th>
                <th className="py-3 px-4 hidden md:table-cell">Context &amp; Notes</th>
                <th className="py-3 px-4">1-Week Reminder</th>
                <th className="py-3 px-5 sm:px-6 text-right">Calendar Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map((row, idx) => {
                const currentVal = parseFloat(formatDisplayWeight(row.weight, row.unit));
                // Next item in records array is the chronologically previous entry (since sorted DESC)
                const prevRow = records[idx + 1];
                let changeDelta: number | null = null;
                if (prevRow) {
                  const prevVal = parseFloat(formatDisplayWeight(prevRow.weight, prevRow.unit));
                  changeDelta = Number((currentVal - prevVal).toFixed(1));
                }

                const logDate = new Date(row.logged_at);
                const reminderDate = new Date(row.reminder_date);
                const isUpcomingReminder = reminderDate.getTime() > Date.now();

                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Date */}
                    <td className="py-4 px-5 sm:px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {logDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {logDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-base font-bold text-slate-800">
                        {currentVal}
                      </span>
                      <span className="text-xs text-slate-400 font-medium ml-1">
                        {displayUnit}
                      </span>
                    </td>

                    {/* Change */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {changeDelta !== null ? (
                        changeDelta < 0 ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                            {Math.abs(changeDelta)} {displayUnit}
                          </span>
                        ) : changeDelta > 0 ? (
                          <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                            +{changeDelta} {displayUnit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <Minus className="w-3 h-3 mr-0.5" />
                            0.0
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Baseline</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-600 max-w-xs">
                      {row.notes ? (
                        <span className="inline-block truncate max-w-xs" title={row.notes}>
                          {row.notes}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>

                    {/* 1-Week Reminder */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <BellRing className={`w-3.5 h-3.5 ${isUpcomingReminder ? "text-indigo-600" : "text-slate-400"}`} />
                        <div>
                          <div className="text-xs font-medium text-slate-800">
                            {reminderDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <span className={`text-[10px] font-semibold ${isUpcomingReminder ? "text-indigo-600" : "text-slate-400"}`}>
                            {isUpcomingReminder ? "Next scheduled" : "Passed"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Google Calendar invite button */}
                        <button
                          type="button"
                          onClick={() => onOpenCalendarModal(row)}
                          title="Open Google Calendar invite"
                          className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {/* Download .ICS */}
                        <a
                          href={`/api/weights/${row.id}/ics`}
                          download={`weight-reminder-${row.id}.ics`}
                          title="Download .ICS calendar file"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          title="Delete entry"
                          className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
