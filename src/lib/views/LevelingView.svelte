<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { currentWarband } from '../stores/ui'
  import { levelingStore } from '../stores/leveling'
  import type { LevelingResult, Personaje, LevelingConfig, OptimizationPlan, OptimizationEntry } from '../types'
  import { formatHours, formatNumber } from '../format'
  import { getWarbandMentor8090FromRoster } from '../leveling/calculator'
  import { calculateStrategicValue } from '../leveling/strategicValue'
  import { computeFutureTimeSaved } from '../optimization/future-time-saved'
  import type { RosterState } from '../optimization/roster-state'
  import { WoWRetailModel, simulateRoster } from '../simulation'
  import type { CharacterSnapshot, SimulationScenario } from '../simulation'
  import { optimizeStrategyMultiStart } from '../optimization/strategy-optimizer'
  import type { MultiStartResult } from '../optimization/strategy-optimizer'
  import type { ObjectiveWeights } from '../optimization/objective-function'
  import Modal from '../components/leveling/Modal.svelte'
  import DetailDrawer from '../components/leveling/DetailDrawer.svelte'
  import DungeonXpModal from '../components/leveling/DungeonXpModal.svelte'
  import ConfigPanel from '../components/leveling/ConfigPanel.svelte'
  import CalculationTable from '../components/leveling/CalculationTable.svelte'
  import OptimizationResult from '../components/leveling/OptimizationResult.svelte'
  import Dashboard from '../components/leveling/Dashboard.svelte'

  let { openCharEdit }: { openCharEdit?: (name: string) => void } = $props()

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

  const gameModel = new WoWRetailModel()
  const defaultWeights: ObjectiveWeights = {
    xpTotal: 20,
    personajesA90: 25,
    tiempoAhorradoFuturo: 20,
    coberturaProfesiones: 15,
    tiempoTotal: 20,
    usoVentanaEvento: 10,
  }

  let rosterSnapshots = $derived<CharacterSnapshot[]>(
    personajes.map(p => ({
      nombre: p.nombre,
      clase: p.clase,
      nivel: p.nivel,
      xp: 0,
      objetivo: 90,
      timewaysPct: p.timewaysPct ?? 0,
    }))
  )

  let scenario = $derived<SimulationScenario>({
    expansion: 'retail',
    version: '11.0.2',
    activeEvent: null,
    dungeonDuration: config.duracionDungeon,
    globalBuffs: [],
  })

  // Quick sync fallback for the main table order (before async optimization finishes)
  let fallbackOrder = $derived(personajes.filter(p => p.planeado_usar && p.nivel < 90).map(p => p.nombre))

  let optimizationResult = $state<MultiStartResult | null>(null)
  let isOptimizing = $state(false)
  let optimizationError = $state<string | null>(null)

  let horasDisponiblesSemana = $derived(
    config.patronSemanal
      ? config.patronSemanal.lunes + config.patronSemanal.martes + config.patronSemanal.miercoles
        + config.patronSemanal.jueves + config.patronSemanal.viernes + config.patronSemanal.sabado + config.patronSemanal.domingo
      : 40
  )

  let rosterOrder = $derived(
    optimizationResult
      ? optimizationResult.bestOverall.strategy.decisiones.map(d => d.personaje.nombre)
      : fallbackOrder
  )

  async function runOptimization() {
    if (isOptimizing) return
    isOptimizing = true
    optimizationError = null
    // Allow Svelte to flush loading state before blocking the main thread
    await new Promise(r => requestAnimationFrame(r))
    const t0 = performance.now()
    console.time('optimizeStrategyMultiStart')
    try {
      const result = optimizeStrategyMultiStart(
        $personajesStore,
        config,
        defaultWeights,
        horasDisponiblesSemana,
        new Date(),
        new Date('2026-08-11T23:59:59Z'),
        { patronSemanal: config.patronSemanal },
      )
      optimizationResult = result
    } catch (e) {
      optimizationError = e instanceof Error ? e.message : 'Error desconocido'
    } finally {
      console.timeEnd('optimizeStrategyMultiStart')
      console.log(`optimizeStrategyMultiStart — wall time ${(performance.now() - t0).toFixed(1)}ms`)
      isOptimizing = false
    }
  }

  async function toggleOptimization() {
    showOptimization = !showOptimization
    if (showOptimization && !optimizationResult && !isOptimizing) {
      await runOptimization()
    }
  }

  let rosterResult = $derived(
    simulateRoster(rosterSnapshots, scenario, config, gameModel, rosterOrder)
  )

  let pendingCount = $derived(personajes.filter(p => p.nivel < 90).length)
  let pending80Count = $derived(personajes.filter(p => p.nivel < 80).length)

  function getTo80Values(nivelInicial: number, history: import('../simulation').SimulationStep[]) {
    if (nivelInicial >= 80) return { xp: 0, dungeons: 0, time: 0 }
    for (const step of history) {
      if (step.levelAfter >= 80) return { xp: step.cumulativeXP, dungeons: step.cumulativeDungeons, time: step.cumulativeTime }
    }
    return { xp: 0, dungeons: 0, time: 0 }
  }

  let totalTime = $derived(rosterResult.results.reduce((s, r) => s + r.result.metrics.totalTime, 0))
  let totalDungeons = $derived(rosterResult.results.reduce((s, r) => s + r.result.metrics.totalDungeons, 0))
  let totalTime80 = $derived(rosterResult.results.reduce((s, r) => s + getTo80Values(r.result.context.character.nivel, r.result.history).time, 0))
  let totalDungeons80 = $derived(rosterResult.results.reduce((s, r) => s + getTo80Values(r.result.context.character.nivel, r.result.history).dungeons, 0))

  let roiMap = $derived(new Map<string, number>())

  function buildDashboardPlan(
    result: MultiStartResult | null,
    roster: Personaje[],
    config: LevelingConfig,
    order: string[],
  ): OptimizationPlan {
    if (!result) {
      // Fallback: no optimization run yet — show initial Warband buff, no progression
      const initialCount90 = roster.filter(p => p.planeado_usar && p.nivel >= 90).length
      const initialBuff = Math.min(initialCount90 * 5, 25)
      return {
        entries: order.map((nombre, i) => {
          const p = roster.find(pp => pp.nombre === nombre)
          return {
            nombre, clase: p?.clase ?? '', nivel: p?.nivel ?? 0,
            objetivoNivel: 90, orden: i + 1,
            dungeonsTo90: 0, timeTo90: 0,
            dungeonsToObjective: 0, timeToObjective: 0,
            buffBefore: initialBuff, buffAfter: initialBuff,
            timeSavedForOthers: 0, roi: 0, reason: '',
          }
        }),
        optimizedTime: 0, baselineTime: 0, timeSaved: 0,
        order,
      }
    }

    const strategy = result.bestOverall.strategy
    const outcome = result.bestOverall.result.outcome
    const dias = result.bestOverall.result.dias
    const initialCount90 = roster.filter(p => p.planeado_usar && p.nivel >= 90).length
    const a90Achieved = new Set(outcome.personajesNombreA90)

    const charTime: Record<string, number> = {}
    for (const day of dias) {
      if (day.personajeActivo) {
        charTime[day.personajeActivo] = (charTime[day.personajeActivo] ?? 0) + day.horasUsadas
      }
    }

    let count90SoFar = initialCount90
    const entries: OptimizationEntry[] = strategy.decisiones.map((d, i) => {
      const buffBefore = Math.min(count90SoFar * 5, 25)
      const reaches90 = a90Achieved.has(d.personaje.nombre)
      const rs: RosterState = {
        count90: count90SoFar, warbandMentorBuff: 0, horasConsumidas: 0,
        horasDisponiblesSemana: 0, fechaActual: new Date(), fechaLimiteEvento: new Date(), diasRestantesEvento: 0,
      }
      const timeSaved = d.personaje.nivel < 90 && d.personaje.nivel >= 80 && !reaches90
        ? computeFutureTimeSaved(d.personaje, rs, roster.filter(p => p.planeado_usar), config)
        : 0
      if (reaches90) count90SoFar++
      const buffAfter = Math.min(count90SoFar * 5, 25)
      const hours = charTime[d.personaje.nombre] ?? 0
      return {
        nombre: d.personaje.nombre,
        clase: d.personaje.clase,
        nivel: d.personaje.nivel,
        objetivoNivel: 90,
        orden: i + 1,
        dungeonsTo90: Math.round(hours * 60 / config.duracionDungeon),
        timeTo90: hours,
        dungeonsToObjective: Math.round(hours * 60 / config.duracionDungeon),
        timeToObjective: hours,
        buffBefore,
        buffAfter,
        timeSavedForOthers: timeSaved,
        roi: 0,
        reason: reaches90 ? 'Sube a 90' : `Nv${d.personaje.nivel}`,
      }
    })
    return {
      entries,
      optimizedTime: outcome.tiempoTotalHoras,
      baselineTime: 0,
      timeSaved: outcome.tiempoAhorradoFuturo,
      order: strategy.decisiones.map(d => d.personaje.nombre),
    }
  }

  let dashboardPlan = $derived(buildDashboardPlan(optimizationResult, $personajesStore, config, rosterOrder))

  let results = $derived<LevelingResult[]>(
    rosterResult.results
      .map(cr => {
        const r = cr.result
        const p = personajes.find(p => p.nombre === cr.nombre)!
        const sv = calculateStrategicValue(p, config, personajes, count90)
        const to80 = getTo80Values(r.context.character.nivel, r.history)
        return {
          nombre: cr.nombre,
          clase: r.context.character.clase,
          nivel: r.context.character.nivel,
          xpTo80: to80.xp,
          dungeonsTo80: to80.dungeons,
          timeTo80: to80.time,
          xpTo90: r.metrics.totalXP,
          dungeonsTo90: r.metrics.totalDungeons,
          timeTo90: r.metrics.totalTime,
          xpPerHour: r.metrics.xpPerHour,
          done80: r.context.character.nivel >= 80,
          done90: r.context.character.nivel >= 90,
          roi: roiMap.get(cr.nombre) ?? 0,
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
      multiStart: optimizationResult,
      order: rosterOrder,
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
  <Dashboard {personajes} {config} {count90} {results} plan={dashboardPlan} />
</Modal>

<Modal bind:open={showOptimization} title="Optimización">
  {#if isOptimizing}
    <div class="lvl-opt-loading">Calculando estrategia óptima…</div>
  {:else if optimizationError}
    <div class="lvl-opt-error">Error: {optimizationError}</div>
  {:else if optimizationResult}
    <OptimizationResult result={optimizationResult} roster={$personajesStore} config={config} />
  {:else}
    <div class="lvl-opt-loading">Presiona "⚡ Optimizar" para iniciar</div>
  {/if}
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
    onEditChar={openCharEdit}
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
  .lvl-opt-loading {
    text-align: center;
    padding: 20px;
    color: var(--text-muted);
    font-size: 0.6rem;
  }
  .lvl-opt-error {
    text-align: center;
    padding: 20px;
    color: var(--horde, #c5365a);
    font-size: 0.6rem;
  }
</style>