# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **the-magician**, a Next.js 15 + React 19 web client for CODE OF JOKER card game simulation. It connects via WebSocket to [the-fool](https://github.com/sweshelo/the-fool) backend server.

## Commands

```bash
bun install          # Install dependencies (auto-runs git submodule update)
bun dev              # Start development server
bun build            # Production build
bun lint             # Run ESLint
```

## Architecture

### Key Directories

- `src/app/` - Next.js App Router pages (`/`, `/entrance`, `/builder`, `/room/[id]`)
- `src/feature/` - Major feature modules (Game, DeckBuilder, Field, Hand, etc.)
- `src/component/` - Reusable components (`ui/` for game UI, `interface/` for generic UI)
- `src/hooks/` - React hooks and context providers (Zustand store in `game/context.tsx`)
- `src/service/` - Business logic (WebSocket singleton, localStorage abstraction)
- `src/submodule/suit/` - Git submodule with shared types and card catalog

### State Management

- **Zustand** for game state (`useGameStore` in `src/hooks/game/`)
- **React Context** for system-wide concerns (WebSocket, Sound, Animations, Errors)
- Context providers wrapped in `src/hooks/index.tsx`

### Real-Time Communication

WebSocket service (`src/service/websocket.ts`) is a singleton with:
- `send()` - fire-and-forget messages
- `request()` - awaits response
- Auto-reconnection on disconnect

## Strict TypeScript Rules

The codebase enforces strict type safety via ESLint:

- No `any` type usage (`@typescript-eslint/no-explicit-any: error`)
- No `ts-ignore`, `ts-nocheck`, `ts-expect-error` comments
- No non-null assertions (`!`)
- No floating Promises (must be awaited)
- Use type imports: `import type { Foo }` for type-only imports
- Strict equality (`===`/`!==` only)
- Prefer `const` over `let`
- Unused vars must be prefixed with `_`

The `src/submodule/` directory is excluded from linting.

## Environment Variables

Copy `.env.sample` to `.env.local`:

- `NEXT_PUBLIC_SERVER_HOST` - WebSocket server address
- `NEXT_PUBLIC_SECURE_CONNECTION` - Use `wss://` when "true"
- `NEXT_PUBLIC_IMAGE_SIZE` - Card image resolution: "thum", "normal", or "full"

## Related Repositories

- [the-fool](https://github.com/sweshelo/the-fool) - WebSocket game server
- [suit](https://github.com/sweshelo/suit) - Shared type definitions (git submodule)
