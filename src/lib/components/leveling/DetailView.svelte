<script lang="ts">
  import type { Personaje, LevelingConfig } from '../../types'
  import { formatNumber, formatHours } from '../../format'
  import { calculateStrategicValue } from '../../leveling/strategicValue'
  import { WoWRetailModel, simulateCharacter, createContext, createState, buildBreakdown } from '../../simulation'
  import type { SimulationResult } from '../../simulation'
  import StrategicValueDisplay from './StrategicValueDisplay.svelte'

  const gameModel = new WoWRetailModel()

  let {
    personaje,
    config,
    roster,
    count90,
    onEditChar,
  }: {
    personaje: Personaje
    config: LevelingConfig
    roster: Personaje[]
    count90: number
    onEditChar?: (name: string) => void
  } = $props()

  let simChar = $derived({
    nombre: personaje.nombre,
    clase: personaje.clase,
    nivel: personaje.nivel,
    xp: 0,
    objetivo: 90,
    timewaysPct: personaje.timewaysPct ?? 0,
  })

  let simScenario = $derived({
    expansion: 'retail',
    version: '11.0.2',
    activeEvent: null as string | null,
    dungeonDuration: config.duracionDungeon,
    globalBuffs: [] as { id: string; name: string; pct: number }[],
  })

  let simContext = $derived(createContext(simChar, simScenario, config, count90))
  let simState = $derived(createState(simChar))
  let simResult = $derived(simulateCharacter(simContext, simState, gameModel))
  let strategic = $derived(calculateStrategicValue(personaje, config, roster, count90))

  function getTo80(result: SimulationResult) {
    if (result.context.character.nivel >= 80) return { dungeons: 0, time: 0 }
    for (const step of result.history) {
      if (step.levelAfter >= 80) return { dungeons: step.cumulativeDungeons, time: step.cumulativeTime }
    }
    return { dungeons: result.metrics.totalDungeons, time: result.metrics.totalTime }
  }

  function getRangeValues(result: SimulationResult, target: number, nivel: number) {
    if (nivel >= target) return { xp: 0, dungs: 0, time: 0, done: true }
    for (const step of result.history) {
      if (step.levelAfter >= target) return { xp: step.cumulativeXP, dungs: step.cumulativeDungeons, time: step.cumulativeTime, done: false }
    }
    return { xp: result.metrics.totalXP, dungs: result.metrics.totalDungeons, time: result.metrics.totalTime, done: false }
  }

  let dual = $derived({
    done80: simResult.context.character.nivel >= 80,
    done90: simResult.context.character.nivel >= 90,
    dungeonsTo80: getTo80(simResult).dungeons,
    timeTo80: getTo80(simResult).time,
    dungeonsTo90: simResult.metrics.totalDungeons,
    timeTo90: simResult.metrics.totalTime,
    xpPerHour: simResult.metrics.xpPerHour,
  })

  let breakdown80 = $derived(buildBreakdown(simResult, gameModel, 80))
  let breakdown90 = $derived(buildBreakdown(simResult, gameModel, 90))

  let ranges = $derived(
    [60, 70, 80, 90]
      .filter(t => t > personaje.nivel)
      .map(t => ({ target: t, ...getRangeValues(simResult, t, personaje.nivel) }))
  )
</script>

<div class="lvl-detail-view">
  <div class="lvl-dv-header">
    <h4 class="lvl-bd-title">Detalle de nivel</h4>
    {#if onEditChar}
      <button class="lvl-edit-btn" onclick={() => onEditChar(personaje.nombre)} title="Editar personaje">✏️ Editar</button>
    {/if}
  </div>
  {#if dual.done90}
    <p class="lvl-done-msg">Nivel 90 alcanzado ✓</p>
  {:else}
    <div class="lvl-range-summary">
      <h4 class="lvl-bd-title">Resumen de objetivos</h4>
      <div class="lvl-range-grid">
        {#each ranges as r (r.target)}
          <div class="lvl-range-item" class:done={r.done}>
            <span class="lvl-range-target">→{r.target}</span>
            <span class="lvl-range-xp">{r.done ? '✓' : formatNumber(r.xp)}</span>
            <span class="lvl-range-dungs">{r.done ? '✓' : r.dungs + ' dungs'}</span>
            <span class="lvl-range-time">{r.done ? '✓' : formatHours(r.time)}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="lvl-breakdown-sections">
      {#if !dual.done80}
        <div class="lvl-bd-section">
          <h4 class="lvl-bd-title">Hasta nivel 80</h4>
          <table class="lvl-breakdown-table">
            <thead>
              <tr>
                <th>Nivel</th>
                <th>XP</th>
                <th>XP/dung</th>
                <th>Dungs</th>
                <th>∑Dungs</th>
                <th>∑Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {#each breakdown80 as entry (entry.level)}
                <tr>
                  <td class="lvl-bd-level">{entry.level}</td>
                  <td class="lvl-bd-num">{formatNumber(entry.xpNeeded)}</td>
                  <td class="lvl-bd-num">{formatNumber(entry.xpPerDungeon)}</td>
                  <td class="lvl-bd-num">{entry.dungeons}</td>
                  <td class="lvl-bd-num">{entry.cumulativeDungeons}</td>
                  <td class="lvl-bd-num">{formatHours(entry.cumulativeTime)}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="lvl-bd-total">Total →80</td>
                <td class="lvl-bd-num">{dual.dungeonsTo80}</td>
                <td class="lvl-bd-num">{formatHours(dual.timeTo80)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      {/if}

      <div class="lvl-bd-section">
        <h4 class="lvl-bd-title">Hasta nivel 90 {#if dual.done80}(desde 80){/if}</h4>
        <table class="lvl-breakdown-table">
          <thead>
            <tr>
              <th>Nivel</th>
              <th>XP</th>
              <th>XP/dung</th>
              <th>Dungs</th>
              <th>∑Dungs</th>
              <th>∑Tiempo</th>
            </tr>
          </thead>
          <tbody>
            {#each breakdown90 as entry (entry.level)}
              <tr class:at80={entry.level === 80}>
                <td class="lvl-bd-level">{entry.level}</td>
                <td class="lvl-bd-num">{formatNumber(entry.xpNeeded)}</td>
                <td class="lvl-bd-num">{formatNumber(entry.xpPerDungeon)}</td>
                <td class="lvl-bd-num">{entry.dungeons}</td>
                <td class="lvl-bd-num">{entry.cumulativeDungeons}</td>
                <td class="lvl-bd-num">{formatHours(entry.cumulativeTime)}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="lvl-bd-total">Total →90</td>
              <td class="lvl-bd-num">{dual.dungeonsTo90}</td>
              <td class="lvl-bd-num">{formatHours(dual.timeTo90)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  {/if}
  <StrategicValueDisplay {strategic} />
</div>

<style>
  .lvl-detail-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lvl-dv-header { display: flex; align-items: center; justify-content: space-between; }
  .lvl-edit-btn { background: none; border: 1px solid var(--gold-dim); border-radius: var(--r-sm); color: var(--gold-light); cursor: pointer; font-size: 0.5rem; padding: 2px 6px; font-family: var(--font-heading); transition: all var(--t-fast); }
  .lvl-edit-btn:hover { background: rgba(201,168,76,0.15); border-color: var(--gold); }
  .lvl-range-summary {
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
  }
  .lvl-range-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }
  @media (max-width: 400px) {
    .lvl-range-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .lvl-range-item {
    display: flex;
    flex-direction: column;
    padding: 4px;
    background: rgba(255,255,255,0.03);
    border-radius: var(--r-sm);
    text-align: center;
  }
  .lvl-range-item.done {
    opacity: 0.4;
  }
  .lvl-range-target {
    font-family: var(--font-heading);
    font-size: 0.55rem;
    color: var(--gold);
    font-weight: 700;
  }
  .lvl-range-xp {
    font-size: 0.45rem;
    color: var(--gold-light, #d4af37);
    font-variant-numeric: tabular-nums;
  }
  .lvl-range-dungs {
    font-size: 0.45rem;
    color: var(--text-secondary);
  }
  .lvl-range-time {
    font-size: 0.45rem;
    color: var(--text-muted);
  }
  .lvl-breakdown-sections {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lvl-bd-section {
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 4px;
    background: rgba(0,0,0,0.15);
  }
  .lvl-bd-title {
    font-size: 0.55rem;
    color: var(--gold);
    margin-bottom: 4px;
    font-family: var(--font-heading);
  }
  .lvl-breakdown-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.55rem;
  }
  .lvl-breakdown-table th {
    text-align: left;
    padding: 3px 6px;
    font-family: var(--font-heading);
    font-size: 0.45rem;
    color: var(--gold);
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-subtle);
  }
  .lvl-breakdown-table td {
    padding: 2px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: var(--text-secondary);
  }
  .lvl-breakdown-table tfoot td {
    border-top: 1px solid var(--border-subtle);
    font-weight: 600;
    color: var(--gold-light, #d4af37);
  }
  .lvl-breakdown-table tr.at80 {
    border-top: 2px solid var(--gold);
  }
  .lvl-breakdown-table tr.at80 td {
    padding-top: 4px;
  }
  .lvl-bd-level {
    color: var(--gold);
    font-weight: 600;
    font-family: var(--font-heading);
  }
  .lvl-bd-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .lvl-bd-total {
    text-align: left;
    font-family: var(--font-heading);
    text-transform: uppercase;
    font-size: 0.5rem;
  }
  .lvl-done-msg {
    color: var(--green, #38a169);
    font-size: 0.65rem;
    text-align: center;
    padding: 8px;
  }
</style>