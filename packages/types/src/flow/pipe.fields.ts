export type PipeFields = {
  to?: {
    step: string;
    payload: string;
  };
  from?: {
    step: string;
    buffer?: number;
  };
};
