export type RunIndex = {
  flowId: string;
  traceId: string;
  flowDefHash?: string;
  forkSpecHash?: string;
  parentId?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  runInputHash?: string;
  runParamsHash?: string;
  params?: Record<string, string>;

  steps: Record<
    string,
    {
      outputHash?: string;
      exportHashes?: Record<string, string>;
      status?: string;
      startTime?: string;
      reusedTime?: string;
      endTime?: string;
      duration?: number;
      argsHash?: string;
      wasReused?: boolean;
    }
  >;
};
