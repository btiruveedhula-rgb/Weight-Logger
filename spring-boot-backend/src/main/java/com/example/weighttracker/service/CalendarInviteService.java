package com.example.weighttracker.service;

import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CalendarInviteService {

    private static final DateTimeFormatter CALENDAR_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");

    /**
     * Generates a direct 1-click Google Calendar Web URL pre-filled for 1 week after weigh-in.
     */
    public String generateGoogleCalendarUrl(LocalDateTime reminderTime, Double weight, String unit) {
        LocalDateTime endTime = reminderTime.plusMinutes(15);
        String startStr = reminderTime.format(CALENDAR_DATE_FORMAT);
        String endStr = endTime.format(CALENDAR_DATE_FORMAT);

        String title = "⚖️ Weekly Body Weight Check-in";
        String details = "Time for your weekly body weight check-in! Consistent weekly tracking ensures sustainable progress.\n"
                + "Previous logged weight: " + weight + " " + unit + "\n"
                + "Tip: Weigh yourself first thing in the morning under standard conditions.";
        String location = "Home Scale";

        try {
            return "https://calendar.google.com/calendar/render?action=TEMPLATE"
                    + "&text=" + URLEncoder.encode(title, StandardCharsets.UTF_8)
                    + "&dates=" + startStr + "/" + endStr
                    + "&details=" + URLEncoder.encode(details, StandardCharsets.UTF_8)
                    + "&location=" + URLEncoder.encode(location, StandardCharsets.UTF_8)
                    + "&recur=" + URLEncoder.encode("RRULE:FREQ=WEEKLY;INTERVAL=1", StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "https://calendar.google.com/calendar";
        }
    }

    /**
     * Generates standard RFC 5545 iCalendar (.ics) string for Apple, Outlook, or Google Calendar imports.
     */
    public String generateIcsFileContent(Long id, LocalDateTime reminderTime, Double weight, String unit) {
        LocalDateTime endTime = reminderTime.plusMinutes(15);
        String startStr = reminderTime.format(CALENDAR_DATE_FORMAT);
        String endStr = endTime.format(CALENDAR_DATE_FORMAT);
        String nowStr = LocalDateTime.now().format(CALENDAR_DATE_FORMAT);

        return "BEGIN:VCALENDAR\r\n"
                + "VERSION:2.0\r\n"
                + "PRODID:-//Weight Tracker Spring Boot//EN\r\n"
                + "CALSCALE:GREGORIAN\r\n"
                + "METHOD:REQUEST\r\n"
                + "BEGIN:VEVENT\r\n"
                + "UID:weight-reminder-" + id + "-" + System.currentTimeMillis() + "@weighttracker.app\r\n"
                + "DTSTAMP:" + nowStr + "\r\n"
                + "DTSTART:" + startStr + "\r\n"
                + "DTEND:" + endStr + "\r\n"
                + "SUMMARY:⚖️ Weekly Body Weight Check-in\r\n"
                + "DESCRIPTION:Time for your weekly body weight check-in! Previous weight: " + weight + " " + unit + ". Weekly weigh-ins build sustainable habits.\r\n"
                + "LOCATION:Home Scale\r\n"
                + "STATUS:CONFIRMED\r\n"
                + "RRULE:FREQ=WEEKLY;INTERVAL=1\r\n"
                + "BEGIN:VALARM\r\n"
                + "TRIGGER:-PT15M\r\n"
                + "ACTION:DISPLAY\r\n"
                + "DESCRIPTION:Time to log your body weight\r\n"
                + "END:VALARM\r\n"
                + "END:VEVENT\r\n"
                + "END:VCALENDAR\r\n";
    }
}
