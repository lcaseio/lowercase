export type RunListItem = {
  runId: string;
  flowName: string;
  flowVersion: string;
  flowDefHash: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  forkSpecHash?: string;
  parentId?: string;
};
