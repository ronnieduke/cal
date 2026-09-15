import { describe, expect, it, vi } from "vitest";
import { InstantMeetingService } from "../services/InstantMeetingService";
import { getInstantMeetingService } from "./InstantMeetingService.container";

vi.mock("@calcom/prisma", () => ({ default: {}, prisma: {}, readonlyPrisma: {} }));
vi.mock("@calcom/features/conferencing/lib/videoClient", () => ({ createMeetingWithCalVideo: vi.fn() }));

describe("getInstantMeetingService", () => {
  it("resolves the service with all repository dependencies bound", () => {
    expect(getInstantMeetingService()).toBeInstanceOf(InstantMeetingService);
  });
});
