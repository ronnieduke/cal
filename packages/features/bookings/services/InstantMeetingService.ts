import { DailyLocationType } from "@calcom/app-store/constants";
import type { BookingRepository } from "@calcom/features/bookings/repositories/BookingRepository";
import { createMeetingWithCalVideo } from "@calcom/features/conferencing/lib/videoClient";
import type { EventTypeRepository } from "@calcom/features/eventtypes/repositories/eventTypeRepository";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import type { TFunction } from "i18next";
import short from "short-uuid";

const translator = short();

export const INSTANT_MEETING_EVENT_TYPE_SLUG = "instant-cal-video";

// Nominal only: it sizes the booking in the list and blocks Cal availability. Daily never ejects
// participants when a room expires, so the call itself can run past this.
export const INSTANT_MEETING_LENGTH_MINUTES = 60;

export interface IInstantMeetingServiceDeps {
  bookingRepository: Pick<BookingRepository, "createWithReferences">;
  eventTypeRepository: Pick<EventTypeRepository, "findFirstEventTypeId" | "createWithLocations">;
}

export type InstantMeetingHost = {
  id: number;
  name: string | null;
  email: string;
  username: string | null;
  timeZone: string;
  locale: string | null;
  profileId: number | null;
};

export class InstantMeetingService {
  constructor(private readonly deps: IInstantMeetingServiceDeps) {}

  async start({
    host,
    title,
    t,
    now = new Date(),
  }: {
    host: InstantMeetingHost;
    title: string;
    t: TFunction;
    now?: Date;
  }) {
    const eventTypeId = await this.findOrCreateEventTypeId(host, title);

    const uid = translator.generate();
    const startTime = now;
    const endTime = new Date(now.getTime() + INSTANT_MEETING_LENGTH_MINUTES * 60 * 1000);
    const hostName = host.name ?? host.username ?? host.email;
    const organizer = {
      id: host.id,
      name: hostName,
      email: host.email,
      username: host.username ?? undefined,
      timeZone: host.timeZone,
      language: { translate: t, locale: host.locale ?? "en" },
    };

    // Goes through the same room builder as scheduled bookings so recording, transcription and
    // DAILY_RECORDING_MODE behave identically; the dedicated instant-room helper gates on different flags.
    const room = await createMeetingWithCalVideo({
      type: INSTANT_MEETING_EVENT_TYPE_SLUG,
      title,
      uid,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      organizer,
      attendees: [],
      location: DailyLocationType,
    });

    if (!room) {
      throw new ErrorWithCode(
        ErrorCode.InternalServerError,
        `Unable to start instant meeting for user ${host.id}: Cal Video room could not be created (are the Daily app keys set?)`
      );
    }

    const videoUrl = `${WEBAPP_URL}/video/${uid}`;

    await this.deps.bookingRepository.createWithReferences({
      uid,
      title,
      status: "ACCEPTED",
      userId: host.id,
      userPrimaryEmail: host.email,
      eventTypeId,
      startTime,
      endTime,
      location: DailyLocationType,
      responses: { name: hostName, email: host.email },
      metadata: { videoCallUrl: videoUrl },
      references: [
        {
          type: room.type,
          uid: room.id,
          meetingId: room.id,
          meetingPassword: room.password,
          meetingUrl: room.url,
        },
      ],
    });

    return { bookingUid: uid, videoUrl };
  }

  private async findOrCreateEventTypeId(host: InstantMeetingHost, title: string) {
    const existing = await this.deps.eventTypeRepository.findFirstEventTypeId({
      slug: INSTANT_MEETING_EVENT_TYPE_SLUG,
      userId: host.id,
    });
    if (existing) return existing.id;

    // Hidden so it never appears on the public booking page; it exists because the recording
    // webhook only sends transcript emails for bookings that have an event type.
    const created = await this.deps.eventTypeRepository.createWithLocations({
      title,
      slug: INSTANT_MEETING_EVENT_TYPE_SLUG,
      length: INSTANT_MEETING_LENGTH_MINUTES,
      hidden: true,
      userId: host.id,
      profileId: host.profileId,
      locations: [{ type: DailyLocationType }],
    });
    return created.id;
  }
}
