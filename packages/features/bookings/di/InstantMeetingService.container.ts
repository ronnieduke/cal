import { createContainer } from "@calcom/features/di/di";
import {
  type InstantMeetingService,
  moduleLoader as instantMeetingServiceModule,
} from "./InstantMeetingService.module";

const instantMeetingServiceContainer = createContainer();

export function getInstantMeetingService(): InstantMeetingService {
  instantMeetingServiceModule.loadModule(instantMeetingServiceContainer);

  return instantMeetingServiceContainer.get<InstantMeetingService>(instantMeetingServiceModule.token);
}
