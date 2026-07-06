import type { TFunction } from "i18next";
import type { EventStatus } from "ics";

import type { CalendarEvent } from "@calcom/types/Calendar";

import generateIcsString from "./generateIcsString";

export enum GenerateIcsRole {
  ATTENDEE = "attendee",
  ORGANIZER = "organizer",
}

export default function generateIcsFile({
  calEvent,
  role,
  status,
  t,
}: {
  calEvent: CalendarEvent;
  role: GenerateIcsRole;
  status: EventStatus;
  t?: TFunction;
}) {
  // When the organizer has a connected destination calendar, the event is created there
  // directly via the provider API. Emailing an ICS on top of that duplicates the event in
  // mail clients that auto-ingest calendar attachments (e.g. Zoho Mail, O365), since the
  // emailed ICS's UID doesn't match the UID of the event created through the provider API.
  if (role !== GenerateIcsRole.ATTENDEE && calEvent.destinationCalendar?.[0]) return null;

  return {
    filename: "event.ics",
    content: generateIcsString({
      event: calEvent,
      status,
      t,
    }),
    method: status === "CANCELLED" ? "CANCEL" : "REQUEST",
  };
}
