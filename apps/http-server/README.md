# @lcase/http-server

Fastify REST API and event stream server for the workflow engine — the backend [`apps/workbench`](../workbench) talks to. See the [repo root README](../../README.md) for the overall project, including database setup (`pnpm db:migrate`).

## Development

```bash
pnpm -F @lcase/http-server dev
```

or from this directory:

```bash
pnpm dev
```

Listens on `http://127.0.0.1:3000` by default. Override with the `PORT`/`HOST` env vars.

## Build

```bash
pnpm build
pnpm start
```

`build` compiles to `dist/`; `start` runs the compiled output (`node ./dist/main.js`).

## Other commands

```bash
pnpm typecheck
pnpm test
```

`lint` is currently a no-op stub (`echo lint`) — no real ESLint config for this package yet.

## API reference

See [`docs/api-reference.md`](../../docs/api-reference.md) for the full endpoint list.
