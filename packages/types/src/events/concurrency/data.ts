export type ConcurrencyToolGrantedData = {
  runId: string;
  toolId: string;
  status: "granted";
};

export type ConcurrencyToolDeniedData = {
  runId: string;
  toolId: string;
  status: "denied";
};
export type ConcurrencyStartedData = {
  status: "started";
};

export type ConcurrencyStoppedData = {
  status: "stopped";
};
