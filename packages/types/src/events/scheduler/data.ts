export type SchedulerToolRequestedData = {
  runId: string;
  toolId: string;
};

export type SchedulerStartedData = {
  status: "started";
};

export type SchedulerStoppedData = {
  status: "stopped";
};
