# UI Workspace Milestone — Arc: `apps/web-app` + `apps/http-server` READMEs, real content (PR 54)

**Previous:** [Activate the real production build](./production-build.md) (PR 53) · **Next:** — none yet (PRs 55–56 not yet their own arc files)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log. Standalone docs work, not a continuation of any feature arc — the still-unedited Vite scaffolding stub was flagged during PR 49's "what's left outside `components/`" review of `apps/web-app`.

**Scope widened 2026-08-23 to include `apps/http-server`.** This milestone made real changes to the backend along the way too (PR 53's build/lint work, `docs/api-reference.md`/`docs/api-usage-audit.md`), and it had no README at all. Added here rather than as a separate PR since it's the same shape and small — mostly commands plus links out to the existing API docs, not new narrative content to maintain.

## PR 54 - `apps/web-app` + `apps/http-server` READMEs, real content - in progress

### Discussion

**Content is genuinely open — not fully scoped yet.** Two pieces are confirmed inclusions, carried over from where this PR was first named:

- **A short section on overriding `VITE_SERVER_URL`** — a real env var at build time, or a personal, gitignored `.env.local`. Follow-up from PR 53 (`arcs/production-build.md`), which introduced the var and its fallback but left the README explanation for this PR.
- **A hand-traced "how data flows through this app" section**, verified hop-by-hop against real code rather than written from memory. Absorbs most of the original PR 52 idea rather than a separate deep audit — the user's own read (2026-08-22): reorganizing/renaming `components/` across PRs 42–49 already delivered most of the "internalize the frontend" value a formal trace was meant to produce, so a short traced section in the README covers what's actually still wanted, without a dedicated deep-dive doc. Flows worth tracing, if this happens:
  - A FlowExplorer tree click through to a panel actually opening (`dock-panels.ts`'s routing → dockview open/focus → `DockTabContent.tsx`'s switch → the panel's own hook → render).
  - The flow-graph panel's own large hook.
  - Where the authoring-preview panel's hook/toolbar diverges from the main Flow Graph panel's.
  - A live SSE event landing through to a re-render.

**Also named, same PR: go over `MILESTONE.md` itself and clean it up**, per the user's own call — not yet started.

**Originally also carried a comment pass across the PRs 29–34 flow-graph code, folded in by default (2026-08-22) rather than decided** — its home only because PR 54's trace-reading touches that code anyway, not because that's where the need was judged greatest. **Split out 2026-08-23 into its own PR 55** (`MILESTONE.md`'s Next up section) once it became clear the two are different kinds of review — docs content vs. cross-file code comment correctness — and that the comment pass's real scope is broader/unknown, not confined to flow-graph. The original trigger for flagging the comment pass is lost and not worth rediscovering; a fresh sweep will scope it instead. PR 54 ships first, on its own.
