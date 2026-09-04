import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import initSqlJs from "sql.js";

interface WeightRecord {
  id: number;
  weight: number;
  unit: string;
  logged_at: string;
  reminder_date: string;
  notes: string;
  google_calendar_url: string;
  created_at: string;
}

interface SqlQueryLog {
  id: string;
  timestamp: string;
  query: string;
  params?: any[];
  executionTimeMs: number;
  type: "CREATE" | "INSERT" | "SELECT" | "DELETE" | "SCHEMA";
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "weight_tracker.sqlite");

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// In-memory execution log for SQL inspector
const sqlQueryLogs: SqlQueryLog[] = [];

function recordSqlLog(type: SqlQueryLog["type"], query: string, params: any[] = [], timeMs = 1) {
  sqlQueryLogs.unshift({
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    query: query.trim().replace(/\s+/g, " "),
    params,
    executionTimeMs: timeMs,
    type,
  });
  if (sqlQueryLogs.length > 60) {
    sqlQueryLogs.pop();
  }
}

// Helper to format ISO to Google Calendar compact format (YYYYMMDDTHHmmssZ)
function formatGoogleCalendarDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? "0" + n : n.toString());
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

// Generate direct Google Calendar URL (1-click add to Google Calendar)
function generateGoogleCalendarUrl(reminderDate: Date, previousWeight: number, unit: string): string {
  const startDate = new Date(reminderDate);
  const endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // 15 mins event

  const title = "⚖️ Weekly Body Weight Check-in";
  const details =
    `Time for your weekly body weight check-in! Consistent weekly weigh-ins give accurate long-term trend lines.\n\n` +
    `Previous logged weight: ${previousWeight} ${unit}\n` +
    `Reminder: Weigh yourself first thing in the morning under similar conditions.`;
  const location = "Home Scale";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`,
    details: details,
    location: location,
    recur: "RRULE:FREQ=WEEKLY;INTERVAL=1", // Set up weekly recurrence so they keep the habit!
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate standard RFC 5545 .ics file for Apple, Google, or Outlook calendar
function generateIcsContent(reminderDate: Date, previousWeight: number, unit: string, id: number): string {
  const startDate = new Date(reminderDate);
  const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
  const startStr = formatGoogleCalendarDate(startDate);
  const endStr = formatGoogleCalendarDate(endDate);
  const nowStr = formatGoogleCalendarDate(new Date());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Weight Tracker App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:weight-reminder-${id}-${Date.now()}@weighttracker.local`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    "SUMMARY:⚖️ Weekly Body Weight Check-in",
    `DESCRIPTION:Time for your weekly body weight check-in! Previous logged weight: ${previousWeight} ${unit}. Weekly consistency builds sustainable health habits.`,
    "LOCATION:Home Scale",
    "STATUS:CONFIRMED",
    "RRULE:FREQ=WEEKLY;INTERVAL=1",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Time to log your body weight",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tomorrow is your weekly body weight check-in",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

async function startServer() {
  const SQL = await initSqlJs();
  let db: any;

  // Load existing DB or create new
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error("Failed to load SQLite DB from file, creating new", e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Initialize SQL schema
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      logged_at TEXT NOT NULL,
      reminder_date TEXT NOT NULL,
      notes TEXT,
      google_calendar_url TEXT,
      created_at TEXT NOT NULL
    );
  `;
  db.run(schemaSql);
  recordSqlLog("CREATE", schemaSql);

  const saveDbToDisk = () => {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (err) {
      console.error("Error saving SQLite database to disk:", err);
    }
  };

  // Seed sample initial records if empty so the user immediately sees a realistic trend
  const countResult = db.exec("SELECT COUNT(*) as count FROM weight_logs");
  const rowCount = countResult[0]?.values[0]?.[0] ?? 0;

  if (rowCount === 0) {
    const seedRecords = [
      {
        weight: 76.5,
        unit: "kg",
        daysAgo: 21,
        notes: "Starting weight tracking journey, morning fasted",
      },
      {
        weight: 75.8,
        unit: "kg",
        daysAgo: 14,
        notes: "Good hydration, weekly gym routine",
      },
      {
        weight: 75.2,
        unit: "kg",
        daysAgo: 7,
        notes: "Felt light, feeling good energy",
      },
    ];

    seedRecords.forEach((s) => {
      const logDate = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
      const reminderDate = new Date(logDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const calUrl = generateGoogleCalendarUrl(reminderDate, s.weight, s.unit);
      const stmt = `INSERT INTO weight_logs (weight, unit, logged_at, reminder_date, notes, google_calendar_url, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?);`;
      db.run(stmt, [
        s.weight,
        s.unit,
        logDate.toISOString(),
        reminderDate.toISOString(),
        s.notes,
        calUrl,
        logDate.toISOString(),
      ]);
    });
    saveDbToDisk();
    recordSqlLog("INSERT", "SEEDED 3 initial weight logs for historical trend visualization");
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  // 1. Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", engine: "SQLite via sql.js", timestamp: new Date().toISOString() });
  });

  // 2. Get all weight logs
  app.get("/api/weights", (_req, res) => {
    const start = Date.now();
    const query = `SELECT id, weight, unit, logged_at, reminder_date, notes, google_calendar_url, created_at 
                   FROM weight_logs 
                   ORDER BY logged_at DESC;`;
    const result = db.exec(query);
    recordSqlLog("SELECT", query, [], Date.now() - start);

    if (!result || result.length === 0) {
      return res.json([]);
    }

    const columns = result[0].columns;
    const rows = result[0].values.map((row: any[]) => {
      const item: any = {};
      columns.forEach((col: string, idx: number) => {
        item[col] = row[idx];
      });
      return item;
    });

    res.json(rows);
  });

  // 3. Add a new weight log + compute 1-week Google Calendar reminder
  app.post("/api/weights", (req, res) => {
    const { weight, unit = "kg", logged_at, notes, reminder_time = "09:00" } = req.body;

    if (!weight || isNaN(Number(weight))) {
      return res.status(400).json({ error: "Valid body weight is required" });
    }

    const numWeight = parseFloat(Number(weight).toFixed(2));
    const entryDate = logged_at ? new Date(logged_at) : new Date();

    // Calculate reminder date: EXACTLY 7 days (1 week) after entryDate
    const reminderDate = new Date(entryDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Apply preferred time if provided (HH:mm)
    if (typeof reminder_time === "string" && reminder_time.includes(":")) {
      const [hours, mins] = reminder_time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(mins)) {
        reminderDate.setHours(hours, mins, 0, 0);
      }
    }

    const googleCalendarUrl = generateGoogleCalendarUrl(reminderDate, numWeight, unit);
    const createdAt = new Date().toISOString();

    const start = Date.now();
    const insertSql = `
      INSERT INTO weight_logs (weight, unit, logged_at, reminder_date, notes, google_calendar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      numWeight,
      unit,
      entryDate.toISOString(),
      reminderDate.toISOString(),
      notes || null,
      googleCalendarUrl,
      createdAt,
    ];

    db.run(insertSql, params);
    saveDbToDisk();
    recordSqlLog("INSERT", insertSql, params, Date.now() - start);

    // Retrieve the inserted record
    const fetchSql = `SELECT * FROM weight_logs ORDER BY id DESC LIMIT 1;`;
    const newRowRes = db.exec(fetchSql);
    const columns = newRowRes[0]?.columns || [];
    const newRecord: any = {};
    if (newRowRes[0]?.values?.[0]) {
      columns.forEach((col: string, idx: number) => {
        newRecord[col] = newRowRes[0].values[0][idx];
      });
    }
    const newId = newRecord.id || 1;

    res.status(201).json({
      record: newRecord,
      calendar: {
        googleCalendarUrl,
        reminderDate: reminderDate.toISOString(),
        reminderText: `Reminder scheduled for ${reminderDate.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })} at ${reminderDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        icsDownloadUrl: `/api/weights/${newId}/ics`,
      },
    });
  });

  // 4. Download .ics iCalendar file for a weight entry
  app.get("/api/weights/:id/ics", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).send("Invalid ID");
    }
    const result = db.exec(`SELECT * FROM weight_logs WHERE id = ${id};`);

    if (!result || result.length === 0 || !result[0].values.length) {
      return res.status(404).send("Weight record not found");
    }

    const cols = result[0].columns;
    const row = result[0].values[0];
    const item: any = {};
    cols.forEach((col: string, i: number) => {
      item[col] = row[i];
    });

    const reminderDate = new Date(item.reminder_date);
    const icsContent = generateIcsContent(reminderDate, item.weight, item.unit, item.id);

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="weight-reminder-${id}.ics"`);
    res.send(icsContent);
  });

  // 5. Delete a weight log
  app.delete("/api/weights/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const start = Date.now();
    const deleteSql = "DELETE FROM weight_logs WHERE id = ?;";
    db.run(deleteSql, [id]);
    saveDbToDisk();
    recordSqlLog("DELETE", deleteSql, [id], Date.now() - start);

    res.json({ success: true, deletedId: id });
  });

  // 6. SQL Inspector & Logs endpoint
  app.get("/api/sql/logs", (_req, res) => {
    res.json({
      logs: sqlQueryLogs,
      schema: schemaSql.trim(),
    });
  });

  // 7. Aggregate stats endpoint using direct SQL expressions
  app.get("/api/stats", (_req, res) => {
    const start = Date.now();
    const statsSql = `
      SELECT 
        COUNT(*) as total_entries,
        MIN(weight) as min_weight,
        MAX(weight) as max_weight,
        AVG(weight) as avg_weight
      FROM weight_logs;
    `;
    const result = db.exec(statsSql);
    recordSqlLog("SELECT", statsSql, [], Date.now() - start);

    let stats = { total_entries: 0, min_weight: 0, max_weight: 0, avg_weight: 0 };
    if (result && result.length > 0 && result[0].values.length > 0) {
      const [total_entries, min_weight, max_weight, avg_weight] = result[0].values[0];
      stats = {
        total_entries: Number(total_entries || 0),
        min_weight: Number(min_weight || 0),
        max_weight: Number(max_weight || 0),
        avg_weight: Number((avg_weight || 0).toFixed(2)),
      };
    }

    // Get next upcoming reminder
    const nextReminderSql = `
      SELECT id, reminder_date, weight, unit 
      FROM weight_logs 
      ORDER BY logged_at DESC 
      LIMIT 1;
    `;
    const nextRes = db.exec(nextReminderSql);
    let nextReminder = null;
    if (nextRes && nextRes.length > 0 && nextRes[0].values.length > 0) {
      const [id, reminder_date, weight, unit] = nextRes[0].values[0];
      nextReminder = { id, reminder_date, weight, unit };
    }

    res.json({ stats, nextReminder });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
