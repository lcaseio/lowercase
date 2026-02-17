export type ForkSpecListItem = {
  flowDefName: string;
  flowDefVersion: string;
  flowDefDescription?: string;
  parentRunId?: string;
};

export type GetSimsRes =
  | { ok: true; forkSpecList: ForkSpecListItem[] }
  | { ok: false; error: string };
