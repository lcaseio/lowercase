import { FlowService } from "./flow.service.js";
import { ReplayService } from "./replay.service.js";
import { SimService } from "./sim.service.js";
import { SystemService } from "./system.service.js";

export type Services = {
  flowService: FlowService;
  replayService: ReplayService;
  simService: SimService;
  systemService: SystemService;
};
