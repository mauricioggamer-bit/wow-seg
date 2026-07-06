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
- **Dashboard fully migrated** (`2bd62f6`): Eliminados todos los imports de `leveling/calculator.ts`, `leveling/simulator.ts`, `leveling/optimizer.ts`. Métricas derivadas de `results` (LevelingResult[]). `getTimeRecommendations()` → `buildRecs()`. `DungeonSimulation` usa `plan.entries`. Slider default = `patronSemanal` real. Mensajes contextuales cuando nadie llega a 90.
- **CI deploy fixes** (`576d22d`, `f44436b`): `cancel-in-progress: true` + step que borra stale artifacts "github-pages" via `gh api DELETE` antes del upload.
- **`ScoreBreakdown` interface** en `objective-function.ts`: `computeObjectiveScore()` retorna `{ score, breakdown }` con `xpTotalNorm`, `personajesA90Norm`, `tiempoAhorradoFuturoNorm`, `coberturaProfesionesNorm`, `tiempoTotalNorm`, `usoVentanaEventoNorm` + `contribucionPonderada`. Todos los callers actualizados (`strategy-comparator.ts`, `strategy-optimizer.ts`, tests).
- **`OptimizeResult` extendido** con `bestBreakdown: ScoreBreakdown`. `MultiStartResult.bestOverall` extendido con `breakdown`.
- **Off-by-one bug fixed** — `temporal-simulator.ts:100` usaba `getXpForLevel(nivel + 1)` en vez de `getXpForLevel(nivel)`; `calculator.ts:10,188` loops fijados de `nivel + 1` a `nivel`; `objective-function.ts:69` sentinel `+ getXpForLevel(maxLevel)` eliminado. Causaba que el viejo calculator subestimara tiempo (salteaba XP del primer nivel) y el nuevo simulador lo sobrestimara (sumaba 99,999,999 al pasar nivel 89).
- **Tests corregidos por el bug**: `temporal-simulator.test.ts:104` A90 0 → 1; `fase3-diagnostico.test.ts:150` `xpTotal` → `tiempoTotalHoras`; `score-breakdown-debug.test.ts` eliminado.
- **Roster real validado post-fix**: 8 personajes llegan a 90 (era 0 con el bug), score 20.89 vs 10.18 antes, optimizador encuentra +0.2051 mejora.
- **Todos los tests**: 86 passed, 13 suites (ALL PASS).
- **`npm run check`**: 0 errors, 1 warning (pre-existing `state_referenced_locally` en `Dashboard.svelte:48`).

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
- `calculator.ts` kept alive for optimizer + `strategicValue.ts` + old consumers (not yet fully migrated)
- `ScoreBreakdown` retornado por `computeObjectiveScore()` como `{ score, breakdown }` — todos los callers existentes extraen `.score`, nuevos consumers pueden acceder a `breakdown` para UI de depuración
- Dashboard fix `2bd62f6` está en código pero **no desplegado** (CI fallaba con múltiples artifacts). El fix debe verificarse tras deploy exitoso.
- Off-by-one XP fix: el bucle de leveling en ambos `temporal-simulator.ts` y `calculator.ts` debe arrancar desde `nivel` (no `nivel + 1`), y `objective-function.ts` no debe sumar XP del maxLevel como sentinel.

## Next Steps
1. Mostrar `ScoreBreakdown` en `OptimizationResult.svelte` (tooltip/panel de desglose)
2. Fix `RoiChart` para graficar `timeSavedForOthers` en vez de ROI neto (vacío cuando nadie llega a 90)
3. Per-character explanation tooltip basado en componentes del score + `computeFutureTimeSaved`
4. Commit & push — CI debe desplegar correctamente con cleanup de artifacts
5. Verificar Dashboard en navegador real (3 tabs)
6. Delete `calculator.ts` y `simulator.ts` tras migrar strategicValue y último consumer

## Critical Context
- **Dashboard fix no desplegado**: `2bd62f6` está en `main` pero el site `gh-pages` nunca se actualizó porque CI falló con "Multiple artifacts named github-pages". Tras `576d22d` y `f44436b`, el próximo push debería desplegar correctamente.
- `computeObjectiveScore` retorna `{ score, breakdown }` desde la última sesión. Todos los callers usan `.score`. `breakdown` disponible para UI de depuración.
- `OptimizeResult.bestBreakdown` y `MultiStartResult.bestOverall.breakdown` propagados pero aún no renderizados en UI.
- **Off-by-one bug corregido**: sin el fix, el simulador nuevo sobrestimaba tiempo ~999M XP por personaje y el viejo calculator subestimaba ~un nivel. Con el fix, 8 de 26 chars alcanzan 90 (vs 0 antes), score subió de 10.18 a 20.89.
- `npm run check` — **0 errors, 1 warning** (pre-existing `state_referenced_locally` en Dashboard.svelte:48)
- `npm test` — **86 passed, 13 suites (ALL PASS)**
- `optimizeStrategyMultiStart`: ~46ms en navegador real con roster 44 personajes.

## Relevant Files
- `src/lib/simulation/` — engine root: types, event-bus, context, hooks, kernel, game-model, tables, barrel index
- `src/lib/simulation/types.ts` — all simulation interfaces
- `src/lib/simulation/game-model/wow-retail.ts` — WoWRetailModel: buff pipeline + monster XP extrapolation warning
- `src/lib/simulation/kernel/simulate-character.ts` — event-driven loop (single source of truth)
- `src/lib/simulation/kernel/simulate-roster.ts` — multi-character orchestration with dynamic count90
- `src/lib/simulation/kernel/metrics.ts` — computeMetrics(): precomputes all values for UI consumers
- `src/lib/format.ts` — formatNumber(), formatHours() (extracted from calculator.ts)
- `src/lib/optimization/objective-function.ts` — ScoreBreakdown interface + computeObjectiveScore retorna { score, breakdown }
- `src/lib/optimization/strategy-comparator.ts` — StrategyResult con breakdown agregado
- `src/lib/optimization/strategy-optimizer.ts` — OptimizeResult + MultiStartResult con breakdown propagado
- `src/lib/optimization/temporal-simulator.ts` — temporal sim (level loop fix en línea 100)
- `src/lib/components/leveling/OptimizationResult.svelte` — target para mostrar breakdown en UI
- `src/lib/components/leveling/Dashboard.svelte` — migrado, pendiente verificar deploy
- `src/lib/components/leveling/RoiChart.svelte` — necesita cambiar a timeSavedForOthers
- `src/lib/views/LevelingView.svelte` — buildDashboardPlan con plan.entries, slider default = patronSemanal
- `.github/workflows/deploy.yml` — cleanup de stale artifacts + cancel-in-progress: true
