// biome-ignore-all lint/correctness/noProcessGlobal: the autofix adds `node:process`,
// which does not exist in the Edge runtime and breaks the production build. Bare
// process.env works in both runtimes.

export type DailyRecordingMode = "cloud" | "local" | undefined;

/**
 * Self-hosted deployments can force the Daily recording mode via DAILY_RECORDING_MODE,
 * bypassing the scale-plan/team-plan gates that only make sense on hosted Cal:
 * - "local" records in the recorder's browser and saves to their disk, avoiding
 *   Daily's per-minute cloud recording fees entirely
 * - "cloud" stores recordings with Daily (or the configured S3 bucket)
 * - "off" disables recording even when the default gates would enable it
 * Any other value (or unset) preserves the default gated behavior.
 */
export function resolveRecordingMode(
  defaultMode: DailyRecordingMode,
  env: Record<string, string | undefined> = process.env
): DailyRecordingMode {
  // NEXT_PUBLIC_ prefixed name takes precedence: bundled code cannot see the unprefixed
  // one at runtime, which is why DAILY_RECORDING_MODE alone silently recorded to cloud.
  const mode = env.NEXT_PUBLIC_DAILY_RECORDING_MODE ?? env.DAILY_RECORDING_MODE;
  if (mode === "local" || mode === "cloud") return mode;
  if (mode === "off") return undefined;
  return defaultMode;
}
