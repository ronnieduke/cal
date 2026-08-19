# Branding a deployment

`cal.ronnieduke.com` and `cal.trailspark.ai` run the same `main` branch from separate
Railway services with separate Postgres databases. Everything brand-specific is therefore
configuration, not code — there is no per-brand branch to keep rebasing against upstream.

Three mechanisms cover the surfaces, and which one applies is not a style choice; it
depends on where the value is read.

**Every application-level variable here needs the `NEXT_PUBLIC_` prefix.** Bundled code only
sees prefixed names at runtime — an unprefixed one is `undefined` in the container and fails
silently, which cost a debugging session and left recordings billing to Daily's cloud. The
exception is code outside the bundle, such as Prisma reading `DATABASE_URL`.

## 1. Build-time env (`NEXT_PUBLIC_*`)

These are read at runtime, so a restart applies them — but a code change still needs a
redeploy. Set them as service variables on the Railway service; each service holds its own
values, so the two domains differ by configuration alone.

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

## 2. Cal Video branding (`NEXT_PUBLIC_CAL_VIDEO_*`)

The call page had no configuration hook at all: the org-level `calVideoLogo` is stubbed to
`null` upstream, and the Daily theme colours were hardcoded.

**These names must keep the `NEXT_PUBLIC_` prefix.** Bundled application code in this build
only sees `NEXT_PUBLIC_` prefixed variables at runtime; an unprefixed name reads as
`undefined` inside the container and silently yields the fallback branding, with no error
anywhere. This was verified on the deployment — an unprefixed variable never took effect
across a rebuild and two restarts, while a prefixed one applied on restart alone.

The read happens in the video route's server component, not in `getServerSideProps`, and
both resolvers take the environment as an argument so the read stays at that call site.

A brand supplies six colours, expanded across Daily's ten theme slots. Anything malformed
falls back to the default — an invalid theme value throws inside the Daily iframe and would
take the call page down with it. Asset paths must be same-origin absolute paths (`/…`).

| Variable | Trailspark | Ronnie Duke (default) |
|---|---|---|
| `NEXT_PUBLIC_CAL_VIDEO_BRAND_ACCENT` | `#D33000` | `#6B8F7B` |
| `NEXT_PUBLIC_CAL_VIDEO_BRAND_BG` | `#1A1C1F` | `#1A1A1A` |
| `NEXT_PUBLIC_CAL_VIDEO_BRAND_BG_ACCENT` | `#24262A` | `#26221E` |
| `NEXT_PUBLIC_CAL_VIDEO_BRAND_TEXT` | `#F2F3F5` | `#F5F1EB` |
| `NEXT_PUBLIC_CAL_VIDEO_BRAND_TEXT_MUTED` | `#858892` | `#C9BFB2` |
| `NEXT_PUBLIC_CAL_VIDEO_BRAND_BORDER` | `#33363B` | `#3A342C` |
| `NEXT_PUBLIC_CAL_VIDEO_LOGO_URL` | `/trailspark-logo-white-word.png` | `/ronnieduke-video-logo.svg` |
| `NEXT_PUBLIC_CAL_VIDEO_LOGO_ALT` | `Trailspark` | `Ronnie Duke` |
| `NEXT_PUBLIC_CAL_VIDEO_BACKGROUND_URL` | `/trailspark-video-bg.jpg` | *(none)* |

`cal.ronnieduke.com` needs none of these — the defaults are its existing palette.

### `NEXT_PUBLIC_DAILY_RECORDING_MODE`

Same trap, and it was costing money. `DAILY_RECORDING_MODE=local` was set but unprefixed, so
the video page silently resolved `recordingType` to `"cloud"` and recordings billed per
minute against the Daily account instead of recording locally for free. Set
`NEXT_PUBLIC_DAILY_RECORDING_MODE` on **every** deployment that wants local recording; the
unprefixed name is still read as a fallback but does not work in bundled code.

Confirm it took effect by fetching any call page and reading the serialised props:

```bash
curl -s https://<host>/video/<uid> | grep -oE 'recordingType[^,}]{0,25}'
```

The background image is visible on the pre-join screen only, and is unmounted once the call
frame mounts. Daily Prebuilt paints an opaque, full-bleed iframe over the page and cannot be
made transparent — `createTransparentFrame()` is a non-interactive overlay
(`pointer-events: none`, `custom-v1` layout), not the Prebuilt UI — so there is no way to
show a page background behind a live call. Leaving the element mounted only made it flash
into view whenever the iframe repainted on resize.

Pick `NEXT_PUBLIC_CAL_VIDEO_BRAND_BG` to match the background image's own base colour so the
hand-off is invisible; Trailspark's `#1A1C1F` is sampled from the image for that reason.

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
