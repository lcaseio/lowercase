export type PermitRequest = {
  requestId: string;
  // Provisional -- resource-key derivation for HTTP endpoints, accounts, and
  // local models is an open question the doc explicitly leaves unresolved.
  resourceKey: string;
  concurrencyCost?: number;
  rateCost?: number;
};

export type PermitGrant = {
  grantId: string;
  resourceKey: string;
};

export interface ResourcePermitPort {
  acquire(
    request: PermitRequest,
    options?: { signal?: AbortSignal },
  ): Promise<PermitGrant>;

  release(grantId: string): Promise<void>;
}
