<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { currentWarband } from '../stores/ui'
  import { levelingStore } from '../stores/leveling'
  import type { LevelingResult, Personaje } from '../types'
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
  import { calculateStrategicValue } from '../leveling/strategicValue'
  import { optimize } from '../leveling/optimizer'
  import Modal from '../components/leveling/Modal.svelte'
  import DetailDrawer from '../components/leveling/DetailDrawer.svelte'
  import DungeonXpModal from '../components/leveling/DungeonXpModal.svelte'
  import ConfigPanel from '../components/leveling/ConfigPanel.svelte'
  import CalculationTable from '../components/leveling/CalculationTable.svelte'
  import OptimizationResult from '../components/leveling/OptimizationResult.svelte'
  import Dashboard from '../components/leveling/Dashboard.svelte'

  let showConfig = $state(false)
  let showOptimization = $state(false)
  let showDashboard = $state(false)
  let showDungeonXp = $state(false)
  let selectedChar = $state<string | null>(null)

  let activeWarband = $derived($currentWarband && $currentWarband !== '' ? $currentWarband : null)
  let personajes = $derived(
    $personajesStore
      .filter(p => p.planeado_usar)
      .filter(p => !activeWarband || p.warband === activeWarband)
  )
  let config = $derived($levelingStore)
  let count90 = $derived(personajes.filter(p => p.nivel >= 90).length)
  let warbandMentor8090 = $derived(getWarbandMentor8090FromRoster($personajesStore))

  let totalTime = $derived(getTotalTimeHours(personajes, config, count90))
  let totalDungeons = $derived(getTotalDungeons(personajes, config, count90))
  let totalTime80 = $derived(getTotalTimeTo80(personajes, config, count90))
  let totalDungeons80 = $derived(getTotalDungeonsTo80(personajes, config, count90))
  let pendingCount = $derived(personajes.filter(p => p.nivel < 90).length)
  let pending80Count = $derived(personajes.filter(p => p.nivel < 80).length)

  let optimizationPlan = $derived(optimize(personajes, config, count90))

  let roiMap = $derived(new Map(optimizationPlan.entries.map(e => [e.nombre, e.roi])))

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
          roi: roiMap.get(p.nombre) ?? 0,
          strategicStars: sv.stars,
          strategicText: sv.reasons.join(' '),
          strategicScore: sv.totalScore,
          warbandImpact: sv.warbandImpact,
        }
      })
      .sort((a, b) => {
        if (a.done90 && !b.done90) return 1
        if (!a.done90 && b.done90) return -1
        return a.dungeonsTo90 - b.dungeonsTo90
      })
  )

  let selectedResult = $derived(results.find(r => r.nombre === selectedChar))
  let selectedPersonaje = $derived($personajesStore.find(p => p.nombre === selectedChar))

  let drawerOpen = $derived(!!selectedChar && !!selectedResult && !!selectedPersonaje)

  function toggleConfig() { showConfig = !showConfig }
  function toggleOptimization() { showOptimization = !showOptimization }
  function toggleDashboard() { showDashboard = !showDashboard }
  function toggleDungeonXp() { showDungeonXp = !showDungeonXp }
  function selectChar(nombre: string) { selectedChar = selectedChar === nombre ? null : nombre }
  function closeDrawer() { selectedChar = null }

  function exportCSVData() {
    const csv = dataStore.exportCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wow_personajes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPlanJSON() {
    const planData = JSON.stringify({
      plan: optimizationPlan,
      config,
      results,
      exportedAt: new Date().toISOString(),
    }, null, 2)
    const blob = new Blob([planData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wow_leveling_plan.json'
    a.click()
    URL.revokeObjectURL(url)
  }
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
        <span class="lvl-buff-bar">{'█'.repeat(count90)}{'░'.repeat(5 - count90)}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">War Mode</span>
        <span class="lvl-buff-val" class:on={config.warMode} class:off={!config.warMode}>{config.warMode ? 'ON' : 'OFF'}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Duración</span>
        <span class="lvl-buff-val">{config.duracionDungeon}min</span>
      </div>
      <div class="lvl-divider" aria-hidden="true"></div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">→80 Tiempo</span>
        <span class="lvl-buff-val">{formatHours(totalTime80)}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">→80 Dungs</span>
        <span class="lvl-buff-val">{totalDungeons80}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">→90 Tiempo</span>
        <span class="lvl-buff-val">{formatHours(totalTime)}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">→90 Dungs</span>
        <span class="lvl-buff-val">{totalDungeons}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Pendientes 80</span>
        <span class="lvl-buff-val">{pending80Count}/{personajes.length}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Pendientes 90</span>
        <span class="lvl-buff-val">{pendingCount}/{personajes.length}</span>
      </div>
      <div class="lvl-buff-item-sm">
        <span class="lvl-buff-label">Nivel 90</span>
        <span class="lvl-buff-val">{count90} pjs</span>
      </div>
    </div>
    <div class="lvl-toolbar">
      <button class="wow-btn wow-btn-sm" onclick={toggleDashboard}>{showDashboard ? '✕ Dashboard' : '📊 Dashboard'}</button>
      <button class="wow-btn wow-btn-sm" onclick={toggleOptimization}>{showOptimization ? '✕ Optimizar' : '⚡ Optimizar'}</button>
      <button class="wow-btn wow-btn-sm" onclick={toggleDungeonXp}>🏰 XP Mazmorra</button>
      <button class="wow-btn wow-btn-sm" onclick={toggleConfig}>{showConfig ? '✕ Cerrar' : '⚙ Config'}</button>
      <button class="wow-btn wow-btn-sm" onclick={exportCSVData}>📥 CSV</button>
      <button class="wow-btn wow-btn-sm" onclick={exportPlanJSON}>📋 Plan</button>
    </div>
  </div>

  <CalculationTable {results} personajes={$personajesStore.filter(p => p.planeado_usar)} onSelect={selectChar} />
</div>

<Modal bind:open={showDashboard} title="Dashboard">
  <Dashboard {personajes} {config} {count90} {results} plan={optimizationPlan} />
</Modal>

<Modal bind:open={showOptimization} title="Optimización">
  <OptimizationResult plan={optimizationPlan} />
</Modal>

<Modal bind:open={showConfig} title="Configuración">
  <ConfigPanel />
</Modal>

<DungeonXpModal bind:open={showDungeonXp} />

<DetailDrawer
  open={drawerOpen}
  result={selectedResult}
  personaje={selectedPersonaje}
  {config}
  roster={personajes}
  {count90}
  onClose={closeDrawer}
/>

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
    align-items: stretch;
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
  .lvl-divider {
    width: 1px;
    background: var(--border-subtle);
    align-self: stretch;
    margin: 0 2px;
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
  .lvl-buff-bar {
    font-family: var(--font-heading);
    font-size: 0.55rem;
    color: var(--gold);
    letter-spacing: 1px;
    display: block;
    line-height: 1;
  }
  .lvl-toolbar {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
</style>