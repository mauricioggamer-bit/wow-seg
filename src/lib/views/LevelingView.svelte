<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { levelingStore } from '../stores/leveling'
  import type { LevelingResult } from '../types'
  import {
    calculateBoth,
    getWarbandMentor8090FromRoster,
    getTotalTimeHours,
    getTotalDungeons,
    getTotalTimeTo80,
    getTotalDungeonsTo80,
    formatHours,
    formatNumber,
  } from '../leveling/calculator'
  import { getDungeonXpForLevel } from '../constants/experience'
  import { calculateStrategicValue } from '../leveling/strategicValue'
  import { optimize } from '../leveling/optimizer'
  import ConfigPanel from '../components/leveling/ConfigPanel.svelte'
  import CalculationTable from '../components/leveling/CalculationTable.svelte'
  import OptimizationResult from '../components/leveling/OptimizationResult.svelte'
  import DetailView from '../components/leveling/DetailView.svelte'
  import Dashboard from '../components/leveling/Dashboard.svelte'

  let showConfig = $state(false)
  let showOptimization = $state(false)
  let showDashboard = $state(false)
  let selectedChar = $state<string | null>(null)

  let personajes = $derived($personajesStore.filter(p => p.planeado_usar))
  let config = $derived($levelingStore)
  let count90 = $derived(personajes.filter(p => p.nivel >= 90).length)
  let warbandMentor8090 = $derived(getWarbandMentor8090FromRoster($personajesStore))

  let results = $derived<LevelingResult[]>(
    personajes
      .map(p => {
        const dual = calculateBoth(p, config, count90)
        const sv = calculateStrategicValue(p, config, personajes, count90)
        return {
          nombre: p.nombre,
          clase: p.clase,
          nivel: p.nivel,
          xpTo80: dual.xpTo80,
          dungeonsTo80: dual.dungeonsTo80,
          timeTo80: dual.timeTo80,
          xpTo90: dual.xpTo90,
          dungeonsTo90: dual.dungeonsTo90,
          timeTo90: dual.timeTo90,
          xpPerHour: dual.xpPerHour,
          done80: dual.done80,
          done90: dual.done90,
          roi: sv.warbandImpact,
          strategicStars: sv.stars,
          strategicText: sv.reasons.join(' '),
          warbandImpact: sv.warbandImpact,
        }
      })
      .sort((a, b) => {
        if (a.done90 && !b.done90) return 1
        if (!a.done90 && b.done90) return -1
        return a.dungeonsTo90 - b.dungeonsTo90
      })
  )

  let totalTime = $derived(getTotalTimeHours(personajes, config, count90))
  let totalDungeons = $derived(getTotalDungeons(personajes, config, count90))
  let totalTime80 = $derived(getTotalTimeTo80(personajes, config, count90))
  let totalDungeons80 = $derived(getTotalDungeonsTo80(personajes, config, count90))
  let pendingCount = $derived(personajes.filter(p => p.nivel < 90).length)
  let pending80Count = $derived(personajes.filter(p => p.nivel < 80).length)

  let selectedResult = $derived(results.find(r => r.nombre === selectedChar))
  let selectedPersonaje = $derived($personajesStore.find(p => p.nombre === selectedChar))
  let optimizationPlan = $derived(optimize(personajes, config, count90))

  function toggleConfig() { showConfig = !showConfig }
  function toggleOptimization() { showOptimization = !showOptimization }
  function toggleDashboard() { showDashboard = !showDashboard }
</script>

<div class="lvl-view">
  <div class="lvl-topbar">
    <div class="lvl-buff-summary">
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Warband 0-80</span>
        <span class="lvl-buff-val">+{config.warbandMentor080}%</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Warband 80-90</span>
        <span class="lvl-buff-val">+{warbandMentor8090}%</span>
        {#if count90 < 5}
          <span class="lvl-buff-next">Próximo: +{Math.min((count90 + 1) * 5, 25)}% (faltan {1} pj)</span>
        {/if}
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Timeways</span>
        <span class="lvl-buff-val">+{config.knowledgeOfTimeways}%</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">War Mode</span>
        <span class="lvl-buff-val" class:on={config.warMode} class:off={!config.warMode}>{config.warMode ? 'ON' : 'OFF'}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">XP/dung @80</span>
        <span class="lvl-buff-val">{formatNumber(getDungeonXpForLevel(80))}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Duración</span>
        <span class="lvl-buff-val">{config.duracionDungeon}min</span>
      </div>
    </div>
    <div class="lvl-toolbar">
      <button class="wow-btn wow-btn-sm" onclick={toggleDashboard}>{showDashboard ? '✕ Dashboard' : '📊 Dashboard'}</button>
      <button class="wow-btn wow-btn-sm" onclick={toggleOptimization}>{showOptimization ? '✕ Optimizar' : '⚡ Optimizar'}</button>
      <button class="wow-btn wow-btn-sm" onclick={toggleConfig}>{showConfig ? '✕ Cerrar' : '⚙ Config'}</button>
    </div>
  </div>

  <div class="lvl-dashboard-strip">
    <div class="lvl-dash-item">
      <span class="lvl-dash-label">→80 Tiempo</span>
      <span class="lvl-dash-val">{formatHours(totalTime80)}</span>
    </div>
    <div class="lvl-dash-item">
      <span class="lvl-dash-label">→80 Dungs</span>
      <span class="lvl-dash-val">{totalDungeons80}</span>
    </div>
    <div class="lvl-dash-item">
      <span class="lvl-dash-label">→90 Tiempo</span>
      <span class="lvl-dash-val">{formatHours(totalTime)}</span>
    </div>
    <div class="lvl-dash-item">
      <span class="lvl-dash-label">→90 Dungs</span>
      <span class="lvl-dash-val">{totalDungeons}</span>
    </div>
    <div class="lvl-dash-item">
      <span class="lvl-dash-label">Pendientes 80</span>
      <span class="lvl-dash-val">{pending80Count}/{personajes.length}</span>
    </div>
    <div class="lvl-dash-item">
      <span class="lvl-dash-label">Pendientes 90</span>
      <span class="lvl-dash-val">{pendingCount}/{personajes.length}</span>
    </div>
    <div class="lvl-dash-item">
      <span class="lvl-dash-label">Nivel 90</span>
      <span class="lvl-dash-val">{count90} pjs</span>
    </div>
  </div>

  {#if showOptimization}
    <OptimizationResult plan={optimizationPlan} />
  {/if}

  {#if showDashboard}
    <Dashboard {personajes} {config} {count90} {results} plan={optimizationPlan} />
  {/if}

  {#if showConfig}
    <ConfigPanel />
  {/if}

  <CalculationTable {results} onSelect={(nombre) => selectedChar = selectedChar === nombre ? null : nombre} />

  {#if selectedResult && selectedPersonaje}
    <div class="lvl-detail">
      <div class="lvl-detail-header">
        <h3>{selectedResult.nombre} — {selectedResult.clase}</h3>
        <button class="lvl-detail-close" onclick={() => selectedChar = null}>✕</button>
      </div>
      <div class="lvl-detail-summary">
        <div class="lvl-detail-stat">
          <span>Nivel</span>
          <strong>{selectedResult.nivel}</strong>
        </div>
        <div class="lvl-detail-stat">
          <span>XP/h</span>
          <strong>{formatNumber(selectedResult.xpPerHour)}</strong>
        </div>
        {#if !selectedResult.done80}
          <div class="lvl-detail-stat">
            <span>→80 Dungs</span>
            <strong>{selectedResult.dungeonsTo80}</strong>
          </div>
          <div class="lvl-detail-stat">
            <span>→80 Horas</span>
            <strong>{formatHours(selectedResult.timeTo80)}</strong>
          </div>
        {/if}
        <div class="lvl-detail-stat">
          <span>→90 Dungs</span>
          <strong>{selectedResult.done90 ? '✓' : selectedResult.dungeonsTo90}</strong>
        </div>
        <div class="lvl-detail-stat">
          <span>→90 Horas</span>
          <strong>{selectedResult.done90 ? '✓' : formatHours(selectedResult.timeTo90)}</strong>
        </div>
      </div>
      <DetailView personaje={selectedPersonaje} {config} roster={personajes} {count90} />
    </div>
  {/if}
</div>

<style>
  .lvl-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px 0;
  }
  .lvl-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .lvl-buff-summary {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .lvl-buff-item-sm {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3px 8px;
    background: var(--bg-soft, rgba(0,0,0,0.3));
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    font-size: 0.5rem;
  }
  .lvl-buff-label {
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.45rem;
  }
  .lvl-buff-val {
    font-family: var(--font-heading);
    color: var(--gold);
    font-weight: 600;
  }
  .lvl-buff-val.on { color: var(--green, #38a169); }
  .lvl-buff-val.off { color: var(--text-dim); }
  .lvl-buff-next {
    font-size: 0.4rem;
    color: var(--text-dim);
  }
  .lvl-toolbar {
    display: flex;
    gap: 4px;
  }
  .lvl-dashboard-strip {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 4px 0;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
  }
  .lvl-dash-item {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .lvl-dash-label {
    font-size: 0.45rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .lvl-dash-val {
    font-family: var(--font-heading);
    font-size: 0.7rem;
    color: var(--gold-light, #d4af37);
    font-weight: 600;
  }
  .lvl-detail {
    background: var(--bg-soft, rgba(0,0,0,0.3));
    border: 1px solid var(--gold);
    border-radius: var(--r-md);
    padding: 8px;
  }
  .lvl-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .lvl-detail-header h3 {
    font-size: 0.7rem;
    color: var(--gold);
  }
  .lvl-detail-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.7rem;
  }
  .lvl-detail-summary {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    padding-bottom: 6px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--border-subtle);
    font-size: 0.6rem;
  }
  .lvl-detail-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .lvl-detail-stat span {
    font-size: 0.45rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .lvl-detail-stat strong {
    font-size: 0.65rem;
    color: var(--gold-light, #d4af37);
  }
</style>