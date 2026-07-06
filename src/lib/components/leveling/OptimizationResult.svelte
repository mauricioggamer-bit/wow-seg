<script lang="ts">
  import type { MultiStartResult } from '../../optimization/strategy-optimizer'
  import type { Personaje, LevelingConfig } from '../../types'
  import type { RosterState } from '../../optimization/roster-state'
  import { computeFutureTimeSaved } from '../../optimization/future-time-saved'
  import { formatHours, formatNumber } from '../../format'
  import { clsClass } from '../../constants'

  let {
    result,
    roster,
    config,
  }: {
    result: MultiStartResult
    roster: Personaje[]
    config: LevelingConfig
  } = $props()

  let outcome = $derived(result.bestOverall.result.outcome)
  let bestStrategy = $derived(result.bestOverall.strategy)

  let initialCount90 = $derived(roster.filter(p => p.planeado_usar && p.nivel >= 90).length)
  let a90Achieved = $derived(new Set(outcome.personajesNombreA90))

  interface EntryDisplay {
    nombre: string
    clase: string
    nivel: number
    orden: number
    timeSavedForOthers: number
    llegaA90: boolean
    accion: string
  }

  let entries = $derived.by<EntryDisplay[]>(() => {
    let count90SoFar = initialCount90
    return bestStrategy.decisiones.map((d, i) => {
      const rs: RosterState = {
        count90: count90SoFar, warbandMentorBuff: 0, horasConsumidas: 0,
        horasDisponiblesSemana: 0, fechaActual: new Date(), fechaLimiteEvento: new Date(), diasRestantesEvento: 0,
      }
      const timeSaved = d.personaje.nivel < 90 && d.personaje.nivel >= 80 && !a90Achieved.has(d.personaje.nombre)
        ? computeFutureTimeSaved(d.personaje, rs, roster.filter(p => p.planeado_usar), config)
        : 0
      if (a90Achieved.has(d.personaje.nombre)) count90SoFar++
      return {
        nombre: d.personaje.nombre,
        clase: d.personaje.clase,
        nivel: d.personaje.nivel,
        orden: i + 1,
        timeSavedForOthers: timeSaved,
        llegaA90: a90Achieved.has(d.personaje.nombre),
        accion: d.accion === 'subir-a-90' ? 'sube a 90' : d.accion,
      }
    })
  })

  let buffFinal = $derived(Math.min(initialCount90 + outcome.personajesA90, 5) * 5)
</script>

<div class="lvl-opt-result">
  <div class="lvl-opt-metrics">
    <div class="lvl-opt-metric">
      <span class="lvl-opt-metric-label">Score</span>
      <span class="lvl-opt-metric-val">{result.bestOverall.score.toFixed(2)}</span>
    </div>
    <div class="lvl-opt-metric">
      <span class="lvl-opt-metric-label">XP total</span>
      <span class="lvl-opt-metric-val">{formatNumber(outcome.xpTotal)}</span>
    </div>
    <div class="lvl-opt-metric">
      <span class="lvl-opt-metric-label">Tiempo</span>
      <span class="lvl-opt-metric-val">{formatHours(outcome.tiempoTotalHoras)}</span>
    </div>
    <div class="lvl-opt-metric">
      <span class="lvl-opt-metric-label">→90</span>
      <span class="lvl-opt-metric-val">{outcome.personajesA90}</span>
    </div>
    <div class="lvl-opt-metric">
      <span class="lvl-opt-metric-label">Profesiones</span>
      <span class="lvl-opt-metric-val">{outcome.profesionesCubiertas.size}/11</span>
    </div>
    <div class="lvl-opt-metric">
      <span class="lvl-opt-metric-label">Warband</span>
      <span class="lvl-opt-metric-val">+{buffFinal}%</span>
    </div>
  </div>

  {#if result.mejoraSobreSingleStart > 0}
    <div class="lvl-opt-savings">
      <span>Multi-start mejora <strong>+{result.mejoraSobreSingleStart.toFixed(4)}</strong> sobre single-start</span>
    </div>
  {/if}

  <ol class="lvl-opt-list">
    {#each entries as e (e.nombre)}
      <li class="lvl-opt-item">
        <div class="lvl-opt-rank">{e.orden}</div>
        <div class="lvl-opt-info">
          <span class="lvl-opt-name" style="color: {clsClass(e.clase)}">{e.nombre}</span>
          <span class="lvl-opt-desc">
            Nv{e.nivel} — {e.accion}
            {#if e.llegaA90}
              <span class="lvl-opt-done">✓</span>
            {/if}
          </span>
        </div>
        <div class="lvl-opt-meta">
          {#if e.timeSavedForOthers > 0}
            <span class="lvl-opt-saved">↓ {formatHours(e.timeSavedForOthers)} ahorrados</span>
          {/if}
        </div>
      </li>
    {/each}
  </ol>

  <div class="lvl-opt-footer">
    <span class="lvl-opt-footer-text">
      {result.runsPorSemilla.length} semillas ({result.runsPorSemilla.map(r => r.seedNumerico).join(', ')})
      — {result.runsPorSemilla.reduce((s, r) => s + r.iteraciones, 0)} iteraciones totales
    </span>
  </div>
</div>

<style>
  .lvl-opt-result {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: rgba(0,0,0,0.25);
    border: 1px solid var(--gold);
    border-radius: var(--r-sm);
  }
  .lvl-opt-metrics {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .lvl-opt-metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3px 8px;
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    min-width: 50px;
  }
  .lvl-opt-metric-label {
    font-size: 0.45rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .lvl-opt-metric-val {
    font-family: var(--font-heading);
    font-size: 0.6rem;
    color: var(--gold);
    font-weight: 600;
  }
  .lvl-opt-savings {
    font-size: 0.55rem;
    color: var(--green, #38a169);
    text-align: center;
  }
  .lvl-opt-savings strong {
    font-weight: 700;
  }
  .lvl-opt-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lvl-opt-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 4px 6px;
    background: rgba(255,255,255,0.03);
    border-radius: var(--r-sm);
    border-left: 2px solid var(--gold);
  }
  .lvl-opt-rank {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--gold);
    color: #000;
    font-size: 0.55rem;
    font-weight: 700;
    font-family: var(--font-heading);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lvl-opt-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .lvl-opt-name {
    font-size: 0.6rem;
    font-weight: 700;
  }
  .lvl-opt-desc {
    font-size: 0.5rem;
    color: var(--text-muted);
  }
  .lvl-opt-done {
    color: var(--green, #38a169);
    font-weight: 700;
  }
  .lvl-opt-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    flex-shrink: 0;
  }
  .lvl-opt-saved {
    font-size: 0.5rem;
    color: var(--green, #38a169);
    white-space: nowrap;
  }
  .lvl-opt-footer {
    text-align: center;
    padding-top: 4px;
    border-top: 1px solid var(--border-subtle);
  }
  .lvl-opt-footer-text {
    font-size: 0.45rem;
    color: var(--text-dim);
  }
</style>
