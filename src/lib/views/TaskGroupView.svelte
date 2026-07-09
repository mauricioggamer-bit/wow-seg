<script lang="ts">
  import { uiStore } from '../stores/ui'
  import { dataStore, personajesStore } from '../stores/data'

  let {
    filterType,
    filterOptions,
    panel = false,
    openTaskEdit,
  }: {
    filterType: 'prioridad' | 'tiempo'
    filterOptions: { key: string; label: string }[]
    panel?: boolean
    openTaskEdit?: (char: string, taskId: string) => void
  } = $props()

  let activeFilter = $state('')
  let warbandFilter = $state('')
  let showDone = $state(false)

  let warbands = $derived([...new Set($personajesStore.map(p => p.warband))].sort())

  let items = $derived.by(() => {
    const all: Array<Record<string, any>> = []
    for (const p of $personajesStore) {
      if (!p.planeado_usar) continue
      for (const t of p.tareas) {
        if (filterType === 'prioridad' && activeFilter && t.prioridad !== Number(activeFilter)) continue
        if (filterType === 'tiempo' && activeFilter) {
          const ranges: Record<string, (v: number) => boolean> = {
            rapido: v => v <= 15,
            medio: v => v >= 16 && v <= 30,
            largo: v => v >= 31 && v <= 60,
            marathon: v => v > 60,
          }
          const fn = ranges[activeFilter]
          if (fn && !fn(t.tiempo_min)) continue
        }
        if (!showDone && t.hecho) continue
        all.push({ ...t, _origen: 'tarea', personaje: p.nombre, clase: p.clase, warband: p.warband, nivel: p.nivel, faccion: p.faccion })
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
      const wb = i.warband || '(sin warband)'
      if (!g[wb]) g[wb] = []
      g[wb].push(i)
    }
    return g
  })

  let totalDone = $derived(items.filter(i => i.hecho).length)
</script>

<div class="dash-minimal" class:panel-mode={panel} style={panel ? 'max-width:none;margin:0' : ''}>
  <div class="dash-controls" style="margin-bottom:4px">
    <span class="dash-label">{filterType === 'prioridad' ? 'Prioridad:' : 'Tiempo:'}</span>
    <button class="wow-btn wow-btn-sm" class:wow-btn-primary={!activeFilter} onclick={() => activeFilter = ''}>Todas</button>
    {#each filterOptions as opt}
      <button
        class="wow-btn wow-btn-sm"
        class:wow-btn-primary={activeFilter === opt.key}
        onclick={() => activeFilter = opt.key}
      >{opt.label}</button>
    {/each}
    <span class="dash-label" style="margin-left:8px">Warband:</span>
    <select bind:value={warbandFilter} style="font-size:0.55rem;padding:1px 3px">
      <option value="">Todas</option>
      {#each warbands as wb}
        <option value={wb}>{wb}</option>
      {/each}
    </select>
    <label style="font-size:0.55rem;display:flex;align-items:center;gap:2px;margin-left:4px">
      <input type="checkbox" bind:checked={showDone} /> Hechas
    </label>
    <span class="text-xs text-muted" style="margin-left:8px">{totalDone}/{items.length} ítems</span>
  </div>

  {#each Object.entries(grouped) as [wb, tareas]}
    <div class="dash-group">
      <div class="dash-group-header">
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
                {#if t._origen === 'mision'}
                  <span class="text-xs" style="color:var(--blue-dim)">misión</span>
                {/if}
              </div>
            </div>
            <div style="display:flex;gap:2px;align-items:center;flex-shrink:0">
              <button onclick={() => { if (openTaskEdit) openTaskEdit(t.personaje, t.id) }} title="Editar"
                style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
              <button onclick={() => { if (confirm('¿Eliminar tarea?')) dataStore.deleteTarea(t.personaje, t.id) }} title="Eliminar"
                style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">🗑️</button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  {#if items.length === 0}
    <div class="empty-state"><p>Todo completado 🎉</p></div>
  {/if}
</div>
