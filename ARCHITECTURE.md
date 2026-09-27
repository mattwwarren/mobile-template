# Architecture

This document describes how the mobile template is put together. It mirrors
the section structure of `react-template/ARCHITECTURE.md` — the mobile app
is a trimmed, native sibling of that template, consuming the same
fastapi-template backend, and this doc focuses on where mobile follows the
web conventions and where it deliberately diverges.

Stack (version authority is `package.json` — at time of writing Expo SDK
57, React Native 0.86, React 19): Expo Router (file-based routing, entry
`expo-router/entry`),
TanStack Query 5, react-hook-form + zod, `expo-secure-store` for tokens,
socket.io-client, plain `StyleSheet.create()` styling with design tokens
from `src/lib/theme.ts`, Biome for lint/format, Jest (`jest-expo`) +
Testing Library RN.

## The template model: runnable-first

Same convention as the other templates: `main` is a **directly runnable
Expo app**; `scripts/templatize.sh` converts it to a Copier template at
release (`.jinja` renames + name/slug substitution + `__PROJECT_NAME__`
placeholders resolved by `_tasks.py`), and `publish-template.yml` pushes the
result to the `copier` branch. `validate-template.yml` smoke-tests
generation on every push/PR to `main`.

Copier variables: identity (`project_name`/`project_slug`), `bundle_id`,
`api_url`, `auth_enabled` → `auth_provider`
(none/mock/ory/auth0/keycloak/cognito), `use_mocks`.

> **Known gaps:** (1) Only `mock` and `ory` are implemented.
> `auth0`/`keycloak`/`cognito` are declared choices whose factory cases
> resolve to an explicit `status: 'unconfigured'` provider
> (`src/auth/providers/index.ts`) — selecting one renders a full-screen
> error at the `app/index.tsx` entry gate rather than silently falling back
> to mock or throwing an uncaught exception. (2) `use_mocks` sets
> `EXPO_PUBLIC_USE_MOCKS` in `.env`, but nothing in `src/`/`app/` reads that variable — mock-vs-real API is
> not an env switch; mocks are applied at the API-client level in tests
> (`jest.mock`).

## Routing and auth gating (`app/`)

Expo Router file-based tree:

```
app/_layout.tsx     SafeAreaProvider > QueryClientProvider > AuthProvider
                    > SocketProvider > Stack
app/index.tsx       entry redirect: spinner while auth loads, then
                    → /(tabs) if authenticated, else /(auth)/login
app/(auth)/         login stack (headers off, gestures disabled)
app/(tabs)/         Dashboard / Items / Settings tab navigator
app/items/[id].tsx  item detail;  app/items/create.tsx  create form
```

Auth gating is **redirect-at-entry**: `app/index.tsx` is the only guard.
`(tabs)/_layout.tsx` does not re-check auth — there is no per-group guard
layer the way the web template wraps routes in `<ProtectedRoute>`. Login
`router.replace`s into `/(tabs)`; logout replaces back to `/`, which
re-runs the entry redirect.

## Layering (`src/`)

```
app/ screens
    │
    ▼
hooks/        TanStack Query hooks (useItems.ts: itemKeys factory,
    │         CRUD mutations invalidating lists + dashboard stats)
    ▼
api/          itemsApi — thin typed wrappers per resource
    │
    ▼
fetchApi()    src/api/client.ts — SecureStore token → Authorization:
    │         Bearer header, ApiError, 204 handling
    ▼
FastAPI backend
```

Deliberate divergences from react-template's otherwise-identical
`api/client.ts` skeleton:

- **Token auth, not cookies.** Native has no cookie jar; the token lives in
  `expo-secure-store` (never AsyncStorage — it's unencrypted) and is sent
  as a Bearer header. There is no refresh flow — the token persists until
  logout clears it.
- **No org-switcher / `X-Selected-Org` header** — the multi-tenant org
  concept is not ported to mobile.
- Domain surface is a single reference resource (`Item` + dashboard stats)
  rather than the web template's users/organizations/memberships/documents.

`src/auth/` follows the web template's context + pluggable-provider-factory
pattern (same file roles); `mock` and `ory` are implemented (see Known gaps).
`src/components/` splits into `ui/` (hand-rolled RN primitives — Button,
Card, Badge, Input, LoadingSpinner; no shadcn on native) and `shared/`
(ErrorView, FormField — a react-hook-form `Controller` wrapper). Styling is
always `StyleSheet.create()` with `src/lib/theme.ts` tokens; no inline
style objects.

### Types

`src/api/types.ts` holds hand-written placeholder types;
`src/api/generated/types.ts` is an empty placeholder until
`scripts/generate-types.sh` is run against a backend-exported OpenAPI spec
(`../specs/openapi.json`, same sourcing as react-template). Until then the
generate-from-OpenAPI convention is aspirational here.

## Realtime

Same Socket.IO client pattern as react-template (`SocketContext` +
`useSocket` + `useTaskEvents`, connect only while authenticated, path
`/ws/socket.io/`, capped reconnection backoff), with two mobile-specific
changes:

- **Auth**: token passed in the connect payload (`auth: { token }` read
  from SecureStore) instead of cookies; websocket transport only.
- **AppState lifecycle**: the socket disconnects when the app backgrounds
  and reconnects on foreground — web has no equivalent.

Event names/payloads match the backend contract in fastapi-template's
`realtime/contracts.py` (`task_status_changed`, `task_progress`,
`task_completed`, `task_failed`); handlers invalidate TanStack Query keys
on push.

> **Known gap:** `useTaskEvents` is implemented and tested but no screen
> consumes it yet — it ships ahead of a tasks UI, to keep the three-way
> contract (API / worker / clients) exercised. This is a confirmed decision
> (contract-only), not an open question: building a real tasks screen is
> blocked on `fastapi-template#62` (publishing `Task*Event` OpenAPI schemas),
> which a future tasks resource needs so `npm run generate:types` can produce
> real generated types instead of hand-rolled ones. Tracked by
> `mobile-template#6`.

## Mocks and testing

**No MSW** — React Native has no service workers, so mocking happens at the
API-client boundary instead of the network layer:

- `src/mocks/factories/` — seeded faker factories (`faker.seed(12345)`,
  same convention as react-template) + a pre-generated dataset.
- `src/mocks/mock-api.ts` — an in-memory `mockItemsApi` mirroring
  `itemsApi`'s shape with `resetMockApi()` for isolation.
- Tests `jest.mock('@/api/client')` or `jest.mock('@/api/items')` rather
  than intercepting fetch.

Jest (`jest-expo` preset — Vitest is not an option on RN) with Testing
Library RN. `tests/integration/` holds contract tests: frozen
URL/method/body assertions for every `itemsApi` method, and a
type-generation scaffolding check. CI (`ci.yml`): Biome lint, `tsc
--noEmit`, Jest with coverage — the acceptance bar; there is no simulator
gate.

## Deployment / release

No container/k8s surface — distribution is the app-store/Expo channel
(bundle identifier from the `bundle_id` Copier answer). The backend URL
comes from `EXPO_PUBLIC_API_URL` (`api_url` answer → `.env`), websockets
optionally from `EXPO_PUBLIC_WS_URL`. Merging is operator-owned: auto-merge
is disabled in this repo; CI green is the bar (see
`.claude/commands/ship-it.md`).

## Invariants (the short list)

1. Server state lives in TanStack Query; screens never fetch directly.
2. Tokens live in SecureStore only, sent as Bearer headers; never
   AsyncStorage, never a cookie assumption.
3. All styling via `StyleSheet.create()` + theme tokens; no inline styles.
4. Mocking happens at the API-client boundary (no MSW on RN); factories are
   seeded and deterministic.
5. Realtime event names/payloads follow the backend contract; sockets
   disconnect in background, reconnect in foreground.
6. Auth gating is the entry redirect in `app/index.tsx` — change it there,
   not per-screen.
7. Zero-violations bar: Biome, `tsc --noEmit`, and Jest must all pass
   clean; no suppressions without explicit approval.
8. Dependency pinning: generated projects resolve dependencies fresh from
   the registry rather than carrying a frozen lockfile (`package-lock.json`
   is excluded from Copier output in `copier.yaml` and
   `scripts/templatize.sh`). To keep that fresh resolution safe, every
   entry in `package.json`'s `dependencies` and `devDependencies` (33
   entries total: 23 `dependencies` + 10 `devDependencies`) is pinned to a
   minor range (`~`) — 15 of those were re-pinned from `^`/bare-exact to
   close the drift vector — except the Expo-SDK-managed native/ABI
   packages that `expo install --fix` keeps exact (`react`, `react-dom`,
   `react-native`, `react-native-reanimated`, `react-native-screens`,
   `react-native-worklets`). `validate-template.yml` runs
   `npx expo install --check` against a fresh install on every push/PR
   (failing the PR, not `main`, on drift) and on a weekly `schedule:` so
   drift surfaces between PRs too. `tests/policy/dependency-pinning.test.ts`
   and `tests/policy/validate-template-workflow.test.ts` enforce both
   halves of this policy.

   Verification (2026-09-27): a fresh generated project with an intentional
   installed `expo-font@56.0.0` mismatch reported `Found outdated dependencies`
   and `npx expo install --check` exited with status 1.
