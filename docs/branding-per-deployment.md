# Branding a deployment

`cal.ronnieduke.com` and `cal.trailspark.ai` run the same `main` branch from separate
Railway services with separate Postgres databases. Everything brand-specific is therefore
configuration, not code — there is no per-brand branch to keep rebasing against upstream.

Three mechanisms cover the surfaces, and which one applies is not a style choice; it
depends on where the value is read.

## 1. Build-time env (`NEXT_PUBLIC_*`)

Next.js inlines these at build, so **changing one requires a redeploy, not a restart**. Set
them as service variables on the Railway service; each service builds its own image, so
the two domains can hold different values.

| Variable | Trailspark | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `Trailspark` | page titles, email subjects, ~78 call sites |
| `NEXT_PUBLIC_COMPANY_NAME` | `Trailspark` | email footers |
| `NEXT_PUBLIC_WEBSITE_URL` | `https://trailspark.ai` | outbound links |
| `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS` | *(your support address)* | |
| `EMAIL_FROM_NAME` | `Trailspark` | defaults to `APP_NAME` if unset |
| `NEXT_PUBLIC_LOGO` | `/trailspark-logo-word.png` | nav wordmark, served via `/api/logo` |
| `NEXT_PUBLIC_LOGO_ICON` | `/trailspark-icon.png` | square mark |
| `NEXT_PUBLIC_LOGO_INVERT_IN_DARK` | `false` | see below |
| `NEXT_PUBLIC_FAVICON_16` | `/trailspark-favicon-16x16.png` | |
| `NEXT_PUBLIC_FAVICON_32` | `/trailspark-favicon-32x32.png` | |
| `NEXT_PUBLIC_APPLE_TOUCH_ICON` | `/trailspark-apple-touch-icon.png` | |
| `NEXT_PUBLIC_MSTILE_ICON` | `/trailspark-mstile-150x150.png` | |
| `NEXT_PUBLIC_ANDROID_CHROME_ICON_192` | `/trailspark-android-chrome-192x192.png` | |
| `NEXT_PUBLIC_ANDROID_CHROME_ICON_256` | `/trailspark-android-chrome-256x256.png` | |

`NEXT_PUBLIC_LOGO` expects a wordmark that reads on a **light** background — Cal's default
`calcom-logo-white-word.svg` is filled `#292929` despite the name. The nav applies a
`dark:invert` filter to flip that monochrome mark for dark mode, which mangles a
multi-colour logo: Trailspark's `#D33000` would invert to cyan. Setting
`NEXT_PUBLIC_LOGO_INVERT_IN_DARK=false` keeps the brand colours in both themes.

Favicons are not linked directly; they resolve through `/api/logo?type=…`, which falls back
to these constants. The per-team `appLogo` path in that route is unreachable here — it
short-circuits whenever `IS_SELF_HOSTED`, which is true for both domains.

## 2. Runtime env (Cal Video)

Read per request, so a **restart is enough**. The call page had no configuration hook at
all: the org-level `calVideoLogo` is stubbed to `null` upstream, and the Daily theme
colours were hardcoded.

A brand supplies six colours, expanded across Daily's ten theme slots. Anything malformed
falls back to the default — an invalid theme value throws inside the Daily iframe and would
take the call page down with it. Asset paths must be same-origin absolute paths (`/…`).

| Variable | Trailspark | Ronnie Duke (default) |
|---|---|---|
| `CAL_VIDEO_BRAND_ACCENT` | `#D33000` | `#6B8F7B` |
| `CAL_VIDEO_BRAND_BG` | `#1A1C1F` | `#1A1A1A` |
| `CAL_VIDEO_BRAND_BG_ACCENT` | `#24262A` | `#26221E` |
| `CAL_VIDEO_BRAND_TEXT` | `#F2F3F5` | `#F5F1EB` |
| `CAL_VIDEO_BRAND_TEXT_MUTED` | `#858892` | `#C9BFB2` |
| `CAL_VIDEO_BRAND_BORDER` | `#33363B` | `#3A342C` |
| `CAL_VIDEO_LOGO_URL` | `/trailspark-logo-white-word.png` | `/ronnieduke-video-logo.svg` |
| `CAL_VIDEO_LOGO_ALT` | `Trailspark` | `Ronnie Duke` |
| `CAL_VIDEO_BACKGROUND_URL` | `/trailspark-video-bg.jpg` | *(none)* |

`cal.ronnieduke.com` needs none of these — the defaults are its existing palette, so
deploying this is a no-op there.

The background image is visible on the pre-join screen only. Daily's iframe is full-bleed
and opaque, and is not created at all while the login overlay is open, which is the window
the image fills. During the call itself, `CAL_VIDEO_BRAND_BG` is what shows.

## 3. Database (per instance)

The two sites have separate databases, so these differ per instance with no configuration
at all. Set them in the running app:

- **Settings → Appearance → Brand colors** — `#D33000` light, and a dark value with enough
  contrast on the dark theme. Drives the Booker and booking pages.
- **Settings → Appearance → Theme** — light/dark default for booking pages.
- `hideBranding` — removes the "powered by Cal.com" mark.

## Brand assets

Sources live in `docs/brand-assets/<brand>/`; the deployed copies are in `apps/web/public/`.

Trailspark's icon set is generated from the mark in `TS_Logo_new.png`, cropped to its
bounding box with 14% padding. The iOS and Windows tiles are flattened onto white because
those platforms render transparency as black.

Per the brand's intent: the **white** wordmark is for the dark call background, the **grey**
wordmark for white surfaces (booking pages, emails, nav).
