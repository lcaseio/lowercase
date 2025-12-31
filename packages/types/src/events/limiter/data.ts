export type LimiterSlotData = {
  jobId: string;
  runId: string;
  toolId: string;
  workerId: string | null;
};
export type LimiterSlotGrantedData = LimiterSlotData & {
  status: "granted";
};

export type LimiterSlotDeniedData = LimiterSlotData & {
  status: "denied";
};

export type LimiterTokenGrantedData = LimiterSlotData;
export type LimiterStartedData = {
  status: "started";
};

export type LimiterStoppedData = {
  status: "stopped";
};
