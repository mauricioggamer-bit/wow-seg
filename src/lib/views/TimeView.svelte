<script lang="ts">
  import { uiStore } from '../stores/ui'
  import { dataStore, personajesStore, misionesStore } from '../stores/data'

  let { openTaskEdit, openMissionEdit }: { openTaskEdit?: (char: string, taskId: string) => void, openMissionEdit?: (m: any) => void } = $props()

  let timeKey = $state('')
  let warbandFilter = $state('')
  let showMisiones = $state(true)
  let showDone = $state(false)

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
      if (!p.planeado_usar) continue
      for (const t of p.tareas) {
        if (timeKey) { const fn = timeRanges[timeKey]; if (!fn || !fn(t.tiempo_min)) continue }
        if (!showDone && t.hecho) continue
        all.push({ ...t, _origen: 'tarea', personaje: p.nombre, clase: p.clase, warband: p.warband, nivel: p.nivel, faccion: p.faccion })
      }
    }
    if (showMisiones) {
      for (const m of $misionesStore) {
        if (timeKey) { const fn = timeRanges[timeKey]; if (!fn || !fn(m.tiempo_min || 0)) continue }
        if (!showDone && m.estado === 'completada') continue
        all.push({ ...m, _origen: 'mision', nombre: m.nombre, hecho: m.estado === 'completada', personaje: m.personaje || '', warband: '', prioridad: m.prioridad, tiempo_min: m.tiempo_min || 0, cooldown: m.tipo })
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

<div class="dash-minimal">
  <div class="dash-controls" style="margin-bottom:4px">
    <span class="dash-label">Tiempo:</span>
    <button class="wow-btn wow-btn-sm" class:wow-btn-primary={!timeKey} onclick={() => timeKey = ''}>Todas</button>
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
    <label style="font-size:0.55rem;display:flex;align-items:center;gap:2px;margin-left:4px">
      <input type="checkbox" bind:checked={showMisiones} /> Misiones
    </label>
    <label style="font-size:0.55rem;display:flex;align-items:center;gap:2px;margin-left:4px">
      <input type="checkbox" bind:checked={showDone} /> Hechas
    </label>
    <span class="text-xs text-muted" style="margin-left:8px">{totalDone}/{items.length} ítems</span>
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
          <div class="task-item" class:dones={t.hecho} class:mision={t._origen === 'mision'} style="padding:4px 6px">
            <input
              type="checkbox" class="task-check"
              checked={t.hecho}
              onchange={() => {
                if (t._origen === 'mision') dataStore.toggleMision(t.id)
                else dataStore.toggleTarea(t.personaje, t.id)
              }}
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
              <button onclick={() => {
                if (t._origen === 'mision' && openMissionEdit) openMissionEdit(t)
                else if (openTaskEdit) openTaskEdit(t.personaje, t.id)
              }} title="Editar"
                style="background:none;border:none;cursor:pointer;font-size:0.65rem;padding:0 2px">✏️</button>
              <button onclick={() => {
                if (t._origen === 'mision') { if (confirm('¿Eliminar misión?')) dataStore.deleteMision(t.id) }
                else { if (confirm('¿Eliminar tarea?')) dataStore.deleteTarea(t.personaje, t.id) }
              }} title="Eliminar"
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
