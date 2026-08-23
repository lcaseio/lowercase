# @lcase/web-app

React frontend for the workflow engine's [`http-server`](../http-server) — the Workbench dockview workspace, plus Evals and System pages. See the [repo root README](../../README.md) for the overall project.

## Development

```bash
pnpm -F @lcase/web-app dev
```

or from this directory:

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

Runs `tsc -b && vite build`, producing a static production bundle in `dist/`. Preview it locally with `pnpm preview`.

## Pointing at a different server

By default the app talks to `http://localhost:3000`. Override it at build time with `VITE_SERVER_URL`:

```bash
VITE_SERVER_URL=https://example.com pnpm build
```

For local dev, drop the same variable in a gitignored `.env.local` in this directory instead:

```
VITE_SERVER_URL=http://localhost:4000
```

## Other commands

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## API reference

See [`docs/api-reference.md`](../../docs/api-reference.md) for the `http-server` endpoints this app calls.
