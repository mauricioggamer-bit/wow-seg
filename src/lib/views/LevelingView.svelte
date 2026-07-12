<script lang="ts">
  import { personajesStore, dataStore } from '../stores/data'
  import { currentWarband } from '../stores/ui'
  import { levelingStore } from '../stores/leveling'
  import type { LevelingResult, Personaje, LevelingConfig } from '../types'
  import { formatHours, formatNumber } from '../format'
  import { getWarbandMentor8090FromRoster } from '../leveling/calculator'
  import { calculateStrategicValue } from '../leveling/strategicValue'
  import { getObjetivoFromTareas } from '../leveling/objetivo'
  import { WoWRetailModel, simulateRoster } from '../simulation'
  import { MAX_LEVEL } from '../constants/experience'
  import type { CharacterSnapshot, SimulationScenario } from '../simulation'
  import Modal from '../components/leveling/Modal.svelte'
  import DetailDrawer from '../components/leveling/DetailDrawer.svelte'
  import DungeonXpModal from '../components/leveling/DungeonXpModal.svelte'
  import ConfigPanel from '../components/leveling/ConfigPanel.svelte'
  import CalculationTable from '../components/leveling/CalculationTable.svelte'

  let { openCharEdit }: { openCharEdit?: (name: string) => void } = $props()

  let showConfig = $state(false)
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

  let rosterSnapshots = $derived<CharacterSnapshot[]>(
    personajes.map(p => ({
      nombre: p.nombre,
      clase: p.clase,
      nivel: p.nivel,
      xp: 0,
      objetivo: getObjetivoFromTareas(p.tareas, nivelMaximo),
      timewaysPct: p.timewaysPct ?? 0,
    }))
  )

  let nivelMaximo = $derived(Math.min(dataStore.getStrategicParam('nivelMaximo', 90) || MAX_LEVEL, MAX_LEVEL))
  let ignoreDone = $derived(dataStore.getStrategicParam('ignoreDone', 0) === 1)

  let scenario = $derived<SimulationScenario>({
    expansion: 'retail',
    version: '11.0.2',
    activeEvent: null,
    dungeonDuration: config.duracionDungeon,
    globalBuffs: [],
    maxLevel: nivelMaximo,
    ignoreDone,
  })

  let rosterOrder = $derived(personajes.map(p => p.nombre))

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

  let results = $derived<LevelingResult[]>(
    rosterResult.results
      .map(cr => {
        const r = cr.result
        const p = personajes.find(p => p.nombre === cr.nombre)!
        const sv = calculateStrategicValue(p, config, personajes, count90)
        const to80 = getTo80Values(r.context.character.nivel, r.history)
        const objetivo = r.context.character.objetivo
        const maxTareaNivel = p ? Math.max(0, ...p.tareas.map(t => t.nivelRecomendado ?? 0)) || undefined : undefined
        return {
          nombre: cr.nombre,
          clase: r.context.character.clase,
          nivel: r.context.character.nivel,
          maxTareaNivel,
          objetivo,
          xpTo80: to80.xp,
          dungeonsTo80: to80.dungeons,
          timeTo80: to80.time,
          xpTo90: r.metrics.totalXP,
          dungeonsTo90: r.metrics.totalDungeons,
          timeTo90: r.metrics.totalTime,
          xpPerHour: r.metrics.xpPerHour,
          done80: r.context.character.nivel >= 80,
          done90: r.context.character.nivel >= 90,
          doneObjetivo: r.context.character.nivel >= objetivo,
          strategicStars: sv.stars,
          strategicText: sv.reasonGroups.flatMap(g => g.subGroups ? g.subGroups.flatMap(s => s.entries) : g.entries).join(' '),
          strategicScore: sv.totalScore,
          warbandImpact: sv.warbandImpact,
        }
      })
      .sort((a, b) => {
        if (a.doneObjetivo && !b.doneObjetivo) return 1
        if (!a.doneObjetivo && b.doneObjetivo) return -1
        return a.dungeonsTo90 - b.dungeonsTo90
      })
  )

  let selectedResult = $derived(results.find(r => r.nombre === selectedChar))
  let selectedPersonaje = $derived($personajesStore.find(p => p.nombre === selectedChar))

  let drawerOpen = $derived(!!selectedChar && !!selectedResult && !!selectedPersonaje)

  function toggleConfig() { showConfig = !showConfig }
  function toggleDungeonXp() { showDungeonXp = !showDungeonXp }
  function selectChar(nombre: string) { selectedChar = selectedChar === nombre ? null : nombre }
  function closeDrawer() { selectedChar = null }

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
        <span class="lvl-buff-bar">{'█'.repeat(Math.max(0, count90))}{'░'.repeat(Math.max(0, 5 - count90))}</span>
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
      <button class="wow-btn wow-btn-sm" onclick={toggleDungeonXp}>🏰 XP Mazmorra</button>
      <button class="wow-btn wow-btn-sm" onclick={toggleConfig}>{showConfig ? '✕ Cerrar' : '⚙ Config'}</button>
    </div>
  </div>

  <CalculationTable {results} personajes={$personajesStore.filter(p => p.planeado_usar)} onSelect={selectChar} />
</div>

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
</style>