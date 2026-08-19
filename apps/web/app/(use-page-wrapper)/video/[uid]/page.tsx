// biome-ignore-all lint/correctness/noProcessGlobal: the autofix adds `node:process`,
// which does not exist in the Edge runtime and breaks the production build. Bare
// process.env works in both runtimes.

import { resolveRecordingMode } from "@calcom/app-store/dailyvideo/lib/resolveRecordingMode";
import { APP_NAME, SEO_IMG_OGIMG_VIDEO, WEBSITE_URL } from "@calcom/lib/constants";
import { buildLegacyCtx } from "@lib/buildLegacyCtx";
import { getServerSideProps } from "@lib/video/[uid]/getServerSideProps";
import { resolveVideoBranding } from "@lib/video/resolveVideoBranding";
import type { PageProps as ServerPageProps } from "app/_types";
import { getTranslate } from "app/_utils";
import { withAppDirSsr } from "app/WithAppDirSsr";
import { cookies, headers } from "next/headers";
import type { PageProps as ClientPageProps } from "~/videos/views/videos-single-view";
import VideosSingleView from "~/videos/views/videos-single-view";

export const generateMetadata = async () => {
  const t = await getTranslate();
  return {
    title: `${APP_NAME} Video`,
    description: t("quick_video_meeting"),
    openGraph: {
      title: `${APP_NAME} Video`,
      description: t("quick_video_meeting"),
      url: `${WEBSITE_URL}/video`,
      images: [
        {
          url: SEO_IMG_OGIMG_VIDEO,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${APP_NAME} Video`,
      description: t("quick_video_meeting"),
      images: [SEO_IMG_OGIMG_VIDEO],
    },
  };
};

const getData = withAppDirSsr<Omit<ClientPageProps, "videoBranding" | "recordingType">>(getServerSideProps);

const ServerPage = async ({ params, searchParams }: ServerPageProps) => {
  const context = buildLegacyCtx(await headers(), await cookies(), await params, await searchParams);

  const props = await getData(context);

  // Resolved here rather than in getServerSideProps: that function is bundled into the
  // client-component SSR graph, where process.env reads do not see the runtime
  // environment. This server component does, so env-driven config must be read here.
  return (
    <VideosSingleView
      {...props}
      videoBranding={resolveVideoBranding(process.env)}
      recordingType={resolveRecordingMode("cloud", process.env) ?? "cloud"}
    />
  );
};

export default ServerPage;
