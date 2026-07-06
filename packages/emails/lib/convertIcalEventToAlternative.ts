// nodemailer's mail-composer embeds an `icalEvent` payload twice: once as a
// `text/calendar` alternative part and once as an `application/ics` attachment.
// Gmail can materialize a calendar event from each, producing duplicate entries.
// Sending the ICS only as a `text/calendar` alternative keeps it to a single,
// standards-based invitation part.

const DEFAULT_METHOD = "REQUEST";

interface IcalEventPayload {
  content: string;
  method?: unknown;
}

interface IcalAlternative {
  contentType: string;
  content: string;
}

function hasIcalContent(value: unknown): value is IcalEventPayload {
  if (typeof value !== "object" || value === null) return false;
  const content = (value as { content?: unknown }).content;
  return typeof content === "string" && content.length > 0;
}

export function convertIcalEventToAlternative(payload: Record<string, unknown>): Record<string, unknown> {
  const { icalEvent, ...rest } = payload;

  if (!hasIcalContent(icalEvent)) {
    return rest;
  }

  const method = (typeof icalEvent.method === "string" ? icalEvent.method : DEFAULT_METHOD).toUpperCase();

  const existingAlternatives: IcalAlternative[] = Array.isArray(rest.alternatives) ? rest.alternatives : [];

  return {
    ...rest,
    alternatives: [
      ...existingAlternatives,
      {
        contentType: `text/calendar; charset="utf-8"; method=${method}`,
        content: icalEvent.content,
      },
    ],
  };
}
