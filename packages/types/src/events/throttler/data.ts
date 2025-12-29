export type ThrottlerToolGrantedData = {
  runId: string;
  toolId: string;
  status: "granted";
};

export type ThrottlerToolDeniedData = {
  runId: string;
  toolId: string;
  status: "denied";
};
export type ThrottlerStartedData = {
  status: "started";
};

export type ThrottlerStoppedData = {
  status: "stopped";
};
