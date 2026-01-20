import { CapId } from "../../flow/map.js";
import { CloudEvent } from "../shared/cloud-event.js";
import { JobEventType } from "./map.js";

export type JobScope = {
  flowid: string;
  runid: string;
  stepid: string;
  jobid: string;
  capid: CapId;
  toolid: string;
};

export type JobEvent<T extends JobEventType = JobEventType> = CloudEvent<T> &
  JobScope;
