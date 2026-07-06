import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveRecordingMode } from "./resolveRecordingMode";

describe("resolveRecordingMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the default when DAILY_RECORDING_MODE is unset", () => {
    vi.stubEnv("DAILY_RECORDING_MODE", "");
    expect(resolveRecordingMode("cloud")).toBe("cloud");
    expect(resolveRecordingMode(undefined)).toBeUndefined();
  });

  it("forces local recording regardless of the default", () => {
    vi.stubEnv("DAILY_RECORDING_MODE", "local");
    expect(resolveRecordingMode(undefined)).toBe("local");
    expect(resolveRecordingMode("cloud")).toBe("local");
  });

  it("forces cloud recording regardless of the default", () => {
    vi.stubEnv("DAILY_RECORDING_MODE", "cloud");
    expect(resolveRecordingMode(undefined)).toBe("cloud");
  });

  it("disables recording when set to off", () => {
    vi.stubEnv("DAILY_RECORDING_MODE", "off");
    expect(resolveRecordingMode("cloud")).toBeUndefined();
  });

  it("ignores unrecognized values and keeps the default", () => {
    vi.stubEnv("DAILY_RECORDING_MODE", "raw-tracks");
    expect(resolveRecordingMode("cloud")).toBe("cloud");
    expect(resolveRecordingMode(undefined)).toBeUndefined();
  });
});
