import { describe, expect, it } from "vitest";
import { RONNIEDUKE_VIDEO_BRANDING, resolveVideoBranding } from "./resolveVideoBranding";

const TRAILSPARK_ENV = {
  NEXT_PUBLIC_CAL_VIDEO_BRAND_ACCENT: "#D33000",
  NEXT_PUBLIC_CAL_VIDEO_BRAND_BG: "#1A1C1F",
  NEXT_PUBLIC_CAL_VIDEO_BRAND_BG_ACCENT: "#24262A",
  NEXT_PUBLIC_CAL_VIDEO_BRAND_TEXT: "#F2F3F5",
  NEXT_PUBLIC_CAL_VIDEO_BRAND_TEXT_MUTED: "#858892",
  NEXT_PUBLIC_CAL_VIDEO_BRAND_BORDER: "#33363B",
  NEXT_PUBLIC_CAL_VIDEO_LOGO_URL: "/trailspark-logo-white-word.png",
  NEXT_PUBLIC_CAL_VIDEO_LOGO_ALT: "Trailspark",
  NEXT_PUBLIC_CAL_VIDEO_BACKGROUND_URL: "/trailspark-video-bg.jpg",
};

describe("resolveVideoBranding", () => {
  it("falls back to the ronnieduke.com branding for an empty environment", () => {
    expect(resolveVideoBranding({})).toEqual(RONNIEDUKE_VIDEO_BRANDING);
  });

  it("expands the six brand colours across all ten Daily theme keys", () => {
    expect(resolveVideoBranding(TRAILSPARK_ENV).theme.colors).toEqual({
      accent: "#D33000",
      accentText: "#F2F3F5",
      background: "#1A1C1F",
      backgroundAccent: "#24262A",
      baseText: "#F2F3F5",
      border: "#33363B",
      mainAreaBg: "#1A1C1F",
      mainAreaBgAccent: "#24262A",
      mainAreaText: "#F2F3F5",
      supportiveText: "#858892",
    });
  });

  it("overrides individual colours without disturbing the rest", () => {
    const { colors } = resolveVideoBranding({ NEXT_PUBLIC_CAL_VIDEO_BRAND_ACCENT: "#D33000" }).theme;
    expect(colors.accent).toBe("#D33000");
    expect(colors.background).toBe(RONNIEDUKE_VIDEO_BRANDING.theme.colors.background);
  });

  it("accepts lowercase and mixed-case hex", () => {
    expect(resolveVideoBranding({ NEXT_PUBLIC_CAL_VIDEO_BRAND_ACCENT: "#d33000" }).theme.colors.accent).toBe(
      "#d33000"
    );
  });

  // A malformed colour must not reach Daily: an invalid theme value throws inside the
  // iframe and takes the whole call page down, so a typo should cost branding, not the call.
  it.each([
    "D33000",
    "#D330",
    "#GGGGGG",
    "red",
    "#D33000; background:url(x)",
    "",
    undefined,
  ])("ignores the malformed colour %j and keeps the default", (value) => {
    expect(resolveVideoBranding({ NEXT_PUBLIC_CAL_VIDEO_BRAND_ACCENT: value }).theme.colors.accent).toBe(
      RONNIEDUKE_VIDEO_BRANDING.theme.colors.accent
    );
  });

  it("uses the configured logo and alt text", () => {
    const branding = resolveVideoBranding(TRAILSPARK_ENV);
    expect(branding.logoUrl).toBe("/trailspark-logo-white-word.png");
    expect(branding.logoAlt).toBe("Trailspark");
  });

  // The logo path is interpolated into an <img src>, so only same-origin absolute paths
  // are allowed; anything else could point the call page at a third-party host.
  it.each([
    "https://evil.example.com/logo.png",
    "//evil.example.com/logo.png",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    "trailspark-logo.png",
    "",
  ])("rejects the unsafe logo url %j and keeps the default", (value) => {
    expect(resolveVideoBranding({ NEXT_PUBLIC_CAL_VIDEO_LOGO_URL: value }).logoUrl).toBe(
      RONNIEDUKE_VIDEO_BRANDING.logoUrl
    );
  });

  it("returns no background image unless one is configured", () => {
    expect(resolveVideoBranding({}).backgroundUrl).toBeNull();
  });

  it("uses the configured background image", () => {
    expect(resolveVideoBranding(TRAILSPARK_ENV).backgroundUrl).toBe("/trailspark-video-bg.jpg");
  });

  it("rejects an unsafe background image url", () => {
    expect(
      resolveVideoBranding({ NEXT_PUBLIC_CAL_VIDEO_BACKGROUND_URL: "https://evil.example.com/bg.jpg" })
        .backgroundUrl
    ).toBeNull();
  });

  it("resolves the full Trailspark brand from its documented configuration", () => {
    expect(resolveVideoBranding(TRAILSPARK_ENV)).toEqual({
      theme: {
        colors: {
          accent: "#D33000",
          accentText: "#F2F3F5",
          background: "#1A1C1F",
          backgroundAccent: "#24262A",
          baseText: "#F2F3F5",
          border: "#33363B",
          mainAreaBg: "#1A1C1F",
          mainAreaBgAccent: "#24262A",
          mainAreaText: "#F2F3F5",
          supportiveText: "#858892",
        },
      },
      logoUrl: "/trailspark-logo-white-word.png",
      logoAlt: "Trailspark",
      backgroundUrl: "/trailspark-video-bg.jpg",
    });
  });
});
