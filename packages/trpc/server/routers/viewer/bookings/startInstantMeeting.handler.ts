import { getInstantMeetingService } from "@calcom/features/bookings/di/InstantMeetingService.container";
import { getTranslation } from "@calcom/i18n/server";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";

type StartInstantMeetingOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
};

export const startInstantMeetingHandler = async ({ ctx }: StartInstantMeetingOptions) => {
  const { user } = ctx;
  const t = await getTranslation(user.locale ?? "en", "common");

  return getInstantMeetingService().start({
    host: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      timeZone: user.timeZone,
      locale: user.locale,
      profileId: user.profile?.id ?? null,
    },
    title: t("instant_meeting_title"),
    t,
  });
};
