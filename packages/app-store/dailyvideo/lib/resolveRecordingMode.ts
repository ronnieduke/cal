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
export function resolveRecordingMode(defaultMode: DailyRecordingMode): DailyRecordingMode {
  const mode = process.env.DAILY_RECORDING_MODE;
  if (mode === "local" || mode === "cloud") return mode;
  if (mode === "off") return undefined;
  return defaultMode;
}
