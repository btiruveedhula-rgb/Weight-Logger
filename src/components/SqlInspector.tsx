import React, { useEffect, useState } from "react";
import { Database, Terminal, RefreshCw, Layers, CheckCircle } from "lucide-react";
import { SqlLogEntry } from "../types";

export const SqlInspector: React.FC = () => {
  const [logs, setLogs] = useState<SqlLogEntry[]>([]);
  const [schema, setSchema] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"logs" | "schema">("logs");

  const fetchSqlData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sql/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setSchema(data.schema || "");
      }
    } catch (err) {
      console.error("Error fetching SQL logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSqlData();
    const interval = setInterval(fetchSqlData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-sans tracking-tight">Live SQL Database Inspector</h3>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SQLite Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Real-time relational SQL query stream executing against <code className="text-indigo-300 font-semibold">weight_tracker.sqlite</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 font-sans text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("logs")}
              className={`px-3.5 py-1.5 rounded-xl transition font-bold ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Queries ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schema")}
              className={`px-3.5 py-1.5 rounded-xl transition font-bold ${
                activeTab === "schema"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              DDL Schema
            </button>
          </div>

          <button
            type="button"
            onClick={fetchSqlData}
            title="Refresh logs"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {activeTab === "logs" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-sans">
            <span>Recent queries (auto-refreshed stream):</span>
            <span>Duration</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-sans">
                No SQL queries recorded in this session yet.
              </div>
            ) : (
              logs.map((log) => {
                const badgeColor =
                  log.type === "INSERT"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : log.type === "SELECT"
                    ? "bg-indigo-950 text-indigo-400 border-indigo-800"
                    : log.type === "DELETE"
                    ? "bg-rose-950 text-rose-400 border-rose-800"
                    : "bg-amber-950 text-amber-400 border-amber-800";

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition text-[11px] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${badgeColor}`}>
                          {log.type}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {log.executionTimeMs} ms
                      </span>
                    </div>
                    <div className="text-slate-200 font-mono break-all select-all leading-relaxed">
                      {log.query}
                    </div>
                    {log.params && log.params.length > 0 && (
                      <div className="text-[10px] text-slate-400 font-sans">
                        Params: <span className="text-indigo-300 font-mono">{JSON.stringify(log.params)}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-sans">
            <span>Relational Table Definition:</span>
            <span className="text-slate-500">SQLite &amp; PostgreSQL DDL Standard</span>
          </div>
          <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-indigo-200/90 overflow-x-auto text-[11px] leading-relaxed">
{schema || `-- weight_logs schema
CREATE TABLE weight_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weight REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  logged_at TEXT NOT NULL,
  reminder_date TEXT NOT NULL,
  notes TEXT,
  google_calendar_url TEXT,
  created_at TEXT NOT NULL
);`}
          </pre>
        </div>
      )}
    </div>
  );
};
