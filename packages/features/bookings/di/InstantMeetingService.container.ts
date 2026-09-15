import { createContainer } from "@calcom/features/di/di";
import { prismaModule } from "@calcom/features/di/modules/Prisma";
import { DI_TOKENS } from "@calcom/features/di/tokens";
import {
  type InstantMeetingService,
  moduleLoader as instantMeetingServiceModule,
} from "./InstantMeetingService.module";

const instantMeetingServiceContainer = createContainer();
// The Booking and EventType repository modules bind to PRISMA_CLIENT without loading it themselves.
instantMeetingServiceContainer.load(DI_TOKENS.PRISMA_MODULE, prismaModule);

export function getInstantMeetingService(): InstantMeetingService {
  instantMeetingServiceModule.loadModule(instantMeetingServiceContainer);

  return instantMeetingServiceContainer.get<InstantMeetingService>(instantMeetingServiceModule.token);
}
