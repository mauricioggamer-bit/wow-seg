<script lang="ts">
  import { uiStore } from '../stores/ui'
  import { dataStore, personajesStore } from '../stores/data'

  let timeKey = $state('rapido')
  let warbandFilter = $state('')

  let warbands = $derived([...new Set($personajesStore.map(p => p.warband))].sort())

  let timeRanges: Record<string, (t: number) => boolean> = {
    rapido: t => t <= 15,
    medio: t => t >= 16 && t <= 30,
    largo: t => t >= 31 && t <= 60,
    marathon: t => t > 60,
  }

  let items = $derived.by(() => {
    const all: Array<Record<string, any>> = []
    for (const p of $personajesStore) {
      if (!p.activo) continue
      for (const t of p.tareas) {
        const fn = timeRanges[timeKey]
        if (fn && fn(t.tiempo_min)) {
          all.push({ ...t, personaje: p.nombre, clase: p.clase, warband: p.warband, nivel: p.nivel, faccion: p.faccion })
        }
      }
    }
    let filtered = all
    if (warbandFilter) {
      filtered = filtered.filter(i => i.warband === warbandFilter)
    }
    return filtered
  })

  let grouped = $derived.by(() => {
    const g: Record<string, typeof items> = {}
    for (const i of items) {
      if (!g[i.warband]) g[i.warband] = []
      g[i.warband].push(i)
    }
    return g
  })
</script>

<div class="dash-minimal">
  <div class="dash-controls" style="margin-bottom:4px">
    <span class="dash-label">Tiempo:</span>
    {#each [['rapido', '🟢 Rápido'], ['medio', '🟡 Medio'], ['largo', '🟠 Largo'], ['marathon', '🔴 Marathon']] as [key, label]}
      <button
        class="wow-btn wow-btn-sm"
        class:wow-btn-primary={timeKey === key}
        onclick={() => timeKey = key}
      >{label}</button>
    {/each}
    <span class="dash-label" style="margin-left:8px">Warband:</span>
    <select bind:value={warbandFilter} style="font-size:0.55rem;padding:1px 3px">
      <option value="">Todas</option>
      {#each warbands as wb}
        <option value={wb}>{wb}</option>
      {/each}
    </select>
    <span class="text-xs text-muted" style="margin-left:8px">{items.length} tareas</span>
  </div>

  {#each Object.entries(grouped) as [wb, tareas]}
    <div class="dash-group">
      <div class="dash-group-header">
        <span class="arrow">▶</span>
        <strong>{wb}</strong>
        <span class="text-xs text-muted">({tareas.filter(t => t.hecho).length}/{tareas.length})</span>
      </div>
      <div class="task-list" style="padding-left:4px;gap:1px">
        {#each tareas as t}
          <div class="task-item" class:dones={t.hecho} style="padding:4px 6px">
            <input
              type="checkbox" class="task-check"
              checked={t.hecho}
              onchange={() => dataStore.toggleTarea(t.personaje, t.id)}
              style="width:14px;height:14px"
            />
            <div class="task-info">
              <div class="task-name" style="font-size:0.75rem">
                <span class="text-xs" style="color:var(--gold);font-weight:600">{t.personaje}</span> {t.nombre}
              </div>
              <div class="task-meta" style="font-size:0.6rem">
                <span class="task-priority priority-{t.prioridad}">P{t.prioridad}</span>
                <span>{t.tiempo_min}min</span>
                <span>{t.cooldown}</span>
                {#if t.recompensa}
                  <span class="task-reward">{t.recompensa}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  {#if items.length === 0}
    <div class="empty-state"><p>No hay tareas en este rango de tiempo</p></div>
  {/if}
</div>

<style>
  .dash-group { margin-bottom: 1px; }
  .dash-group-header {
    display: flex; align-items: center; gap: 4px;
    padding: 2px 6px; cursor: pointer;
    border-radius: 2px; font-size: 0.65rem;
  }
  .dash-group-header:hover { background: var(--hover-overlay); }
  .dash-group-header .arrow { font-size: 0.5rem; color: var(--text-muted); }
  .dash-controls {
    display: flex; flex-wrap: wrap; gap: 3px;
    align-items: center; padding: 2px 0;
  }
  .dash-controls select {
    background: var(--input-bg); border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm); padding: 2px 4px;
    color: var(--text-primary); font-size: 0.55rem; font-family: var(--font-body);
  }
  .dash-label { font-size: 0.5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .wow-btn-primary { background: linear-gradient(180deg, #c9a84c, #a8882a); color: #1a1a0a; border: none; }
</style>
