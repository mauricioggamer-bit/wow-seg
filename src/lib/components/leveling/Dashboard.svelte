<script lang="ts">
  import type { Personaje, LevelingConfig, LevelingResult, OptimizationPlan, SimulationResult } from '../../types'
  import { formatHours, getTotalTimeHours, getTotalDungeons } from '../../leveling/calculator'
  import { simulateByTime } from '../../leveling/simulator'
  import TimeChart from './TimeChart.svelte'
  import DungeonChart from './DungeonChart.svelte'
  import WarbandEvolutionChart from './WarbandEvolutionChart.svelte'
  import RoiChart from './RoiChart.svelte'

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

  let hoursPerWeek = $state(10)

  let totalTime = $derived(getTotalTimeHours(personajes, config, count90))
  let totalDungeons = $derived(getTotalDungeons(personajes, config, count90))

  let sim = $derived(simulateByTime(personajes, config, count90, hoursPerWeek))
  let weeksNeeded = $derived(totalTime > 0 ? Math.ceil(totalTime / hoursPerWeek) : 0)

  let pendingCount = $derived(personajes.filter(p => p.nivel < 90).length)
  let avgDungeonsPerChar = $derived(pendingCount > 0 ? Math.round(totalDungeons / pendingCount) : 0)
</script>

<div class="lvl-dashboard">
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
      <div class="lvl-dash-card-title">Evolución Warband Mentor</div>
      <WarbandEvolutionChart {plan} />
    </div>

    <div class="lvl-dash-card">
      <div class="lvl-dash-card-title">Ahorro de tiempo por personaje</div>
      <RoiChart {plan} />
    </div>
  </div>

  <div class="lvl-whatif">
    <div class="lvl-whatif-header">
      <span>Simulación: ¿Cuánto logro con</span>
      <input type="range" min="1" max="40" bind:value={hoursPerWeek} />
      <strong>{hoursPerWeek}h/semana?</strong>
    </div>
    <div class="lvl-whatif-stats">
      <div class="lvl-wf-stat">
        <span>Semanas para completar todo</span>
        <strong>{weeksNeeded}</strong>
      </div>
      <div class="lvl-wf-stat">
        <span>Personajes completados</span>
        <strong>{sim.charactersCompleted}/{pendingCount}</strong>
      </div>
      <div class="lvl-wf-stat">
        <span>Dungeons esta semana</span>
        <strong>{sim.totalDungeonsUsed}</strong>
      </div>
      <div class="lvl-wf-stat">
        <span>Tiempo usado</span>
        <strong>{formatHours(sim.totalTimeUsed)}</strong>
      </div>
      <div class="lvl-wf-stat">
        <span>Llegan a 90</span>
        <strong>{sim.count90Reached} pjs</strong>
      </div>
    </div>

    {#if sim.steps.length > 0 && sim.charactersCompleted < pendingCount}
      <div class="lvl-whatif-progress">
        <div class="lvl-wf-progress-title">Progreso esta semana (orden óptimo):</div>
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
</div>

<style>
  .lvl-dashboard {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lvl-dash-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  @media (max-width: 600px) {
    .lvl-dash-grid {
      grid-template-columns: 1fr;
    }
  }
  .lvl-dash-card {
    background: rgba(0,0,0,0.25);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lvl-dash-card-title {
    font-family: var(--font-heading);
    font-size: 0.5rem;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .lvl-whatif {
    background: rgba(0,0,0,0.25);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lvl-whatif-header {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 0.6rem;
    color: var(--text-secondary);
  }
  .lvl-whatif-header input[type="range"] {
    width: 120px;
  }
  .lvl-whatif-header strong {
    color: var(--gold-light, #d4af37);
    font-size: 0.7rem;
  }
  .lvl-whatif-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .lvl-wf-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .lvl-wf-stat span {
    font-size: 0.4rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .lvl-wf-stat strong {
    font-size: 0.65rem;
    color: var(--gold-light, #d4af37);
    font-family: var(--font-heading);
  }
  .lvl-whatif-progress {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 4px;
    border-top: 1px solid var(--border-subtle);
  }
  .lvl-wf-progress-title {
    font-size: 0.5rem;
    color: var(--text-muted);
    margin-bottom: 2px;
  }
  .lvl-wf-step {
    display: flex;
    justify-content: space-between;
    padding: 2px 4px;
    font-size: 0.5rem;
    border-radius: var(--r-sm);
  }
  .lvl-wf-step.done {
    background: rgba(56, 161, 105, 0.1);
  }
  .lvl-wf-step-name {
    color: var(--text-primary);
    font-weight: 600;
  }
  .lvl-wf-step-status {
    color: var(--text-secondary);
  }
  .lvl-wf-step.done .lvl-wf-step-status {
    color: var(--green, #38a169);
  }
</style>