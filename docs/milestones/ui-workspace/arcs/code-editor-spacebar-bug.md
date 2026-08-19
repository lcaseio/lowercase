# UI Workspace Milestone — Arc: CodeEditor (Monaco) spacebar bug (PR 39)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log, split out to keep that doc scannable. Continues from [`flow-authoring.md`](./flow-authoring.md) (PR 38) — a standalone infrastructure fix, not a continuation of that arc's own feature narrative, surfaced while testing it.

## PR 39 - Fix CodeEditor (Monaco)'s spacebar input bug - not started

`CodeEditor.tsx` (the shared Monaco wrapper used by both the flow-authoring and artifact-authoring editors, plus several read-only viewers) sometimes stops accepting spacebar input entirely. Real-priority, not a polish item — this blocks typing at all in an editor a user is actively relying on, not a narrow edge case. Re-sequenced ahead of its original slot in `Next up` specifically for that reason.

### Discussion

Everything below carries forward from PR 38's own testing (2026-08-19), not re-derived — see `docs/todo.md` for the same trace.

**Reported symptom, precise**: typing a space *immediately* after a letter lands; pausing before pressing space causes it to silently do nothing. Not even the browser-native double-space-period substitution — that only shows up as a side effect of the user re-pressing space while already stuck, not an independent cause. Once it starts happening in a given editor instance, it can persist across many further keystrokes, not a one-off dropped character.

**One real theory investigated and ruled out, not just untried.** `CodeEditor` binds Monaco's `value` prop straight to the caller's own store (Redux for both editors, debounced ~250ms). `@monaco-editor/react`'s internal effect force-replaces the whole model's content whenever the `value` prop differs from `editor.getValue()` — so a debounced echo of the editor's *own* recent typing could in theory arrive as a new `value` prop *after* a newer keystroke Monaco had already applied locally, and get silently reverted by that resync. A real, buildable fix for exactly this race (gate adopting an external `value` change on the editor not currently having focus, via Monaco's `onDidFocusEditorText`/`onDidBlurEditorText`) was implemented and tested live against the actual symptom — **it did not fix it**, so this specific mechanism is ruled out, not just unconfirmed. Reverted rather than left in as unproven complexity in a widely-shared component.

**Not investigated yet — real next steps, not more guessing:**
- Whether it reproduces in a plain `<input>` elsewhere on the same page while stuck (distinguishes "Monaco-specific" from "dead everywhere on the page").
- Whether it reproduces in a fresh incognito/private window (rules out a browser extension intercepting spacebar — some do this for page-scroll shortcuts even inside focused editors).
- Whether it's tied to Monaco's own composition/IME-state handling getting stuck (a known flaky area upstream in some community reports) or something specific to this app's Monaco config/version — needs live debugging (breakpoints/event-listener inspection in devtools), not static code reading.
- Whether a hard reload clears it reliably (a stuck client-side state would suggest a different mechanism than a genuine per-keystroke bug).

Not scoped further yet — needs its own real investigation pass, likely requiring live interactive debugging rather than reasoning from code alone.
