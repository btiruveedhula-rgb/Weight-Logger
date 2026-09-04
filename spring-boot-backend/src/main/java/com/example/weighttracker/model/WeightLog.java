package com.example.weighttracker.model;

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
    @DecimalMin(value = "1.0", message = "Weight must be positive")
    @Column(nullable = false)
    private Double weight;

    @Column(nullable = false, length = 10)
    private String unit = "kg"; // 'kg' or 'lbs'

    @NotNull(message = "Logged date time is required")
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

    public WeightLog(Double weight, String unit, LocalDateTime loggedAt, String notes) {
        this.weight = weight;
        this.unit = unit != null ? unit : "kg";
        this.loggedAt = loggedAt != null ? loggedAt : LocalDateTime.now();
        // Set reminder exactly 1 week (7 days) later
        this.reminderDate = this.loggedAt.plusDays(7);
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public LocalDateTime getLoggedAt() { return loggedAt; }
    public void setLoggedAt(LocalDateTime loggedAt) { this.loggedAt = loggedAt; }

    public LocalDateTime getReminderDate() { return reminderDate; }
    public void setReminderDate(LocalDateTime reminderDate) { this.reminderDate = reminderDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getGoogleCalendarUrl() { return googleCalendarUrl; }
    public void setGoogleCalendarUrl(String googleCalendarUrl) { this.googleCalendarUrl = googleCalendarUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
