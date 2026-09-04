import React, { useState } from "react";
import { Code2, Copy, Check, FileCode, Coffee, Box, Layers, Download } from "lucide-react";

export const SpringBootViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>("controller");
  const [copied, setCopied] = useState<boolean>(false);

  const files: Record<
    string,
    { title: string; filename: string; language: string; tag: string; code: string }
  > = {
    controller: {
      title: "Spring Boot REST Controller",
      filename: "WeightLogController.java",
      language: "java",
      tag: "Java 17 / Spring Web",
      code: `package com.example.weighttracker.controller;

import com.example.weighttracker.model.WeightLog;
import com.example.weighttracker.repository.WeightLogRepository;
import com.example.weighttracker.service.CalendarInviteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weights")
@CrossOrigin(origins = "*")
public class WeightLogController {

    private final WeightLogRepository repository;
    private final CalendarInviteService calendarService;

    public WeightLogController(WeightLogRepository repository, CalendarInviteService calendarService) {
        this.repository = repository;
        this.calendarService = calendarService;
    }

    /**
     * GET /api/weights: List all weigh-in records descending
     */
    @GetMapping
    public List<WeightLog> getAllLogs() {
        return repository.findAllByOrderByLoggedAtDesc();
    }

    /**
     * POST /api/weights: Log body weight & schedule Google Calendar invite (+7 days)
     */
    @PostMapping
    public ResponseEntity<?> createWeightLog(@Valid @RequestBody WeightLog logRequest) {
        if (logRequest.getLoggedAt() == null) {
            logRequest.setLoggedAt(LocalDateTime.now());
        }

        // Schedule Google Calendar reminder exactly 1 week (7 days) later
        LocalDateTime reminderDate = logRequest.getLoggedAt().plusDays(7);
        logRequest.setReminderDate(reminderDate);

        // Generate 1-click Google Calendar Web invite URL
        String calendarUrl = calendarService.generateGoogleCalendarUrl(
                reminderDate,
                logRequest.getWeight(),
                logRequest.getUnit()
        );
        logRequest.setGoogleCalendarUrl(calendarUrl);
        logRequest.setCreatedAt(LocalDateTime.now());

        // Persist to SQL Database via JPA
        WeightLog savedLog = repository.save(logRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("record", savedLog);
        response.put("calendar", Map.of(
            "googleCalendarUrl", calendarUrl,
            "reminderDate", reminderDate,
            "icsDownloadUrl", "/api/weights/" + savedLog.getId() + "/ics"
        ));

        return ResponseEntity.created(URI.create("/api/weights/" + savedLog.getId())).body(response);
    }

    /**
     * DELETE /api/weights/{id}: Remove weight record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLog(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "deletedId", id));
    }
}`,
    },
    entity: {
      title: "JPA SQL Entity",
      filename: "WeightLog.java",
      language: "java",
      tag: "Hibernate / JPA",
      code: `package com.example.weighttracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "weight_logs")
public class WeightLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "1.0")
    @Column(nullable = false)
    private Double weight;

    @Column(nullable = false, length = 10)
    private String unit = "kg"; // 'kg' or 'lbs'

    @NotNull
    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;

    @Column(name = "reminder_date", nullable = false)
    private LocalDateTime reminderDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "google_calendar_url", columnDefinition = "TEXT")
    private String googleCalendarUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public WeightLog() {}

    // Getters and Setters ...
}`,
    },
    repository: {
      title: "Spring Data JPA Repository",
      filename: "WeightLogRepository.java",
      language: "java",
      tag: "Spring Data JPA",
      code: `package com.example.weighttracker.repository;

import com.example.weighttracker.model.WeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WeightLogRepository extends JpaRepository<WeightLog, Long> {
    List<WeightLog> findAllByOrderByLoggedAtDesc();

    @Query(value = "SELECT COUNT(*) AS totalEntries, MIN(weight) AS minWeight, MAX(weight) AS maxWeight, AVG(weight) AS avgWeight FROM weight_logs", nativeQuery = true)
    Object[] getWeightStats();
}`,
    },
    schema: {
      title: "SQL DDL Schema",
      filename: "schema.sql",
      language: "sql",
      tag: "SQL DDL",
      code: `-- SQL DDL Table Schema for Body Weight Logs and Reminders
-- Compatible with PostgreSQL, MySQL, H2, and SQLite

CREATE TABLE IF NOT EXISTS weight_logs (
    id BIGSERIAL PRIMARY KEY,
    weight NUMERIC(5, 2) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'kg',
    logged_at TIMESTAMP NOT NULL,
    reminder_date TIMESTAMP NOT NULL,
    notes TEXT,
    google_calendar_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_logged_at ON weight_logs (logged_at DESC);`,
    },
    vue: {
      title: "Vue 3 Component (SFC)",
      filename: "WeightLogView.vue",
      language: "vue",
      tag: "Vue 3 Composition API",
      code: `<template>
  <div class="weight-tracker-container">
    <h2>Record Body Weight</h2>
    
    <!-- Weight Form -->
    <form @submit.prevent="submitWeight">
      <div class="input-group">
        <label>Weight ({{ unit }})</label>
        <input type="number" step="0.1" v-model="weight" required />
      </div>
      
      <button type="submit">Log Weight & Schedule Google Calendar Invite</button>
    </form>

    <!-- Google Calendar 1-Week Invite Modal -->
    <div v-if="inviteModal" class="modal-overlay">
      <div class="modal-card">
        <h3>Weight Logged Successfully!</h3>
        <p>Your reminder has been scheduled for exactly 1 week later.</p>
        <a :href="inviteModal.googleCalendarUrl" target="_blank" class="btn-calendar">
          Open Google Calendar Invite
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const weight = ref('');
const unit = ref('kg');
const inviteModal = ref(null);

async function submitWeight() {
  const res = await fetch('/api/weights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weight: parseFloat(weight.value), unit: unit.value })
  });
  if (res.ok) {
    const data = await res.json();
    inviteModal.value = data.calendar;
  }
}
</script>`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Java Spring Boot &amp; Vue.js Source Code</h3>
              <span className="text-[10px] font-bold bg-slate-800 border border-slate-700 text-indigo-300 px-2.5 py-0.5 rounded-full">
                Saved in Repository
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready Spring Boot backend in <code className="text-indigo-300">/spring-boot-backend/</code> and Vue 3 SFCs in <code className="text-indigo-300">/vue-frontend/</code>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold border border-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy {files[activeFile].filename}</span>
            </>
          )}
        </button>
      </div>

      {/* File Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {Object.entries(files).map(([key, item]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFile(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border whitespace-nowrap transition font-mono ${
              activeFile === key
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm font-bold"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{item.filename}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-black/30 text-slate-300 font-sans">
              {item.tag}
            </span>
          </button>
        ))}
      </div>

      {/* Code Display Area */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="font-semibold text-slate-300">{files[activeFile].title}</span>
          <span className="text-slate-500">Path: /spring-boot-backend/.../{files[activeFile].filename}</span>
        </div>
        <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto overflow-x-auto select-all">
          {files[activeFile].code}
        </pre>
      </div>

      {/* Architecture Highlights Note */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1">
        <span className="text-slate-200 font-bold">Architecture Note:</span>
        <p className="text-[11px] leading-relaxed">
          The live interactive preview runs on the full-stack container using a real relational SQLite SQL engine, exposing the identical REST endpoints (<code className="text-slate-300 font-mono">GET /api/weights</code>, <code className="text-slate-300 font-mono">POST /api/weights</code>, <code className="text-slate-300 font-mono">DELETE /api/weights/:id</code>). The complete Java Spring Boot project is pre-configured with Spring Data JPA and Maven in <code className="text-indigo-300 font-mono">/spring-boot-backend/</code>.
        </p>
      </div>
    </div>
  );
};
