# Work tracking

This document defines the target work-tracking convention and the rules for
migrating to it. It is deliberately small: the initiative index and its arc
files hold the actual work history.

## Canonical terms

- **Initiative (`I#`)** — a large, outcome-oriented body of work.
- **Arc (`A#`)** — a related, narratively coherent stream within one
  initiative.
- **Change (`C#`)** — the smallest internally tracked unit of work. A Change
  normally maps one-to-one to a GitHub pull request.
- **GitHub PR (`PR #N`)** — the repository-wide pull request object assigned
  by GitHub. It is not a Change identifier.

Write a complete internal reference as `I3 / A2 / C4`. `I#` is globally
unique; `A#` and `C#` are scoped to their initiative, so do not cite either
alone where the initiative is not already clear. Never reuse an assigned ID.

The canonical layout is:

```text
docs/
  initiatives/
    README.md
    <initiative-slug>/
      INITIATIVE.md
      arcs/
        <descriptive-arc-name>.md
```

Use descriptive, kebab-case directory and arc-file names. The initiative
index, not filename numbering, maps IDs to documents.

## Writing rules

- Refer to an internal unit as `Change C4`, not `PR 4`.
- Refer to the external object as `GitHub PR #381` or `PR #381`, never `PR
  381` when ambiguity is likely.
- In a GitHub PR description, add `Internal tracking: I3 / A2 / C4` when the
  documentation link is useful. Keep these IDs out of PR titles and
  user-facing text.
- Code comments explain durable behavior or rationale. Do not add tracking
  IDs to them unless the ID is a useful, durable link to a design record; use
  the documentation link in that rare case.
- During a migration, remove existing internal tracking IDs from code comments
  by default. Retain one only when it is the durable design-record link above.
- Dates in active planning or process prose must be accurate and meaningful.
  Remove a stale or decorative date rather than guessing a replacement. Keep
  historical dates only when they are factual, or verify a correction from
  repository history before changing one.
- An initiative's Change index records both identifiers at merge time, for
  example `C4 — merged (PR #381)`.

## Migration playbook

Use this only for an explicitly requested, repository-wide migration. Do not
partially adopt the new vocabulary while the old structure is still canonical.

1. Inspect the working tree first. Preserve unrelated edits and do not bury
   them in the migration.
2. Inventory current references before changing them. Classify each one as an
   internal tracking reference, a real GitHub PR/Milestone reference, a
   historical quote, or unrelated prose.
3. Make a **moves-only commit**. Move `docs/milestones/` to
   `docs/initiatives/`, rename each `MILESTONE.md` to `INITIATIVE.md`, and
   repair only paths and links made invalid by those moves. Do not rewrite
   narrative terminology in this commit.
4. Make a **terminology commit**. Update current documentation, templates,
   indexes, and active instructions to Initiative, Arc, and Change. Remove
   internal tracking IDs from code comments unless a comment needs a durable
   design-record link. Audit dated planning/process prose at the same time:
   remove stale dates and verify any historical-date correction from
   repository history. Preserve numeric identity: legacy milestone `3`
   becomes `I3`; an old internal PR `4` becomes `C4` in the same initiative.
   Add arc IDs where the index needs them, rather than numbering filenames.
5. Keep real GitHub identifiers intact. `PR #381` and GitHub Milestone names
   must not be renamed. Do not edit old public GitHub PR descriptions merely
   to revise their historical internal wording.
6. Validate the result. Check internal links, search for remaining legacy
   terms, and inspect every remaining match. A remaining legacy reference is
   acceptable only when it identifies a real GitHub object or explains the
   historical migration.

Do not keep a `docs/milestones/` compatibility directory or redirect stubs.
Git history preserves the prior layout; the current repository should teach
only the current vocabulary.
