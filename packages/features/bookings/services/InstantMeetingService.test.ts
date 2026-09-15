import { DailyLocationType } from "@calcom/app-store/constants";
import type { TFunction } from "i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IInstantMeetingServiceDeps } from "./InstantMeetingService";
import {
  INSTANT_MEETING_EVENT_TYPE_SLUG,
  INSTANT_MEETING_LENGTH_MINUTES,
  InstantMeetingService,
} from "./InstantMeetingService";

const { createMeetingWithCalVideo } = vi.hoisted(() => ({ createMeetingWithCalVideo: vi.fn() }));

vi.mock("@calcom/features/conferencing/lib/videoClient", () => ({ createMeetingWithCalVideo }));
vi.mock("@calcom/lib/constants", () => ({ WEBAPP_URL: "https://cal.example.com" }));

const host = {
  id: 7,
  name: "Ronnie",
  email: "ronnie@example.com",
  username: "ronnie",
  timeZone: "America/New_York",
  locale: "en",
  profileId: null,
};

const now = new Date("2026-09-15T14:00:00.000Z");
const t = vi.fn((key: string) => key) as unknown as TFunction;

const dailyRoom = {
  type: "daily_video",
  id: "room-abc",
  password: "owner-token",
  url: "https://ronnie.daily.co/room-abc",
};

describe("InstantMeetingService", () => {
  let deps: {
    eventTypeRepository: {
      findFirstEventTypeId: ReturnType<typeof vi.fn>;
      createWithLocations: ReturnType<typeof vi.fn>;
    };
    bookingRepository: { createWithReferences: ReturnType<typeof vi.fn> };
  };
  let service: InstantMeetingService;

  beforeEach(() => {
    vi.clearAllMocks();
    deps = {
      eventTypeRepository: {
        findFirstEventTypeId: vi.fn().mockResolvedValue({ id: 42 }),
        createWithLocations: vi.fn().mockResolvedValue({ id: 99 }),
      },
      bookingRepository: {
        createWithReferences: vi.fn().mockImplementation(async ({ uid }) => ({ uid })),
      },
    };
    createMeetingWithCalVideo.mockResolvedValue(dailyRoom);
    service = new InstantMeetingService(deps as unknown as IInstantMeetingServiceDeps);
  });

  it("creates a hidden Cal Video event type on first use", async () => {
    deps.eventTypeRepository.findFirstEventTypeId.mockResolvedValue(null);

    await service.start({ host, title: "Instant meeting", t, now });

    expect(deps.eventTypeRepository.findFirstEventTypeId).toHaveBeenCalledWith({
      slug: INSTANT_MEETING_EVENT_TYPE_SLUG,
      userId: host.id,
    });
    expect(deps.eventTypeRepository.createWithLocations).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Instant meeting",
        slug: INSTANT_MEETING_EVENT_TYPE_SLUG,
        length: INSTANT_MEETING_LENGTH_MINUTES,
        hidden: true,
        userId: host.id,
        profileId: null,
        locations: [{ type: DailyLocationType }],
      })
    );
    expect(deps.bookingRepository.createWithReferences).toHaveBeenCalledWith(
      expect.objectContaining({ eventTypeId: 99 })
    );
  });

  it("reuses the existing event type on later clicks", async () => {
    await service.start({ host, title: "Instant meeting", t, now });

    expect(deps.eventTypeRepository.createWithLocations).not.toHaveBeenCalled();
    expect(deps.bookingRepository.createWithReferences).toHaveBeenCalledWith(
      expect.objectContaining({ eventTypeId: 42 })
    );
  });

  it("creates the room for the host with the booking uid and end time", async () => {
    await service.start({ host, title: "Instant meeting", t, now });

    const [calEvent] = createMeetingWithCalVideo.mock.calls[0];
    const [booking] = deps.bookingRepository.createWithReferences.mock.calls[0];
    expect(calEvent.uid).toBe(booking.uid);
    expect(calEvent.organizer).toEqual(expect.objectContaining({ id: host.id, email: host.email }));
    expect(calEvent.startTime).toBe("2026-09-15T14:00:00.000Z");
    expect(calEvent.endTime).toBe("2026-09-15T15:00:00.000Z");
  });

  it("stores an accepted booking with the Daily room reference", async () => {
    const result = await service.start({ host, title: "Instant meeting", t, now });

    const [booking] = deps.bookingRepository.createWithReferences.mock.calls[0];
    expect(booking).toEqual(
      expect.objectContaining({
        title: "Instant meeting",
        status: "ACCEPTED",
        userId: host.id,
        userPrimaryEmail: host.email,
        startTime: now,
        endTime: new Date("2026-09-15T15:00:00.000Z"),
        location: DailyLocationType,
        responses: { name: host.name, email: host.email },
        metadata: { videoCallUrl: `https://cal.example.com/video/${booking.uid}` },
        references: [
          {
            type: "daily_video",
            uid: "room-abc",
            meetingId: "room-abc",
            meetingPassword: "owner-token",
            meetingUrl: "https://ronnie.daily.co/room-abc",
          },
        ],
      })
    );
    expect(booking.uid).toEqual(expect.any(String));
    expect(result).toEqual({
      bookingUid: booking.uid,
      videoUrl: `https://cal.example.com/video/${booking.uid}`,
    });
  });

  it("creates no booking when the Daily room cannot be created", async () => {
    createMeetingWithCalVideo.mockResolvedValue(undefined);

    await expect(service.start({ host, title: "Instant meeting", t, now })).rejects.toThrow(
      /Unable to start instant meeting/
    );
    expect(deps.bookingRepository.createWithReferences).not.toHaveBeenCalled();
  });
});
