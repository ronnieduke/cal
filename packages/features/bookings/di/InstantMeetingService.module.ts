import { bindModuleToClassOnToken, createModule, type ModuleLoader } from "@calcom/features/di/di";
import { moduleLoader as bookingRepositoryModuleLoader } from "@calcom/features/di/modules/Booking";
import { moduleLoader as eventTypeRepositoryModuleLoader } from "@calcom/features/di/modules/EventType";
import { DI_TOKENS } from "@calcom/features/di/tokens";
import { InstantMeetingService } from "../services/InstantMeetingService";

const thisModule = createModule();
const token = DI_TOKENS.INSTANT_MEETING_SERVICE;
const moduleToken = DI_TOKENS.INSTANT_MEETING_SERVICE_MODULE;

const loadModule = bindModuleToClassOnToken({
  module: thisModule,
  moduleToken,
  token,
  classs: InstantMeetingService,
  depsMap: {
    bookingRepository: bookingRepositoryModuleLoader,
    eventTypeRepository: eventTypeRepositoryModuleLoader,
  },
});

export const moduleLoader: ModuleLoader = {
  token,
  loadModule,
};

export type { InstantMeetingService };
