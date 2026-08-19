import { afterEach, describe, expect, it, vi } from "vitest";
import { RONNIEDUKE_VIDEO_BRANDING, resolveVideoBranding } from "./resolveVideoBranding";

describe("resolveVideoBranding", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the ronnieduke.com branding when nothing is configured", () => {
    expect(resolveVideoBranding()).toEqual(RONNIEDUKE_VIDEO_BRANDING);
  });

  it("expands the six brand colours across all ten Daily theme keys", () => {
    vi.stubEnv("CAL_VIDEO_BRAND_ACCENT", "#D33000");
    vi.stubEnv("CAL_VIDEO_BRAND_BG", "#1A1C1F");
    vi.stubEnv("CAL_VIDEO_BRAND_BG_ACCENT", "#24262A");
    vi.stubEnv("CAL_VIDEO_BRAND_TEXT", "#F2F3F5");
    vi.stubEnv("CAL_VIDEO_BRAND_TEXT_MUTED", "#858892");
    vi.stubEnv("CAL_VIDEO_BRAND_BORDER", "#33363B");

    expect(resolveVideoBranding().theme.colors).toEqual({
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
    vi.stubEnv("CAL_VIDEO_BRAND_ACCENT", "#D33000");

    const { colors } = resolveVideoBranding().theme;
    expect(colors.accent).toBe("#D33000");
    expect(colors.background).toBe(RONNIEDUKE_VIDEO_BRANDING.theme.colors.background);
  });

  it("accepts lowercase and mixed-case hex", () => {
    vi.stubEnv("CAL_VIDEO_BRAND_ACCENT", "#d33000");
    expect(resolveVideoBranding().theme.colors.accent).toBe("#d33000");
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
  ])("ignores the malformed colour %j and keeps the default", (value) => {
    vi.stubEnv("CAL_VIDEO_BRAND_ACCENT", value);
    expect(resolveVideoBranding().theme.colors.accent).toBe(RONNIEDUKE_VIDEO_BRANDING.theme.colors.accent);
  });

  it("uses the configured logo and alt text", () => {
    vi.stubEnv("CAL_VIDEO_LOGO_URL", "/trailspark-logo-white-word.png");
    vi.stubEnv("CAL_VIDEO_LOGO_ALT", "Trailspark");

    const branding = resolveVideoBranding();
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
    vi.stubEnv("CAL_VIDEO_LOGO_URL", value);
    expect(resolveVideoBranding().logoUrl).toBe(RONNIEDUKE_VIDEO_BRANDING.logoUrl);
  });

  it("returns no background image unless one is configured", () => {
    expect(resolveVideoBranding().backgroundUrl).toBeNull();
  });

  it("uses the configured background image", () => {
    vi.stubEnv("CAL_VIDEO_BACKGROUND_URL", "/trailspark-video-bg.jpg");
    expect(resolveVideoBranding().backgroundUrl).toBe("/trailspark-video-bg.jpg");
  });

  it("rejects an unsafe background image url", () => {
    vi.stubEnv("CAL_VIDEO_BACKGROUND_URL", "https://evil.example.com/bg.jpg");
    expect(resolveVideoBranding().backgroundUrl).toBeNull();
  });

  it("resolves the full Trailspark brand from its documented configuration", () => {
    vi.stubEnv("CAL_VIDEO_BRAND_ACCENT", "#D33000");
    vi.stubEnv("CAL_VIDEO_BRAND_BG", "#1A1C1F");
    vi.stubEnv("CAL_VIDEO_BRAND_BG_ACCENT", "#24262A");
    vi.stubEnv("CAL_VIDEO_BRAND_TEXT", "#F2F3F5");
    vi.stubEnv("CAL_VIDEO_BRAND_TEXT_MUTED", "#858892");
    vi.stubEnv("CAL_VIDEO_BRAND_BORDER", "#33363B");
    vi.stubEnv("CAL_VIDEO_LOGO_URL", "/trailspark-logo-white-word.png");
    vi.stubEnv("CAL_VIDEO_LOGO_ALT", "Trailspark");
    vi.stubEnv("CAL_VIDEO_BACKGROUND_URL", "/trailspark-video-bg.jpg");

    expect(resolveVideoBranding()).toEqual({
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
