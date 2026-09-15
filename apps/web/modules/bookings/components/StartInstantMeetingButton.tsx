"use client";

import { useCopy } from "@calcom/lib/hooks/useCopy";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { showToast } from "@calcom/ui/components/toast";
import { useRouter } from "next/navigation";

export function StartInstantMeetingButton() {
  const { t } = useLocale();
  const router = useRouter();
  const { fetchAndCopyToClipboard } = useCopy();
  const mutation = trpc.viewer.bookings.startInstantMeeting.useMutation();

  const startMeeting = () => {
    const meeting = mutation.mutateAsync();

    // The copy is started synchronously with the click so Safari keeps the user-gesture
    // permission while the room is still being created.
    fetchAndCopyToClipboard(meeting.then(({ videoUrl }) => videoUrl));

    meeting
      .then(({ bookingUid }) => {
        showToast(t("instant_meeting_link_copied"), "success");
        router.push(`/video/${bookingUid}`);
      })
      .catch(() => {
        showToast(t("instant_meeting_failed"), "error");
      });
  };

  return (
    <Button
      data-testid="start-instant-meeting"
      StartIcon="video"
      loading={mutation.isPending}
      disabled={mutation.isPending}
      onClick={startMeeting}>
      {t("start_meeting_now")}
    </Button>
  );
}
