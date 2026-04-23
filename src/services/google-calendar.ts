/**
 * Google Calendar service — OAuth 2.0 gated.
 * Requires user to be signed in with Google (calendar.events scope).
 * Falls back to ICS download for unauthenticated users.
 */

import { google } from "googleapis";
import { ElectionDeadline, CalendarEvent, ApiResult } from "@/types";
import { format, addDays } from "date-fns";

// ─── ICS Generator (no auth required) ────────────────────────────────────────
function escapeICS(str: string): string {
  return str.replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");
}

function toICSDate(iso: string): string {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generate an ICS file content string for download (no OAuth needed).
 */
export function generateICS(deadlines: ElectionDeadline[]): string {
  const events = deadlines
    .map((d) => {
      const start = toICSDate(new Date(d.date).toISOString());
      const end = toICSDate(new Date(new Date(d.date).getTime() + 3600000).toISOString());
      return [
        "BEGIN:VEVENT",
        `UID:election-${d.id}@election-assistant`,
        `DTSTAMP:${toICSDate(new Date().toISOString())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeICS(d.title)}`,
        `DESCRIPTION:${escapeICS(d.description)}`,
        d.url ? `URL:${d.url}` : "",
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:Reminder: ${escapeICS(d.title)} in 7 days`,
        "END:VALARM",
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:Tomorrow: ${escapeICS(d.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Election Assistant//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Election Deadlines`,
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}

// ─── Google Calendar API (OAuth) ──────────────────────────────────────────────
export class GoogleCalendarService {
  /**
   * Create a single calendar event using the user's OAuth access token.
   */
  async createElectionReminder(
    deadline: ElectionDeadline,
    accessToken: string
  ): Promise<ApiResult<CalendarEvent>> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: "v3", auth });

      const startDate = new Date(deadline.date);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: `🗳️ ${deadline.title}`,
          description: `${deadline.description}\n\nAdded by Election Process Assistant`,
          start: { dateTime: startDate.toISOString(), timeZone: "America/New_York" },
          end: { dateTime: endDate.toISOString(), timeZone: "America/New_York" },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 7 * 24 * 60 }, // 1 week
              { method: "email", minutes: 7 * 24 * 60 }, // 1 week email
              { method: "popup", minutes: 24 * 60 },     // 1 day
              { method: "popup", minutes: 60 },           // 1 hour
            ],
          },
          source: {
            title: "Election Process Assistant",
            url: "http://localhost:3000/timeline",
          },
        },
      });

      return {
        ok: true,
        data: {
          id: event.data.id ?? undefined,
          title: event.data.summary ?? deadline.title,
          description: deadline.description,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          htmlLink: event.data.htmlLink ?? undefined,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Calendar API error: ${msg}`, code: 500 };
    }
  }

  /**
   * Bulk import all election timeline events.
   */
  async importElectionTimeline(
    events: ElectionDeadline[],
    accessToken: string
  ): Promise<ApiResult<CalendarEvent[]>> {
    const results: CalendarEvent[] = [];
    const errors: string[] = [];

    for (const deadline of events) {
      const result = await this.createElectionReminder(deadline, accessToken);
      if (result.ok) {
        results.push(result.data);
      } else {
        errors.push(`${deadline.title}: ${result.error}`);
      }
    }

    if (errors.length === events.length) {
      return { ok: false, error: errors.join("; "), code: 500 };
    }

    return { ok: true, data: results };
  }
}

export const calendarService = new GoogleCalendarService();
