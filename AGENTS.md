# AGENTS.md — wow-seg

## Goal
- Replace the old aggregated leveling system with a single deterministic dungeon-by-dungeon simulation engine and migrate all consumers to it.

## Constraints & Preferences
- Spanish UI terminology
- Svelte 5 runes (`$state`, `$derived`, `$props`)
- Hand-drawn SVG charts (no library)
- CSS custom properties for theming (dark/light)
- Simulation engine must be the single source of truth; no duplicated logic between views
- No approximations, no aggregated formulas, no `Math.ceil()`
- Architecture must support future optimization strategies (DP, knapsack, SRPT, etc.) without modifying the engine
- All buffs through a single modifier pipeline inside `GameModel`
- Game logic (XP tables, buffs, Warband) fully separated from the simulation kernel via `GameModel` interface
- Engine produces a full dungeon-by-dungeon history log
- `npm run check` must remain at 0 errors, 0 warnings at all times

## Progress
### Done
- **Full simulation engine implemented** (`src/lib/simulation/` — 21 files):
  - `types.ts`: `GameModel`, `SimulationContext`, `SimulationState`, `SimulationResult`, `SimulationStep`, `SimulationMetrics`, `SimulationHooks`, event payloads, `RosterSimulationResult`
  - `event-bus.ts`: `TypedEventBus` with typed event map (no `any`)
  - `context.ts`: `createContext()`, `createState()` factories
  - `tables/`: pure data — `xp-required.ts`, `dungeon-reward.ts`, `monster-xp.ts`, `overrides.ts`
  - `game-model/types.ts`: `GameModel` interface + `LevelUpEffects`
  - `game-model/wow-retail.ts`: `WoWRetailModel` — concrete implementation with complete buff pipeline (Warband 0-80, Warband 80-90, Timeways, War Mode, custom buffs); monster XP warning `EXTRAPOLATED_MONSTER_XP`
  - `kernel/simulate-character.ts`: event-driven loop (no `Math.ceil()`, no division, no aggregation)
  - `kernel/simulate-roster.ts`: multi-character simulation with `count90` incremented per character
  - `kernel/metrics.ts`: `computeMetrics()` — precomputes all values consumed by UI
  - `kernel/warnings.ts`: `computeWarnings()` — `EXTRAPOLATED_MONSTER_XP`, `ACTIVE_EVENT`
- **Sentinel bug fixed** in `calculator.ts` — both `getXpRemaining` and `getLevelBreakdown` changed from `l <= objetivo` to `l < objetivo`
- **`src/lib/format.ts` created** — `formatNumber()`, `formatHours()` extracted from `calculator.ts`
- **Format imports migrated** across 10+ components
- **`LevelingView.svelte` rewired** — `simulateRoster()` replaces `calculateBoth()` per-character loop
- **`DetailView.svelte` rewired** — `simulateCharacter()` replaces `getLevelBreakdown()` + `calculateBoth()`
- **`done80/done90` bug fixed** — was using `finalState.level` (always 90) instead of `context.character.nivel`
- **CSS import removed** from `PersonajesView.svelte` — broken path to nonexistent file
- **Time-unit bug fixed** — `cumulativeTime` and `metrics.totalTime` now in hours (not minutes); `xpPerHour` formula simplified
- **XP/dung column bug fixed** — `buildBreakdown()` now groups history steps by `levelBefore` instead of apportioning XP across level boundaries

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- `SimulationContext` is pure data (immutable, no `gameModel` or `eventBus` inside) — `GameModel` and `EventBus` injected as separate parameters to `simulateCharacter()`, avoiding circular dependencies and enabling dependency injection for tests
- `GameModel` methods return calculated changes (`evaluateLevelUp` returns `LevelUpEffects`) instead of mutating state — the kernel is the sole mutator
- `getActiveBuffs()` is recomputed each dungeon iteration from `state.level` + `context`, making buffs always consistent without manual tracking
- `count90` lives in the immutable `SimulationContext` — each character simulation gets the `count90` at the moment of its start; the roster loop increments `count90` between character simulations
- Optimizer kept unchanged (uses old `calculator.ts` functions) — `Strategy` interface defined but no migration yet per user instruction
- `SimulationState.totalTime` stored in **minutes** internally; always exported in **hours** at step/metrics boundary
- `buildBreakdown` attributes each history step's full `totalXP` to `levelBefore`, no cross-level apportionment
- `calculator.ts` kept alive for optimizer + `strategicValue.ts` + `Dashboard.svelte` (old consumers not yet migrated)

## Next Steps
1. Migrate `strategicValue.ts` to new engine (uses old `calculateForCharacter`)
2. Migrate `Dashboard.svelte` to new engine (uses old `simulator.ts`)
3. Rebuild optimizer as `Strategy` implementation on new kernel (future phase)
4. Delete `calculator.ts` and `simulator.ts` after no remaining consumers

## Critical Context
- `npm run check` — **0 errors, 0 warnings**
- `npm run build` — passes (was failing due to missing `personajes.css` import, now fixed)
- **CI known issue:** GitHub Actions runner forces Node.js 20 actions onto Node.js 24, producing deprecation warnings. Build and deploy steps now succeed after CSS fix
- **Sentinel bug fixed** — `l <= objetivo` → `l < objetivo` in both `getXpRemaining` (calculator.ts:7) and `getLevelBreakdown` (calculator.ts:207)
- **GameModel is the only WoW-aware code** — kernel, tables, event bus, and metrics know nothing about Warband, Timewalking, or specific level values
- Key types moved to simulation engine: `SimulationContext`, `SimulationState`, `SimulationResult`, `SimulationStep`, `SimulationMetrics`, `GameModel`, `TypedEventBus`, `SimulationHooks`
- Old types `SimulationResult`, `SimulationStep` in `src/lib/types.ts` are no longer used but still exist (no compile impact)

## Relevant Files
- `src/lib/simulation/` — **engine root**: types, event-bus, context, hooks, kernel, game-model, tables, barrel index
- `src/lib/simulation/types.ts` — all simulation interfaces: `CharacterSnapshot`, `SimulationContext`, `SimulationState`, `GameModel`, `SimulationResult`, `SimulationStep`, `SimulationMetrics`, etc.
- `src/lib/simulation/game-model/wow-retail.ts` — `WoWRetailModel`: buff pipeline + monster XP extrapolation warning
- `src/lib/simulation/kernel/simulate-character.ts` — **the event-driven loop** (single source of truth)
- `src/lib/simulation/kernel/simulate-roster.ts` — multi-character orchestration with dynamic `count90`
- `src/lib/simulation/kernel/metrics.ts` — `computeMetrics()`: precomputes all values for UI consumers
- `src/lib/format.ts` — `formatNumber()`, `formatHours()` (extracted from calculator.ts)
- `src/lib/views/LevelingView.svelte` — migrated: uses `simulateRoster()` for main table, old `optimize()` for order
- `src/lib/components/leveling/DetailView.svelte` — migrated: uses `simulateCharacter()`, `buildBreakdown()` (both bugs now fixed)
- `src/lib/components/leveling/DetailDrawer.svelte` — format import updated
- `src/lib/components/leveling/CalculationTable.svelte` — format import updated
- `src/lib/components/leveling/Dashboard.svelte` — **not migrated** (still uses old `simulator.ts` and `calculator.ts` totals)
- `src/lib/leveling/calculator.ts` — kept alive for optimizer + strategicValue + Dashboard; sentinel bug fixed
- `src/lib/leveling/simulator.ts` — kept alive for Dashboard + DungeonSimulation
- `src/lib/leveling/strategicValue.ts` — kept alive (uses old `calculateForCharacter`)
- `src/lib/leveling/optimizer.ts` — kept alive (uses old calculator); future `Strategy` interface in `src/lib/optimization/`
- `src/lib/optimization/types.ts` — `Strategy` interface + `OptimizationPlan` placeholder
- `.github/workflows/deploy.yml` — CI/CD workflow (build + deploy to GitHub Pages)
- `src/lib/views/PersonajesView.svelte` — removed broken import of missing `../../css/personajes.css`
