<script lang="ts">
  import type { Personaje, LevelingConfig, OptimizationPlan } from '../../types'
  import { formatHours, formatNumber } from '../../format'
  import { clsClass } from '../../constants'

  let {
    personajes,
    config,
    count90,
    plan,
  }: {
    personajes: Personaje[]
    config: LevelingConfig
    count90: number
    plan: OptimizationPlan
  } = $props()

  let dungeonCount = $state(20)

  let dungeonRanges = $derived((() => {
    let cumDungeon = 0
    const maxDungs = dungeonCount
    const result: { nombre: string; clase: string; start: number; end: number; nivelInicial: number; nivelFinal: number; completed: boolean }[] = []
    for (const e of plan.entries) {
      if (maxDungs <= 0) break
      const dungsForChar = Math.min(e.dungeonsTo90, maxDungs)
      if (dungsForChar <= 0) continue
      const start = cumDungeon + 1
      const end = cumDungeon + dungsForChar
      cumDungeon = end
      result.push({
        nombre: e.nombre,
        clase: e.clase,
        start,
        end,
        nivelInicial: e.nivel,
        nivelFinal: dungsForChar >= e.dungeonsTo90 ? e.objetivoNivel : e.nivel,
        completed: dungsForChar >= e.dungeonsTo90,
      })
    }
    return result
  })())
</script>

<div class="lvl-dung-sim">
  <div class="lvl-dung-header">
    <span>Simular:</span>
    <input type="range" min="1" max="100" bind:value={dungeonCount} />
    <strong>{dungeonCount} dungeons de Timewalking</strong>
  </div>

  <div class="lvl-dung-stats">
    <div class="lvl-ds-stat">
      <span>Dungeons usados</span>
      <strong>{dungeonRanges.reduce((s, r) => s + (r.end - r.start + 1), 0)}</strong>
    </div>
    <div class="lvl-ds-stat">
      <span>Tiempo total</span>
      <strong>{formatHours(dungeonRanges.reduce((s, r) => s + (r.end - r.start + 1), 0) * config.duracionDungeon / 60)}</strong>
    </div>
    <div class="lvl-ds-stat">
      <span>Completados</span>
      <strong>{dungeonRanges.filter(r => r.completed).length}</strong>
    </div>
    <div class="lvl-ds-stat">
      <span>Llegan a 90</span>
      <strong>{dungeonRanges.filter(r => r.completed).length}</strong>
    </div>
  </div>

  {#if dungeonRanges.length > 0}
    <div class="lvl-dung-dist">
      <div class="lvl-dung-dist-title">Distribución óptima:</div>
      {#each dungeonRanges as dr (dr.nombre)}
        <div class="lvl-dung-row" class:done={dr.completed}>
          <span class="lvl-dung-range">Dungeon {dr.start}–{dr.end}</span>
          <span class="lvl-dung-char" style="color: {clsClass(dr.clase)}">{dr.nombre}</span>
          <span class="lvl-dung-levels">{dr.nivelInicial} → {dr.nivelFinal} {dr.completed ? '★' : ''}</span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="lvl-dung-empty">Sin personajes pendientes</p>
  {/if}
</div>

<style>
  .lvl-dung-sim {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: rgba(0,0,0,0.25);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
  }
  .lvl-dung-header {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 0.6rem;
    color: var(--text-secondary);
  }
  .lvl-dung-header input[type="range"] { width: 120px; }
  .lvl-dung-header strong { color: var(--gold-light, #d4af37); font-size: 0.7rem; }
  .lvl-dung-stats { display: flex; gap: 12px; flex-wrap: wrap; }
  .lvl-ds-stat { display: flex; flex-direction: column; gap: 1px; }
  .lvl-ds-stat span { font-size: 0.4rem; color: var(--text-muted); text-transform: uppercase; }
  .lvl-ds-stat strong { font-size: 0.65rem; color: var(--gold-light, #d4af37); font-family: var(--font-heading); }
  .lvl-dung-dist {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 4px;
    border-top: 1px solid var(--border-subtle);
  }
  .lvl-dung-dist-title { font-size: 0.5rem; color: var(--text-muted); margin-bottom: 2px; }
  .lvl-dung-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 6px;
    background: rgba(255,255,255,0.03);
    border-radius: var(--r-sm);
    border-left: 2px solid var(--gold);
    font-size: 0.5rem;
  }
  .lvl-dung-row.done { border-left-color: var(--green, #38a169); }
  .lvl-dung-range { color: var(--gold); font-family: var(--font-heading); white-space: nowrap; }
  .lvl-dung-char { font-weight: 600; }
  .lvl-dung-levels { color: var(--text-muted); }
  .lvl-dung-empty { font-size: 0.5rem; color: var(--text-dim); text-align: center; padding: 8px; }
</style>