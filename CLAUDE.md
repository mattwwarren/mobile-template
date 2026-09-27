# Mobile Template - Claude Code Configuration

React Native mobile template for consuming FastAPI backends. Reference implementation demonstrating API consumption, authentication, and mobile-native patterns using Expo.

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Expo | ~57.0 |
| UI | React Native | 0.86.x |
| Language | TypeScript | ~5.9 (strict) |
| Navigation | Expo Router | ~57.0 |
| Server State | TanStack Query | 5.x |
| Validation | Zod | 4.x |
| Token Storage | expo-secure-store | 57.x |
| Types | Auto-generated from OpenAPI via `openapi-typescript` | 7.x |
| Linting | Biome | 2.x |
| Testing | Jest (jest-expo preset) | - |

## Quick Commands

```bash
# Development
npm start                  # Start Expo dev server (QR code)
npx expo start --ios       # Start iOS simulator
npx expo start --android   # Start Android emulator

# Testing
npm test                   # Run Jest tests

# Linting & Types
npm run lint               # Biome check
npm run lint:fix           # Auto-fix with Biome
npm run typecheck          # TypeScript check (tsc --noEmit)

# Code Generation
npm run generate:types     # Generate types from OpenAPI spec
```

## Project Structure

```
app/                        # Expo Router file-based routes
├── _layout.tsx             # Root layout (auth redirect, providers)
├── index.tsx               # Entry redirect
├── (auth)/                 # Auth group (unauthenticated)
│   ├── _layout.tsx
│   └── login.tsx
├── (tabs)/                 # Tab navigation (authenticated)
│   ├── _layout.tsx         # Tab bar configuration
│   ├── index.tsx           # Dashboard tab
│   ├── items.tsx           # Items list tab
│   └── settings.tsx        # Settings tab
└── items/                  # Item detail routes
    ├── [id].tsx            # Item detail (dynamic route)
    └── create.tsx          # Create item form
src/
├── api/
│   ├── generated/          # AUTO-GENERATED from OpenAPI (don't edit)
│   │   └── types.ts
│   ├── client.ts           # Fetch wrapper with Bearer token auth
│   ├── items.ts            # Item CRUD API functions
│   └── types.ts            # Type aliases (wraps generated types)
├── auth/                   # Auth provider abstraction
├── components/
│   └── ui/                 # Shared UI components
├── hooks/
│   └── useItems.ts         # TanStack Query hooks for items
├── lib/
│   └── theme.ts            # Colors, spacing, fontSize, borderRadius
└── mocks/                  # Mock data factories
```

## Code Conventions

- Source comments must not embed the literal repo slug (`mobile-template`) -- `scripts/templatize.sh`'s remaining-references guard greps generated output for it.

### Styles
- **Always** use `StyleSheet.create()` for all styles -- no inline style objects
- Import theme constants from `@/lib/theme` for colors, spacing, fontSize, borderRadius
- Use `Platform.OS` checks or `Platform.select()` for platform-specific styles

### Safe Area
- Use `SafeAreaView` from `react-native-safe-area-context` or `useSafeAreaInsets` hook
- Never assume safe area insets -- always handle notches, home indicators, status bars

### Navigation
- File-based routing via Expo Router (`app/` directory)
- Route groups with parentheses: `(tabs)/`, `(auth)/`
- Dynamic routes: `[id].tsx`
- Layouts: `_layout.tsx` in each directory

### Lists
- **Always** use `FlatList` for lists -- never `ScrollView` + `.map()`
- Wrap item renderers in `useCallback` to avoid unnecessary re-renders
- Use `keyExtractor` with stable unique keys

## Type-Safe API Calls

### fetchApi Wrapper
The `src/api/client.ts` provides a typed fetch wrapper:
- Automatically attaches Bearer token from `expo-secure-store`
- Base URL from `EXPO_PUBLIC_API_URL` environment variable
- Typed request/response handling

### TanStack Query
All server state managed via TanStack Query hooks in `src/hooks/`:

```typescript
import { useItems, useItem, useCreateItem } from '@/hooks/useItems';

// List with pagination
const { data, isLoading } = useItems({ skip: 0, limit: 10 });

// Single item
const { data: item } = useItem(id);

// Mutation
const createItem = useCreateItem();
createItem.mutate({ name: 'New Item', description: '...' });
```

### Generated Types
Types auto-generated from OpenAPI spec. Type aliases in `src/api/types.ts` wrap generated types:

```typescript
import type { Item, ItemCreate, PaginatedResponse, DashboardStats } from '@/api/types';
```

## Auth Patterns

### Pluggable Provider
Auth uses a provider abstraction pattern:
- **mock** - Auto-logged-in for development
- **ory** - Ory Kratos native (API) flow: email + password submitted to a
  native login flow, session token stored in `expo-secure-store` and
  validated via `toSession` on launch. Needs `EXPO_PUBLIC_ORY_SDK_URL`;
  `@ory/client-fetch` is an optional dependency loaded via try/`require`
- **auth0** / **keycloak** / **cognito** - planned; selecting one yields a
  provider with `status: 'unconfigured'`, which renders a full-screen error
  at the `app/index.tsx` entry gate — no silent fallback to mock, no throw
  (see ARCHITECTURE.md Known gaps)

### Token Storage
- Tokens stored via `expo-secure-store` (device keychain/keystore)
- **Never** use `AsyncStorage` for tokens -- it is not encrypted

### Protected Routes
The `app/index.tsx` entry gate redirects unauthenticated users to `/(auth)/login`
(it is the only auth guard — see ARCHITECTURE.md Invariant 6)

## Testing Patterns

- **No MSW** -- React Native does not support service workers
- Mock at API client level (jest.mock for `src/api/client.ts`)
- Faker.js factories with `seed(12345)` for reproducible test data
- Jest with `jest-expo` preset
- Test components with `@testing-library/react-native`

## Performance Patterns

- `FlatList` for all lists (not `ScrollView` + `.map()`)
- `useCallback` for list item renderers and event handlers
- Avoid creating objects/arrays in render (extract to constants or `useMemo`)
- Image caching via `expo-image` for network images
- Minimize bridge crossings (batch state updates)

## Environment Variables

```bash
# .env (Expo uses EXPO_PUBLIC_ prefix for client-side vars)
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_USE_MOCKS=true
EXPO_PUBLIC_AUTH_PROVIDER=mock
```

## Copier Template

Template variables (defined in `copier.yaml`):
- `project_name` - Human-readable project name
- `project_slug` - Package name (hyphens)
- `bundle_id` - App store identifier (e.g., com.example.myapp)
- `auth_enabled` - Enable auth UI and protected routes
- `auth_provider` - ory/auth0/keycloak/cognito
- `use_mocks` - Include mock data for standalone development

## Zero Violations Policy

- `npx biome check .` -- ZERO violations
- `npx tsc --noEmit` -- ZERO type errors
- `npm test` -- 100% pass rate
- `npm test -- --coverage` -- coverage must stay at or above the enforced
  floor in `jest.config.js` (`coverageThreshold.global`: statements 51%,
  branches 48%, functions 44%, lines 52% -- set from a measured baseline of
  ~53.76%/50.42%/46.23%/54.92% via `floor(baseline) - 2`, no 60% floor
  clamp per issue #9's operator resolution; raising real coverage to 60%
  and re-tightening this gate is tracked in issue #16)

No suppressions without explicit user approval.
