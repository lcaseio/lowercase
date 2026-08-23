import type { CapId } from "../../flow/map.js";
import type { CloudEvent } from "../shared/cloud-event.js";
import type { JobEventType } from "./map.js";

export type JobScope = {
  flowid: string;
  flowversionid: string;
  runid: string;
  stepid: string;
  jobid: string;
  capid: CapId;
  toolid: string;
};

export type JobEvent<T extends JobEventType = JobEventType> = CloudEvent<T> &
  JobScope;
