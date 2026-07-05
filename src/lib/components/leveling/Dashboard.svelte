<script lang="ts">
  import type { Personaje, LevelingConfig, LevelingResult, OptimizationPlan, SimulationResult, TimeRecommendation } from '../../types'
  import { formatHours, getTotalTimeHours, getTotalDungeons, getTotalXpRemaining, getAvgTimePerLevel } from '../../leveling/calculator'
  import { simulateByTime } from '../../leveling/simulator'
  import { getTimeRecommendations } from '../../leveling/simulator'
  import TimeChart from './TimeChart.svelte'
  import DungeonChart from './DungeonChart.svelte'
  import XpPerHourChart from './XpPerHourChart.svelte'
  import RoiChart from './RoiChart.svelte'
  import XpRemainingChart from './XpRemainingChart.svelte'
  import WarbandProgressChart from './WarbandProgressChart.svelte'
  import CompletedChart from './CompletedChart.svelte'
  import DungeonSimulation from './DungeonSimulation.svelte'

  let {
    personajes,
    config,
    count90,
    results,
    plan,
  }: {
    personajes: Personaje[]
    config: LevelingConfig
    count90: number
    results: LevelingResult[]
    plan: OptimizationPlan
  } = $props()

  let dashTab = $state('charts')
  let hoursPerWeek = $state(10)

  let totalTime = $derived(getTotalTimeHours(personajes, config, count90))
  let totalDungeons = $derived(getTotalDungeons(personajes, config, count90))
  let totalXp = $derived(getTotalXpRemaining(personajes, config, count90))
  let avgTimePerLevel = $derived(getAvgTimePerLevel(personajes, config, count90))
  let pendingCount = $derived(personajes.filter(p => p.nivel < 90).length)

  let sim = $derived(simulateByTime(personajes, config, count90, hoursPerWeek))
  let weeksNeeded = $derived(totalTime > 0 ? Math.ceil(totalTime / hoursPerWeek) : 0)
  let recs = $derived(getTimeRecommendations(personajes, config, count90, hoursPerWeek))

  let hoursSaved = $derived(plan.timeSaved)
  let nextBreakpoint = $derived(count90 < 5 ? Math.min((count90 + 1) * 5, 25) : null)
</script>

<div class="lvl-dashboard">
  <div class="lvl-dash-tabs" role="tablist">
    <button class="lvl-dash-tab" class:active={dashTab === 'charts'} role="tab" aria-selected={dashTab === 'charts'} onclick={() => dashTab = 'charts'}>📊 Gráficos</button>
    <button class="lvl-dash-tab" class:active={dashTab === 'sim'} role="tab" aria-selected={dashTab === 'sim'} onclick={() => dashTab = 'sim'}>🎯 Simulación</button>
  </div>

  {#if dashTab === 'charts'}
    <div class="lvl-dash-grid">
      <div class="lvl-dash-card">
        <div class="lvl-dash-card-title">Tiempo por personaje</div>
        <TimeChart {results} />
      </div>
      <div class="lvl-dash-card">
        <div class="lvl-dash-card-title">Dungeons por personaje</div>
        <DungeonChart {results} />
      </div>
      <div class="lvl-dash-card">
        <div class="lvl-dash-card-title">XP/hora por personaje</div>
        <XpPerHourChart {results} />
      </div>
      <div class="lvl-dash-card">
        <div class="lvl-dash-card-title">XP restante por personaje</div>
        <XpRemainingChart {results} />
      </div>
      <div class="lvl-dash-card">
        <div class="lvl-dash-card-title">ROI (horas ahorradas netas)</div>
        <RoiChart {results} />
      </div>
      <div class="lvl-dash-card">
        <div class="lvl-dash-card-title">Progreso Warband Mentor 80-90</div>
        <WarbandProgressChart {plan} />
      </div>
      <div class="lvl-dash-card">
        <div class="lvl-dash-card-title">Personajes completados</div>
        <CompletedChart {sim} totalPending={pendingCount} />
      </div>
    </div>
  {:else}
    <div class="lvl-dash-metrics">
      <div class="lvl-dm-item"><span>XP total pendiente</span><strong>{totalXp.toLocaleString('es-ES')}</strong></div>
      <div class="lvl-dm-item"><span>Dungeons totales</span><strong>{totalDungeons}</strong></div>
      <div class="lvl-dm-item"><span>Tiempo total</span><strong>{formatHours(totalTime)}</strong></div>
      <div class="lvl-dm-item"><span>Tiempo/nivel prom.</span><strong>{avgTimePerLevel > 0 ? formatHours(avgTimePerLevel) : '—'}</strong></div>
      <div class="lvl-dm-item"><span>Horas ahorradas</span><strong class="saved">{formatHours(hoursSaved)}</strong></div>
      <div class="lvl-dm-item">
        <span>Próximo breakpoint</span>
        <strong>{nextBreakpoint !== null ? `+${nextBreakpoint}%` : 'Máximo (25%)'}</strong>
      </div>
    </div>

    <div class="lvl-whatif">
      <div class="lvl-whatif-header">
        <span>Simulación: ¿Cuánto logro con</span>
        <input type="range" min="1" max="40" bind:value={hoursPerWeek} />
        <strong>{hoursPerWeek}h/semana?</strong>
      </div>
      <div class="lvl-whatif-stats">
        <div class="lvl-wf-stat"><span>Semanas para completar</span><strong>{weeksNeeded}</strong></div>
        <div class="lvl-wf-stat"><span>Completados</span><strong>{sim.charactersCompleted}/{pendingCount}</strong></div>
        <div class="lvl-wf-stat"><span>Dungeons</span><strong>{sim.totalDungeonsUsed}</strong></div>
        <div class="lvl-wf-stat"><span>Tiempo usado</span><strong>{formatHours(sim.totalTimeUsed)}</strong></div>
        <div class="lvl-wf-stat"><span>Llegan a 90</span><strong>{sim.count90Reached} pjs</strong></div>
      </div>

      {#if recs.length > 0}
        <div class="lvl-recs">
          <div class="lvl-recs-title">Recomendación:</div>
          {#each recs as rec}
            <div class="lvl-rec-item">
              <span class="lvl-rec-option">{rec.option}</span>
              <span class="lvl-rec-desc">{rec.description}</span>
              {#if rec.benefit > 0}
                <span class="lvl-rec-benefit">Beneficio: {formatHours(rec.benefit)} ahorrados</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if sim.steps.length > 0 && sim.charactersCompleted < pendingCount}
        <div class="lvl-whatif-progress">
          <div class="lvl-wf-progress-title">Progreso (orden óptimo):</div>
          {#each sim.steps as step (step.nombre)}
            <div class="lvl-wf-step" class:done={step.completed}>
              <span class="lvl-wf-step-name">{step.nombre}</span>
              {#if step.completed}
                <span class="lvl-wf-step-status">✓ Nivel {step.nivelFinal} {step.reached90 ? '(★90)' : ''}</span>
              {:else if step.dungeonsUsed > 0}
                <span class="lvl-wf-step-status">→ Nivel {step.nivelFinal} ({step.dungeonsUsed} dungs)</span>
              {:else}
                <span class="lvl-wf-step-status">— Sin tiempo</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <DungeonSimulation {personajes} {config} {count90} />
  {/if}
</div>

<style>
  .lvl-dashboard { display: flex; flex-direction: column; gap: 8px; }
  .lvl-dash-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border-subtle); }
  .lvl-dash-tab { background: none; border: none; padding: 6px 14px; font-size: 0.55rem; font-family: var(--font-heading); color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.12s; letter-spacing: 0.05em; }
  .lvl-dash-tab:hover { color: var(--gold-dim); }
  .lvl-dash-tab.active { color: var(--gold-light); border-bottom-color: var(--gold); }
  .lvl-dash-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  @media (max-width: 600px) { .lvl-dash-grid { grid-template-columns: 1fr; } }
  .lvl-dash-card { background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--r-sm); padding: 6px; display: flex; flex-direction: column; gap: 4px; }
  .lvl-dash-card-title { font-family: var(--font-heading); font-size: 0.5rem; color: var(--gold); text-transform: uppercase; letter-spacing: 0.05em; }
  .lvl-dash-metrics { display: flex; gap: 12px; flex-wrap: wrap; padding: 6px 8px; background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--r-sm); }
  .lvl-dm-item { display: flex; flex-direction: column; gap: 1px; }
  .lvl-dm-item span { font-size: 0.4rem; color: var(--text-muted); text-transform: uppercase; }
  .lvl-dm-item strong { font-size: 0.65rem; color: var(--gold-light, #d4af37); font-family: var(--font-heading); }
  .lvl-dm-item strong.saved { color: var(--green, #38a169); }
  .lvl-whatif { background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--r-sm); padding: 8px; display: flex; flex-direction: column; gap: 6px; }
  .lvl-whatif-header { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 0.6rem; color: var(--text-secondary); }
  .lvl-whatif-header input[type="range"] { width: 120px; }
  .lvl-whatif-header strong { color: var(--gold-light, #d4af37); font-size: 0.7rem; }
  .lvl-whatif-stats { display: flex; gap: 12px; flex-wrap: wrap; }
  .lvl-wf-stat { display: flex; flex-direction: column; gap: 1px; }
  .lvl-wf-stat span { font-size: 0.4rem; color: var(--text-muted); text-transform: uppercase; }
  .lvl-wf-stat strong { font-size: 0.65rem; color: var(--gold-light, #d4af37); font-family: var(--font-heading); }
  .lvl-recs { padding-top: 4px; border-top: 1px solid var(--border-subtle); }
  .lvl-recs-title { font-size: 0.5rem; color: var(--text-muted); margin-bottom: 2px; }
  .lvl-rec-item { display: flex; flex-direction: column; gap: 1px; padding: 3px 6px; background: rgba(255,215,0,0.05); border-left: 2px solid var(--gold); border-radius: var(--r-sm); margin-bottom: 2px; }
  .lvl-rec-option { font-size: 0.55rem; color: var(--gold-light, #d4af37); font-weight: 600; }
  .lvl-rec-desc { font-size: 0.48rem; color: var(--text-secondary); }
  .lvl-rec-benefit { font-size: 0.45rem; color: var(--green, #38a169); }
  .lvl-whatif-progress { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; border-top: 1px solid var(--border-subtle); }
  .lvl-wf-progress-title { font-size: 0.5rem; color: var(--text-muted); margin-bottom: 2px; }
  .lvl-wf-step { display: flex; justify-content: space-between; padding: 2px 4px; font-size: 0.5rem; border-radius: var(--r-sm); }
  .lvl-wf-step.done { background: rgba(56, 161, 105, 0.1); }
  .lvl-wf-step-name { color: var(--text-primary); font-weight: 600; }
  .lvl-wf-step-status { color: var(--text-secondary); }
  .lvl-wf-step.done .lvl-wf-step-status { color: var(--green, #38a169); }
</style>