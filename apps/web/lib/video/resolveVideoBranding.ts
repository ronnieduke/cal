export type CalVideoThemeColors = {
  accent: string;
  accentText: string;
  background: string;
  backgroundAccent: string;
  baseText: string;
  border: string;
  mainAreaBg: string;
  mainAreaBgAccent: string;
  mainAreaText: string;
  supportiveText: string;
};

export type CalVideoBranding = {
  theme: { colors: CalVideoThemeColors };
  logoUrl: string;
  logoAlt: string;
  backgroundUrl: string | null;
};

type BrandPalette = {
  accent: string;
  background: string;
  backgroundAccent: string;
  text: string;
  textMuted: string;
  border: string;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Daily exposes ten theme slots but a brand only needs six decisions, so the palette is
 * expanded rather than configured slot by slot.
 */
function toThemeColors(palette: BrandPalette): CalVideoThemeColors {
  return {
    accent: palette.accent,
    accentText: palette.text,
    background: palette.background,
    backgroundAccent: palette.backgroundAccent,
    baseText: palette.text,
    border: palette.border,
    mainAreaBg: palette.background,
    mainAreaBgAccent: palette.backgroundAccent,
    mainAreaText: palette.text,
    supportiveText: palette.textMuted,
  };
}

const RONNIEDUKE_PALETTE: BrandPalette = {
  accent: "#6B8F7B",
  background: "#1A1A1A",
  backgroundAccent: "#26221E",
  text: "#F5F1EB",
  textMuted: "#C9BFB2",
  border: "#3A342C",
};

export const RONNIEDUKE_VIDEO_BRANDING: CalVideoBranding = {
  theme: { colors: toThemeColors(RONNIEDUKE_PALETTE) },
  logoUrl: "/ronnieduke-video-logo.svg",
  logoAlt: "Ronnie Duke",
  backgroundUrl: null,
};

/**
 * Daily throws on a malformed theme value and takes the whole call page down with it,
 * so a typo in the deploy config costs branding rather than the meeting.
 */
function color(value: string | undefined, fallback: string): string {
  return value && HEX_COLOR.test(value) ? value : fallback;
}

/**
 * Asset paths are interpolated into an <img src>, so only same-origin absolute paths are
 * accepted. This rejects absolute URLs, protocol-relative URLs and javascript:/data: URIs,
 * none of which should be able to redirect the call page at a third-party host.
 */
function assetPath(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * Branding is read at request time rather than through NEXT_PUBLIC_* build-time inlining so
 * that one image can serve several branded domains — the deployments differ only by env.
 */
export function resolveVideoBranding(): CalVideoBranding {
  const fallback = RONNIEDUKE_VIDEO_BRANDING;

  return {
    theme: {
      colors: toThemeColors({
        accent: color(process.env.CAL_VIDEO_BRAND_ACCENT, RONNIEDUKE_PALETTE.accent),
        background: color(process.env.CAL_VIDEO_BRAND_BG, RONNIEDUKE_PALETTE.background),
        backgroundAccent: color(process.env.CAL_VIDEO_BRAND_BG_ACCENT, RONNIEDUKE_PALETTE.backgroundAccent),
        text: color(process.env.CAL_VIDEO_BRAND_TEXT, RONNIEDUKE_PALETTE.text),
        textMuted: color(process.env.CAL_VIDEO_BRAND_TEXT_MUTED, RONNIEDUKE_PALETTE.textMuted),
        border: color(process.env.CAL_VIDEO_BRAND_BORDER, RONNIEDUKE_PALETTE.border),
      }),
    },
    logoUrl: assetPath(process.env.CAL_VIDEO_LOGO_URL) ?? fallback.logoUrl,
    logoAlt: process.env.CAL_VIDEO_LOGO_ALT || fallback.logoAlt,
    backgroundUrl: assetPath(process.env.CAL_VIDEO_BACKGROUND_URL),
  };
}
