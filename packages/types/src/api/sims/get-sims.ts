export type ForkSpecListItem = {
  name: string;
  flowDefName: string;
  flowDefHash: string;
  forkSpecHash: string;
  flowDefVersion: string;
  flowDefDescription?: string;
  parentRunId?: string;
};

export type GetSimsRes =
  | { ok: true; forkSpecList: ForkSpecListItem[] }
  | { ok: false; error: string };
