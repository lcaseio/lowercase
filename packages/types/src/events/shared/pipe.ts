export type PipeData = {
  to?: {
    id: string;
    payload: string;
  };
  from?: {
    id: string;
    buffer?: number;
  };
};

export type PipeDataObject = {
  pipe?: PipeData;
};
