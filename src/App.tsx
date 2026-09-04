/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  Scale,
  Calendar,
  Database,
  TrendingDown,
  TrendingUp,
  Minus,
  BellRing,
  ExternalLink,
  Code2,
  Activity,
  CheckCircle2,
  Flame,
  Clock,
} from "lucide-react";
import { WeightRecord, WeightStats, NextReminderInfo, CalendarInvitePayload } from "./types";
import { WeightLogForm } from "./components/WeightLogForm";
import { WeightChart } from "./components/WeightChart";
import { WeightTable } from "./components/WeightTable";
import { CalendarModal } from "./components/CalendarModal";
import { SqlInspector } from "./components/SqlInspector";
import { SpringBootViewer } from "./components/SpringBootViewer";

export default function App() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [stats, setStats] = useState<WeightStats>({
    total_entries: 0,
    min_weight: 0,
    max_weight: 0,
    avg_weight: 0,
  });
  const [nextReminder, setNextReminder] = useState<NextReminderInfo | null>(null);
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [activeTab, setActiveTab] = useState<"dashboard" | "sql" | "spring">("dashboard");
  const [loading, setLoading] = useState<boolean>(true);
  const [calendarModalPayload, setCalendarModalPayload] = useState<CalendarInvitePayload | null>(null);
  const [isNewEntry, setIsNewEntry] = useState<boolean>(false);

  const fetchRecordsAndStats = async () => {
    try {
      const [weightsRes, statsRes] = await Promise.all([
        fetch("/api/weights"),
        fetch("/api/stats"),
      ]);

      if (weightsRes.ok) {
        const weightsData = await weightsRes.json();
        setRecords(weightsData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setNextReminder(statsData.nextReminder);
      }
    } catch (err) {
      console.error("Error loading app data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordsAndStats();
  }, []);

  const handleWeightLogged = (payload: CalendarInvitePayload) => {
    setIsNewEntry(true);
    setCalendarModalPayload(payload);
    fetchRecordsAndStats();
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this weigh-in entry?")) return;

    try {
      const res = await fetch(`/api/weights/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        fetchRecordsAndStats();
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const handleOpenExistingCalendarModal = (record: WeightRecord) => {
    setIsNewEntry(false);
    setCalendarModalPayload({
      record,
      calendar: {
        googleCalendarUrl: record.google_calendar_url,
        reminderDate: record.reminder_date,
        reminderText: `Scheduled for ${new Date(record.reminder_date).toLocaleDateString()}`,
        icsDownloadUrl: `/api/weights/${record.id}/ics`,
      },
    });
  };

  // Convert latest weight and diff to selected unit
  const latestRecord = records[0];
  const secondLatestRecord = records[1];

  const formatWeight = (val: number, origUnit: string) => {
    if (origUnit === unit) return val.toFixed(1);
    if (origUnit === "kg" && unit === "lbs") return (val * 2.20462).toFixed(1);
    return (val / 2.20462).toFixed(1);
  };

  const currentDisplayWeight = latestRecord ? formatWeight(latestRecord.weight, latestRecord.unit) : "--";

  let recentDelta: number | null = null;
  if (latestRecord && secondLatestRecord) {
    const cur = parseFloat(formatWeight(latestRecord.weight, latestRecord.unit));
    const prev = parseFloat(formatWeight(secondLatestRecord.weight, secondLatestRecord.unit));
    recentDelta = Number((cur - prev).toFixed(1));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Sleek Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
                  MetricHealth
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SQL Connected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                Weekly body weight tracking with automatic Google Calendar consistency reminders
              </p>
            </div>
          </div>

          {/* Navigation View Switcher & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
                  activeTab === "dashboard"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sql")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
                  activeTab === "sql"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Live SQL Inspector</span>
                <span className="md:hidden">SQL</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("spring")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
                  activeTab === "spring"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Java Spring Boot &amp; Vue</span>
                <span className="md:hidden">Code</span>
              </button>
            </div>

            {/* User Profile Pill from Sleek Interface Theme */}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Weekly Habit
                </p>
                <p className="text-xs font-bold text-slate-700">7-Day Cadence</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                ⚖️
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sleek Interface Grid Structure */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Tracker Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Column (Span 4) */}
            <section className="lg:col-span-4 flex flex-col gap-6">
              {/* Card 1: Current Weight */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-500">Current Weight</p>
                  <Scale className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-bold text-slate-800 tracking-tight">
                    {currentDisplayWeight}
                  </h2>
                  <span className="text-lg font-medium text-slate-400 uppercase">
                    {unit}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                  {recentDelta !== null ? (
                    recentDelta < 0 ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold bg-emerald-50 w-fit px-3 py-1 rounded-full">
                        <span>↓ {Math.abs(recentDelta)} {unit}</span>
                        <span className="text-emerald-500 font-normal text-xs">since last week</span>
                      </div>
                    ) : recentDelta > 0 ? (
                      <div className="flex items-center gap-1.5 text-amber-700 text-sm font-bold bg-amber-50 w-fit px-3 py-1 rounded-full">
                        <span>↑ +{recentDelta} {unit}</span>
                        <span className="text-amber-500 font-normal text-xs">since last week</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600 text-sm font-bold bg-slate-100 w-fit px-3 py-1 rounded-full">
                        <span>= 0.0 {unit}</span>
                        <span className="text-slate-400 font-normal text-xs">stable</span>
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">
                      First weigh-in baseline established
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Last entry:</span>
                  <span className="font-semibold text-slate-600">
                    {latestRecord
                      ? new Date(latestRecord.logged_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Awaiting log"}
                  </span>
                </div>
              </div>

              {/* Card 2: Next Scheduled Check-in (Vibrant Indigo Sleek Card) */}
              <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white">
                <div className="flex items-center justify-between mb-1 opacity-90">
                  <p className="text-sm font-medium">Next Scheduled Check-in</p>
                  <BellRing className="w-4 h-4 text-indigo-200 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold mb-4 tracking-tight">
                  {latestRecord
                    ? new Date(latestRecord.reminder_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : "No Upcoming Event"}
                </h2>

                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-xs">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs leading-tight opacity-95">
                    {latestRecord ? (
                      <p>Google Calendar invite configured for {new Date(latestRecord.reminder_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</p>
                    ) : (
                      <p>Google Calendar invite will be generated automatically after today's weigh-in.</p>
                    )}
                  </div>
                </div>

                {latestRecord && (
                  <button
                    type="button"
                    onClick={() => handleOpenExistingCalendarModal(latestRecord)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    <span>View Calendar Invite Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Card 3: Consistency & Milestone Progress */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Weekly Consistency</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                    {records.length} {records.length === 1 ? "Log" : "Logs"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                    <span className="text-slate-400">Streak Goal (4 Weeks)</span>
                    <span className="text-indigo-600">
                      {Math.min(100, Math.round((records.length / 4) * 100))}% Complete
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(12, Math.min(100, (records.length / 4) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed italic border-t border-slate-50 pt-3">
                  "Consistency is the foundation of sustainable health. Weighing in at 7-day intervals eliminates daily water fluctuation noise."
                </p>
              </div>
            </section>

            {/* Right Main Column (Span 8) */}
            <section className="lg:col-span-8 flex flex-col gap-8">
              {/* Main Weight Logger Card */}
              <WeightLogForm
                currentUnit={unit}
                onUnitChange={setUnit}
                onSuccess={handleWeightLogged}
                lastWeight={latestRecord ? latestRecord.weight : undefined}
              />

              {/* Weight Progression Trend Chart */}
              <WeightChart records={records} displayUnit={unit} />

              {/* Recent Logs Table */}
              <WeightTable
                records={records}
                displayUnit={unit}
                onDelete={handleDeleteRecord}
                onOpenCalendarModal={handleOpenExistingCalendarModal}
                loading={loading}
              />
            </section>
          </div>
        )}

        {/* Tab 2: Live SQL Inspector */}
        {activeTab === "sql" && (
          <section className="space-y-4">
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-slate-800 font-bold">Relational SQL Engine:</strong> Every log entry and metric query is executed directly against the local SQLite database via standard SQL statements.
              </div>
              <span className="font-mono text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-xl font-bold self-start sm:self-auto">
                SQLite 3.x Engine
              </span>
            </div>
            <SqlInspector />
          </section>
        )}

        {/* Tab 3: Java Spring Boot & Vue.js Source Code */}
        {activeTab === "spring" && (
          <section className="space-y-4">
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">
                Full-Stack Architecture (Java Spring Boot 3 + SQL + Vue 3):
              </div>
              <p className="leading-relaxed">
                As requested, we have structured the complete Java Spring Boot 3 REST API with Spring Data JPA and SQL DDL schemas in <code className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">/spring-boot-backend/</code>, along with the Vue 3 Single File Components in <code className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">/vue-frontend/</code>. You can inspect, copy, or export these files below.
              </p>
            </div>
            <SpringBootViewer />
          </section>
        )}
      </main>

      {/* Google Calendar Reminder Modal */}
      {calendarModalPayload && (
        <CalendarModal
          payload={calendarModalPayload}
          onClose={() => setCalendarModalPayload(null)}
          isNewEntry={isNewEntry}
        />
      )}
    </div>
  );
}
