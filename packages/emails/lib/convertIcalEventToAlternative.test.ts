import { describe, expect, it } from "vitest";
import { convertIcalEventToAlternative } from "./convertIcalEventToAlternative";

const ICS_CONTENT = "BEGIN:VCALENDAR\nEND:VCALENDAR";

describe("convertIcalEventToAlternative", () => {
  it("converts a REQUEST icalEvent into a single text/calendar alternative and drops icalEvent", () => {
    const result = convertIcalEventToAlternative({
      to: "attendee@example.com",
      icalEvent: { filename: "event.ics", content: ICS_CONTENT, method: "REQUEST" },
    });

    expect(result.icalEvent).toBeUndefined();
    expect(result.alternatives).toEqual([
      { contentType: 'text/calendar; charset="utf-8"; method=REQUEST', content: ICS_CONTENT },
    ]);
  });

  it("uses method=CANCEL in the contentType for cancelled events", () => {
    const result = convertIcalEventToAlternative({
      icalEvent: { filename: "event.ics", content: ICS_CONTENT, method: "CANCEL" },
    });

    expect(result.alternatives).toEqual([
      { contentType: 'text/calendar; charset="utf-8"; method=CANCEL', content: ICS_CONTENT },
    ]);
  });

  it("uppercases a lowercase method", () => {
    const result = convertIcalEventToAlternative({
      icalEvent: { content: ICS_CONTENT, method: "cancel" },
    });

    expect(result.alternatives).toEqual([
      { contentType: 'text/calendar; charset="utf-8"; method=CANCEL', content: ICS_CONTENT },
    ]);
  });

  it("defaults to method=REQUEST when method is missing", () => {
    const result = convertIcalEventToAlternative({
      icalEvent: { content: ICS_CONTENT },
    });

    expect(result.alternatives).toEqual([
      { contentType: 'text/calendar; charset="utf-8"; method=REQUEST', content: ICS_CONTENT },
    ]);
  });

  it("strips a null icalEvent without adding alternatives", () => {
    const result = convertIcalEventToAlternative({
      to: "attendee@example.com",
      icalEvent: null,
    });

    expect(result.icalEvent).toBeUndefined();
    expect(result.alternatives).toBeUndefined();
    expect(result.to).toBe("attendee@example.com");
  });

  it("strips an icalEvent with undefined content without adding alternatives", () => {
    const result = convertIcalEventToAlternative({
      icalEvent: { filename: "event.ics", content: undefined, method: "REQUEST" },
    });

    expect(result.icalEvent).toBeUndefined();
    expect(result.alternatives).toBeUndefined();
  });

  it("strips an icalEvent with empty-string content without adding alternatives", () => {
    const result = convertIcalEventToAlternative({
      icalEvent: { content: "", method: "REQUEST" },
    });

    expect(result.icalEvent).toBeUndefined();
    expect(result.alternatives).toBeUndefined();
  });

  it("appends to pre-existing alternatives rather than replacing them", () => {
    const existing = { contentType: "text/plain", content: "hi" };
    const result = convertIcalEventToAlternative({
      alternatives: [existing],
      icalEvent: { content: ICS_CONTENT, method: "REQUEST" },
    });

    expect(result.alternatives).toEqual([
      existing,
      { contentType: 'text/calendar; charset="utf-8"; method=REQUEST', content: ICS_CONTENT },
    ]);
  });

  it("does not mutate the input payload", () => {
    const input = {
      to: "attendee@example.com",
      icalEvent: { content: ICS_CONTENT, method: "REQUEST" },
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    convertIcalEventToAlternative(input);

    expect(input).toEqual(snapshot);
    expect(input.icalEvent).toBeDefined();
  });

  it("passes through other payload fields untouched", () => {
    const result = convertIcalEventToAlternative({
      to: "attendee@example.com",
      from: "Cal.com <notifications@example.com>",
      subject: "Your booking is confirmed",
      html: "<p>hello</p>",
      text: "hello",
      icalEvent: { content: ICS_CONTENT, method: "REQUEST" },
    });

    expect(result.to).toBe("attendee@example.com");
    expect(result.from).toBe("Cal.com <notifications@example.com>");
    expect(result.subject).toBe("Your booking is confirmed");
    expect(result.html).toBe("<p>hello</p>");
    expect(result.text).toBe("hello");
  });
});
