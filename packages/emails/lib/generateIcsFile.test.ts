import { buildCalendarEvent, buildPerson } from "@calcom/lib/test/builder";
import { test } from "@calcom/testing/lib/fixtures/fixtures";
import type { CalendarEvent } from "@calcom/types/Calendar";
import { describe, expect } from "vitest";
import generateIcsFile, { GenerateIcsRole } from "./generateIcsFile";

const buildDestinationCalendar = (integration: string) => ({
  id: 1,
  integration,
  externalId: "calendar-1",
  primaryEmail: null,
  userId: null,
  eventTypeId: null,
  credentialId: null,
  createdAt: null,
  updatedAt: null,
  delegationCredentialId: null,
  customCalendarReminder: null,
});

const buildEvent = (overrides?: Partial<CalendarEvent>) =>
  buildCalendarEvent({
    iCalSequence: 0,
    attendees: [buildPerson()],
    ...overrides,
  });

describe("generateIcsFile", () => {
  describe("organizer role with a connected destination calendar", () => {
    test("returns null when destination calendar is zoho_calendar", () => {
      const calEvent = buildEvent({
        destinationCalendar: [buildDestinationCalendar("zoho_calendar")],
      });

      const result = generateIcsFile({
        calEvent,
        role: GenerateIcsRole.ORGANIZER,
        status: "CONFIRMED",
      });

      expect(result).toBeNull();
    });

    test("returns null when destination calendar is google_calendar", () => {
      const calEvent = buildEvent({
        destinationCalendar: [buildDestinationCalendar("google_calendar")],
      });

      const result = generateIcsFile({
        calEvent,
        role: GenerateIcsRole.ORGANIZER,
        status: "CONFIRMED",
      });

      expect(result).toBeNull();
    });
  });

  describe("organizer role without a connected destination calendar", () => {
    test("returns the ICS file when destinationCalendar is undefined", () => {
      const calEvent = buildEvent({ destinationCalendar: undefined });

      const result = generateIcsFile({
        calEvent,
        role: GenerateIcsRole.ORGANIZER,
        status: "CONFIRMED",
      });

      expect(result).not.toBeNull();
      expect(result?.filename).toBe("event.ics");
      expect(typeof result?.content).toBe("string");
      expect(result?.method).toBe("REQUEST");
    });

    test("returns the ICS file when destinationCalendar is an empty array", () => {
      const calEvent = buildEvent({ destinationCalendar: [] });

      const result = generateIcsFile({
        calEvent,
        role: GenerateIcsRole.ORGANIZER,
        status: "CONFIRMED",
      });

      expect(result).not.toBeNull();
      expect(result?.filename).toBe("event.ics");
      expect(typeof result?.content).toBe("string");
      expect(result?.method).toBe("REQUEST");
    });
  });

  describe("attendee role", () => {
    test("still returns the ICS file even with a connected destination calendar", () => {
      const calEvent = buildEvent({
        destinationCalendar: [buildDestinationCalendar("zoho_calendar")],
      });

      const result = generateIcsFile({
        calEvent,
        role: GenerateIcsRole.ATTENDEE,
        status: "CONFIRMED",
      });

      expect(result).not.toBeNull();
      expect(result?.filename).toBe("event.ics");
      expect(typeof result?.content).toBe("string");
      expect(result?.method).toBe("REQUEST");
    });
  });

  describe("status CANCELLED", () => {
    test("uses the CANCEL method", () => {
      const calEvent = buildEvent({ destinationCalendar: undefined });

      const result = generateIcsFile({
        calEvent,
        role: GenerateIcsRole.ORGANIZER,
        status: "CANCELLED",
      });

      expect(result).not.toBeNull();
      expect(result?.method).toBe("CANCEL");
    });
  });
});
