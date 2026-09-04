package com.example.weighttracker.controller;

import com.example.weighttracker.model.WeightLog;
import com.example.weighttracker.repository.WeightLogRepository;
import com.example.weighttracker.service.CalendarInviteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weights")
@CrossOrigin(origins = "*") // Allows Vue.js client requests
public class WeightLogController {

    private final WeightLogRepository repository;
    private final CalendarInviteService calendarService;

    public WeightLogController(WeightLogRepository repository, CalendarInviteService calendarService) {
        this.repository = repository;
        this.calendarService = calendarService;
    }

    /**
     * GET /api/weights : List all body weight records (latest first)
     */
    @GetMapping
    public List<WeightLog> getAllLogs() {
        return repository.findAllByOrderByLoggedAtDesc();
    }

    /**
     * POST /api/weights : Log weight and schedule Google Calendar invite 1 week later
     */
    @PostMapping
    public ResponseEntity<?> createWeightLog(@Valid @RequestBody WeightLog logRequest) {
        if (logRequest.getLoggedAt() == null) {
            logRequest.setLoggedAt(LocalDateTime.now());
        }
        
        // Reminder is scheduled exactly 7 days after the log date
        LocalDateTime reminderDate = logRequest.getLoggedAt().plusDays(7);
        logRequest.setReminderDate(reminderDate);

        // Generate the 1-click Google Calendar invite URL
        String calendarUrl = calendarService.generateGoogleCalendarUrl(
                reminderDate,
                logRequest.getWeight(),
                logRequest.getUnit()
        );
        logRequest.setGoogleCalendarUrl(calendarUrl);
        logRequest.setCreatedAt(LocalDateTime.now());

        // Save into SQL Database via JPA
        WeightLog savedLog = repository.save(logRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("record", savedLog);

        Map<String, Object> calendarInfo = new HashMap<>();
        calendarInfo.put("googleCalendarUrl", calendarUrl);
        calendarInfo.put("reminderDate", reminderDate);
        calendarInfo.put("icsDownloadUrl", "/api/weights/" + savedLog.getId() + "/ics");
        calendarInfo.put("message", "Weigh-in recorded! Google Calendar invite ready for next week.");
        response.put("calendar", calendarInfo);

        return ResponseEntity.created(URI.create("/api/weights/" + savedLog.getId())).body(response);
    }

    /**
     * GET /api/weights/{id}/ics : Download standard .ics file for calendar sync
     */
    @GetMapping("/{id}/ics")
    public ResponseEntity<byte[]> downloadIcsFile(@PathVariable Long id) {
        return repository.findById(id).map(log -> {
            String icsData = calendarService.generateIcsFileContent(
                    log.getId(),
                    log.getReminderDate(),
                    log.getWeight(),
                    log.getUnit()
            );
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"weigh-in-reminder-" + id + ".ics\"")
                    .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
                    .body(icsData.getBytes());
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/weights/{id} : Delete weight entry
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLog(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "deletedId", id));
        }
        return ResponseEntity.notFound().build();
    }
}
