# Architecture Boundaries

## Summary

A decision-first milestone, not an execution one: settle the package-tier taxonomy (use-cases vs. services vs. "component pieces" vs. pure ports/adapters — correcting, not just executing, the existing `docs/todo.md` "Package-tier taxonomy" entry) and the worker/tool extensibility model (in-process vs. out-of-process tools, the partially-built capability/tool-registry idea) together, since they're related boundary questions, not separate ones. Expect real movement, not just relabeling — packages may actually relocate once the taxonomy is settled.

Output is expected to be one or more ADRs, not a full execution pass across the repo. Other milestones in this arc — particularly [`worker-tools-artifacts`](../worker-tools-artifacts/MILESTONE.md) — depend on what gets decided here.

Scaffolded now, work not yet started.
